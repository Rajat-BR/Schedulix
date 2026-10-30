// ============================================================
// SCHEDULIX — Priority Scheduling Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { runPriorityNP, runPriorityP } from '../../src/engine/algorithms/priority';
import type { Process } from '../../src/engine/types';

function makeProcess(pid: number, arrivalTime: number, burstTime: number, priority: number): Process {
  return { pid, name: `P${pid}`, arrivalTime, burstTime, priority, color: '#fff' };
}

describe('Priority Non-Preemptive', () => {
  it('returns empty results for empty input', () => {
    const { states } = runPriorityNP([]);
    expect(states).toHaveLength(0);
  });

  it('selects highest priority (lowest number) first', () => {
    // All arrive at t=0: P1(priority=3), P2(priority=1), P3(priority=2)
    const { gantt } = runPriorityNP([
      makeProcess(1, 0, 4, 3),
      makeProcess(2, 0, 3, 1),
      makeProcess(3, 0, 5, 2),
    ]);
    const pids = gantt.filter(s => s.pid !== 'IDLE').map(s => s.pid);
    expect(pids[0]).toBe(2); // priority 1 (highest)
    expect(pids[1]).toBe(3); // priority 2
    expect(pids[2]).toBe(1); // priority 3 (lowest)
  });

  it('does not preempt the running process', () => {
    // P1 starts running, P2 (higher priority) arrives during P1's execution
    // Non-preemptive: P1 should run to completion
    const { gantt } = runPriorityNP([
      makeProcess(1, 0, 10, 2),
      makeProcess(2, 2, 5, 0),  // higher priority
    ]);
    expect(gantt[0].pid).toBe(1);
    expect(gantt[0].endTime).toBe(10); // P1 completes uninterrupted
    expect(gantt[1].pid).toBe(2);
  });

  it('handles idle period before process arrival', () => {
    const { gantt } = runPriorityNP([makeProcess(1, 5, 3, 0)]);
    expect(gantt[0].pid).toBe('IDLE');
    expect(gantt[1].pid).toBe(1);
  });

  it('calculates metrics correctly', () => {
    const { states } = runPriorityNP([
      makeProcess(1, 0, 4, 2),
      makeProcess(2, 0, 3, 1),
    ]);
    for (const s of states) {
      expect(s.waitingTime).toBe(s.turnaroundTime! - s.burstTime);
      expect(s.turnaroundTime).toBe(s.completionTime! - s.arrivalTime);
    }
  });

  it('handles equal priorities by arrival time', () => {
    const { gantt } = runPriorityNP([
      makeProcess(1, 2, 3, 1),
      makeProcess(2, 0, 3, 1), // same priority, earlier arrival
    ]);
    const pids = gantt.filter(s => s.pid !== 'IDLE').map(s => s.pid);
    expect(pids[0]).toBe(2);
  });

  it('total executed time equals total burst time', () => {
    const processes = [
      makeProcess(1, 0, 5, 1), makeProcess(2, 2, 3, 0), makeProcess(3, 4, 2, 2),
    ];
    const { gantt } = runPriorityNP(processes);
    const totalExecuted = gantt.filter(s => s.pid !== 'IDLE').reduce((sum, s) => sum + s.duration, 0);
    const totalBurst = processes.reduce((sum, p) => sum + p.burstTime, 0);
    expect(totalExecuted).toBe(totalBurst);
  });
});

describe('Priority Preemptive', () => {
  it('returns empty results for empty input', () => {
    const { states } = runPriorityP([]);
    expect(states).toHaveLength(0);
  });

  it('preempts running process when higher priority arrives', () => {
    // P1(priority=2) running, P2(priority=0) arrives at t=2
    const { gantt } = runPriorityP([
      makeProcess(1, 0, 8, 2),
      makeProcess(2, 2, 4, 0),
    ]);
    // P1 runs 0→2, P2 preempts at t=2, P2 runs 2→6, P1 resumes 6→12
    const firstPid = gantt[0].pid;
    expect(firstPid).toBe(1);
    // A segment with P2 should exist starting at t=2
    const p2Segments = gantt.filter(s => s.pid === 2);
    expect(p2Segments.length).toBeGreaterThan(0);
    expect(p2Segments[0].startTime).toBe(2);
  });

  it('does not preempt when new process has lower priority', () => {
    // P1(priority=0) running, P2(priority=2) arrives at t=2
    // P1 has higher priority (0 < 2), so P2 should not preempt P1
    const { gantt, states } = runPriorityP([
      makeProcess(1, 0, 5, 0),
      makeProcess(2, 2, 3, 2),
    ]);
    // P1's total execution should cover the full 5 units
    const p1Segments = gantt.filter(s => s.pid === 1);
    const p1TotalTime = p1Segments.reduce((sum, s) => sum + s.duration, 0);
    expect(p1TotalTime).toBe(5);
    // P1 should complete at t=5
    const p1State = states.find(s => s.pid === 1)!;
    expect(p1State.completionTime).toBe(5);
    // P2 should not start before P1 completes
    const p2Segments = gantt.filter(s => s.pid === 2);
    if (p2Segments.length > 0) {
      expect(p2Segments[0].startTime).toBeGreaterThanOrEqual(5);
    }
  });

  it('handles multiple preemptions', () => {
    const { states } = runPriorityP([
      makeProcess(1, 0, 10, 3),
      makeProcess(2, 2, 5, 2),
      makeProcess(3, 4, 2, 1),
      makeProcess(4, 6, 3, 0),
    ]);
    for (const s of states) {
      expect(s.completionTime).not.toBeNull();
      expect(s.remainingBurstTime).toBe(0);
    }
  });

  it('total executed time equals total burst time', () => {
    const processes = [
      makeProcess(1, 0, 6, 2), makeProcess(2, 2, 3, 1), makeProcess(3, 4, 4, 0),
    ];
    const { gantt } = runPriorityP(processes);
    const totalExecuted = gantt.filter(s => s.pid !== 'IDLE').reduce((sum, s) => sum + s.duration, 0);
    const totalBurst = processes.reduce((sum, p) => sum + p.burstTime, 0);
    expect(totalExecuted).toBe(totalBurst);
  });

  it('produces no overlapping segments', () => {
    const { gantt } = runPriorityP([
      makeProcess(1, 0, 8, 2), makeProcess(2, 1, 4, 1), makeProcess(3, 2, 6, 0),
    ]);
    const sorted = [...gantt].sort((a, b) => a.startTime - b.startTime);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startTime).toBeGreaterThanOrEqual(sorted[i - 1].endTime);
    }
  });
});

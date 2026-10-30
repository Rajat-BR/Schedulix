// ============================================================
// SCHEDULIX — SJF Algorithm Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { runSJF } from '../../src/engine/algorithms/sjf';
import type { Process } from '../../src/engine/types';

function makeProcess(pid: number, arrivalTime: number, burstTime: number, priority = 0): Process {
  return { pid, name: `P${pid}`, arrivalTime, burstTime, priority, color: '#fff' };
}

describe('SJF', () => {
  it('returns empty results for empty input', () => {
    const { states, gantt } = runSJF([]);
    expect(states).toHaveLength(0);
    expect(gantt).toHaveLength(0);
  });

  it('handles single process', () => {
    const { states } = runSJF([makeProcess(1, 0, 7)]);
    expect(states[0].completionTime).toBe(7);
    expect(states[0].waitingTime).toBe(0);
  });

  it('selects shortest burst first', () => {
    // All arrive at t=0: P1=6, P2=3, P3=8, P4=1
    // SJF order: P4(1), P2(3), P1(6), P3(8)
    const { gantt } = runSJF([
      makeProcess(1, 0, 6),
      makeProcess(2, 0, 3),
      makeProcess(3, 0, 8),
      makeProcess(4, 0, 1),
    ]);
    const pids = gantt.filter(s => s.pid !== 'IDLE').map(s => s.pid);
    expect(pids).toEqual([4, 2, 1, 3]);
  });

  it('handles idle period before first arrival', () => {
    const { gantt } = runSJF([makeProcess(1, 5, 3)]);
    expect(gantt[0].pid).toBe('IDLE');
    expect(gantt[0].endTime).toBe(5);
  });

  it('calculates metrics correctly for known workload', () => {
    // Classic SJF example:
    // P1: arrival=0, burst=6 → runs 0→6, CT=6, TAT=6, WT=0
    // P2: arrival=0, burst=3 → runs after P1? No — SJF picks P2 first (burst=3 < 6)
    // At t=0: P1(6) and P2(3) both available. SJF picks P2.
    // P2: 0→3, P1: 3→9
    const { states } = runSJF([
      makeProcess(1, 0, 6),
      makeProcess(2, 0, 3),
    ]);
    const p1 = states.find(s => s.pid === 1)!;
    const p2 = states.find(s => s.pid === 2)!;
    expect(p2.completionTime).toBe(3);
    expect(p2.waitingTime).toBe(0);
    expect(p1.completionTime).toBe(9);
    expect(p1.waitingTime).toBe(3);
  });

  it('correctly re-evaluates queue when CPU is free (non-preemptive)', () => {
    // P1 runs 0→2. By then P2(4) and P3(1) have arrived.
    // SJF picks P3(1) then P2(4).
    const { gantt } = runSJF([
      makeProcess(1, 0, 2),
      makeProcess(2, 1, 4),
      makeProcess(3, 1, 1),
    ]);
    const pids = gantt.filter(s => s.pid !== 'IDLE').map(s => s.pid);
    expect(pids[0]).toBe(1);
    expect(pids[1]).toBe(3);
    expect(pids[2]).toBe(2);
  });

  it('handles tie-breaking by arrival time', () => {
    // P1(3) and P2(3) same burst, P2 arrived earlier
    const { gantt } = runSJF([
      makeProcess(1, 2, 3),
      makeProcess(2, 1, 3),
    ]);
    const pids = gantt.filter(s => s.pid !== 'IDLE').map(s => s.pid);
    expect(pids[0]).toBe(2); // P2 arrived first
  });

  it('total executed time equals total burst time', () => {
    const processes = [makeProcess(1, 0, 3), makeProcess(2, 1, 5), makeProcess(3, 2, 2)];
    const { gantt } = runSJF(processes);
    const totalExecuted = gantt.filter(s => s.pid !== 'IDLE').reduce((sum, s) => sum + s.duration, 0);
    const totalBurst = processes.reduce((sum, p) => sum + p.burstTime, 0);
    expect(totalExecuted).toBe(totalBurst);
  });

  it('produces no overlapping segments', () => {
    const { gantt } = runSJF([
      makeProcess(1, 0, 5), makeProcess(2, 2, 3), makeProcess(3, 4, 1),
    ]);
    const sorted = [...gantt].sort((a, b) => a.startTime - b.startTime);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startTime).toBeGreaterThanOrEqual(sorted[i - 1].endTime);
    }
  });

  it('each process completes exactly once', () => {
    const { states } = runSJF([
      makeProcess(1, 0, 4), makeProcess(2, 1, 2),
    ]);
    for (const s of states) {
      expect(s.completionTime).not.toBeNull();
      expect(s.remainingBurstTime).toBe(0);
    }
  });
});

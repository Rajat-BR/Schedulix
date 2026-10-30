// ============================================================
// SCHEDULIX — FCFS Algorithm Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { runFCFS } from '../../src/engine/algorithms/fcfs';
import type { Process } from '../../src/engine/types';

function makeProcess(
  pid: number,
  arrivalTime: number,
  burstTime: number,
  priority = 0
): Process {
  return { pid, name: `P${pid}`, arrivalTime, burstTime, priority, color: '#fff' };
}

describe('FCFS', () => {
  it('returns empty results for empty input', () => {
    const { states, gantt, events } = runFCFS([]);
    expect(states).toHaveLength(0);
    expect(gantt).toHaveLength(0);
  });

  it('handles single process correctly', () => {
    const { states, gantt } = runFCFS([makeProcess(1, 0, 5)]);
    expect(states[0].completionTime).toBe(5);
    expect(states[0].turnaroundTime).toBe(5);
    expect(states[0].waitingTime).toBe(0);
    expect(states[0].responseTime).toBe(0);
    expect(gantt[0]).toMatchObject({ pid: 1, startTime: 0, endTime: 5, duration: 5 });
  });

  it('handles multiple processes in FCFS order', () => {
    const { states, gantt } = runFCFS([
      makeProcess(1, 0, 4),
      makeProcess(2, 1, 3),
      makeProcess(3, 2, 2),
    ]);
    // P1: 0→4, P2: 4→7, P3: 7→9
    const p1 = states.find(s => s.pid === 1)!;
    const p2 = states.find(s => s.pid === 2)!;
    const p3 = states.find(s => s.pid === 3)!;

    expect(p1.completionTime).toBe(4);
    expect(p1.waitingTime).toBe(0);
    expect(p2.completionTime).toBe(7);
    expect(p2.waitingTime).toBe(3); // 4-1=3
    expect(p3.completionTime).toBe(9);
    expect(p3.waitingTime).toBe(5); // 7-2=5
  });

  it('handles CPU idle period when process arrives late', () => {
    const { gantt } = runFCFS([makeProcess(1, 5, 3)]);
    expect(gantt[0]).toMatchObject({ pid: 'IDLE', startTime: 0, endTime: 5 });
    expect(gantt[1]).toMatchObject({ pid: 1, startTime: 5, endTime: 8 });
  });

  it('resolves simultaneous arrivals by input order', () => {
    const { gantt } = runFCFS([
      makeProcess(2, 0, 3),
      makeProcess(1, 0, 2),
    ]);
    // P2 was first in input, so goes first
    expect(gantt[0].pid).toBe(2);
    expect(gantt[1].pid).toBe(1);
  });

  it('calculates turnaround time correctly: TAT = CT - AT', () => {
    const { states } = runFCFS([
      makeProcess(1, 0, 5),
      makeProcess(2, 2, 3),
    ]);
    const p2 = states.find(s => s.pid === 2)!;
    expect(p2.turnaroundTime).toBe(p2.completionTime! - p2.arrivalTime);
  });

  it('calculates waiting time correctly: WT = TAT - BT', () => {
    const { states } = runFCFS([
      makeProcess(1, 0, 5),
      makeProcess(2, 2, 3),
    ]);
    for (const s of states) {
      expect(s.waitingTime).toBe(s.turnaroundTime! - s.burstTime);
    }
  });

  it('calculates response time correctly: RT = first exec - arrival', () => {
    const { states } = runFCFS([
      makeProcess(1, 0, 5),
      makeProcess(2, 2, 3),
    ]);
    for (const s of states) {
      expect(s.responseTime).toBe(s.firstExecutionTime! - s.arrivalTime);
    }
  });

  it('total executed time equals total burst time', () => {
    const processes = [
      makeProcess(1, 0, 5),
      makeProcess(2, 1, 3),
      makeProcess(3, 6, 4),
    ];
    const { gantt } = runFCFS(processes);
    const totalExecuted = gantt
      .filter(seg => seg.pid !== 'IDLE')
      .reduce((sum, seg) => sum + seg.duration, 0);
    const totalBurst = processes.reduce((sum, p) => sum + p.burstTime, 0);
    expect(totalExecuted).toBe(totalBurst);
  });

  it('produces no overlapping segments', () => {
    const { gantt } = runFCFS([
      makeProcess(1, 0, 3),
      makeProcess(2, 2, 4),
      makeProcess(3, 5, 2),
    ]);
    const sorted = [...gantt].sort((a, b) => a.startTime - b.startTime);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startTime).toBeGreaterThanOrEqual(sorted[i - 1].endTime);
    }
  });

  it('each process completes exactly once', () => {
    const { states } = runFCFS([
      makeProcess(1, 0, 3),
      makeProcess(2, 1, 2),
    ]);
    for (const s of states) {
      expect(s.completionTime).not.toBeNull();
      expect(s.remainingBurstTime).toBe(0);
    }
  });
});

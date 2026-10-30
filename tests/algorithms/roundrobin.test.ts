// ============================================================
// SCHEDULIX — Round Robin Algorithm Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { runRoundRobin, computeRoundRobinQueue } from '../../src/engine/algorithms/roundrobin';
import type { Process } from '../../src/engine/types';

function makeProcess(pid: number, arrivalTime: number, burstTime: number, priority = 0): Process {
  return { pid, name: `P${pid}`, arrivalTime, burstTime, priority, color: '#fff' };
}

describe('Round Robin', () => {
  it('returns empty results for empty input', () => {
    const { states, gantt } = runRoundRobin([], 2);
    expect(states).toHaveLength(0);
    expect(gantt).toHaveLength(0);
  });

  it('throws for invalid time quantum', () => {
    expect(() => runRoundRobin([makeProcess(1, 0, 5)], 0)).toThrow();
  });

  it('handles single process, burst smaller than quantum', () => {
    const { states, gantt } = runRoundRobin([makeProcess(1, 0, 3)], 5);
    expect(gantt).toHaveLength(1);
    expect(gantt[0].duration).toBe(3);
    expect(states[0].completionTime).toBe(3);
  });

  it('handles single process, burst larger than quantum', () => {
    const { states, gantt } = runRoundRobin([makeProcess(1, 0, 7)], 3);
    // 3 + 3 + 1 = 7
    const p1segs = gantt.filter(s => s.pid === 1);
    expect(p1segs).toHaveLength(3);
    expect(p1segs[2].duration).toBe(1);
    expect(states[0].completionTime).toBe(7);
  });

  it('serves processes in FIFO order within quantum', () => {
    // quantum=2, P1(4), P2(3), P3(2)
    // All at t=0: P1 gets 0-2, P2 gets 2-4, P3 gets 4-6, P1 gets 6-8, P2 gets 8-9
    const { gantt } = runRoundRobin([
      makeProcess(1, 0, 4),
      makeProcess(2, 0, 3),
      makeProcess(3, 0, 2),
    ], 2);
    const pids = gantt.map(s => s.pid);
    expect(pids[0]).toBe(1);
    expect(pids[1]).toBe(2);
    expect(pids[2]).toBe(3);
  });

  it('correctly handles quantum expiry and reinsertion', () => {
    const { gantt, states } = runRoundRobin([
      makeProcess(1, 0, 5),
      makeProcess(2, 0, 5),
    ], 2);
    // Both complete, no process left unfinished
    for (const s of states) {
      expect(s.completionTime).not.toBeNull();
      expect(s.remainingBurstTime).toBe(0);
    }
  });

  it('handles process arrival during execution', () => {
    // P1 at t=0 (burst=5), P2 at t=2 (burst=3)
    // quantum=4: P1 runs 0-4, at t=4 P2 is in queue first, then P1 re-inserted
    const { gantt } = runRoundRobin([
      makeProcess(1, 0, 5),
      makeProcess(2, 2, 3),
    ], 4);
    const pids = gantt.map(s => s.pid);
    expect(pids[0]).toBe(1); // P1 runs first
  });

  it('calculates metrics correctly', () => {
    const { states } = runRoundRobin([
      makeProcess(1, 0, 4),
      makeProcess(2, 0, 3),
    ], 2);
    for (const s of states) {
      expect(s.waitingTime).toBe(s.turnaroundTime! - s.burstTime);
      expect(s.turnaroundTime).toBe(s.completionTime! - s.arrivalTime);
    }
  });

  it('total executed time equals total burst time', () => {
    const processes = [
      makeProcess(1, 0, 5), makeProcess(2, 1, 3), makeProcess(3, 2, 4),
    ];
    const { gantt } = runRoundRobin(processes, 2);
    const totalExecuted = gantt.filter(s => s.pid !== 'IDLE').reduce((sum, s) => sum + s.duration, 0);
    const totalBurst = processes.reduce((sum, p) => sum + p.burstTime, 0);
    expect(totalExecuted).toBe(totalBurst);
  });

  it('produces no overlapping segments', () => {
    const { gantt } = runRoundRobin([
      makeProcess(1, 0, 5), makeProcess(2, 1, 3), makeProcess(3, 3, 4),
    ], 2);
    const sorted = [...gantt].sort((a, b) => a.startTime - b.startTime);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startTime).toBeGreaterThanOrEqual(sorted[i - 1].endTime);
    }
  });

  it('handles CPU idle period when no process available', () => {
    const { gantt } = runRoundRobin([makeProcess(1, 5, 3)], 2);
    expect(gantt[0].pid).toBe('IDLE');
  });

  it('handles simultaneous arrivals consistently', () => {
    const { states } = runRoundRobin([
      makeProcess(1, 0, 4),
      makeProcess(2, 0, 4),
      makeProcess(3, 0, 4),
    ], 2);
    for (const s of states) {
      expect(s.completionTime).not.toBeNull();
      expect(s.remainingBurstTime).toBe(0);
    }
  });

  it('response time is first execution minus arrival', () => {
    const { states } = runRoundRobin([
      makeProcess(1, 0, 5),
      makeProcess(2, 0, 3),
    ], 2);
    for (const s of states) {
      expect(s.responseTime).toBe(s.firstExecutionTime! - s.arrivalTime);
    }
  });

  describe('computeRoundRobinQueue', () => {
    it('correctly rotates ready queue across time slices', () => {
      const processes = [
        makeProcess(1, 0, 4),
        makeProcess(2, 0, 4),
        makeProcess(3, 0, 4),
      ];
      const { gantt } = runRoundRobin(processes, 2);

      // t=0: P1 runs [0, 2], ready queue should be [P2, P3]
      expect(computeRoundRobinQueue(processes, gantt, 0, 2)).toEqual([2, 3]);
      expect(computeRoundRobinQueue(processes, gantt, 1, 2)).toEqual([2, 3]);

      // t=2: P1 quantum expires (goes to back), P2 runs [2, 4], ready queue should be [P3, P1]
      expect(computeRoundRobinQueue(processes, gantt, 2, 2)).toEqual([3, 1]);
      expect(computeRoundRobinQueue(processes, gantt, 3, 2)).toEqual([3, 1]);

      // t=4: P2 quantum expires (goes to back), P3 runs [4, 6], ready queue should be [P1, P2]
      expect(computeRoundRobinQueue(processes, gantt, 4, 2)).toEqual([1, 2]);
      expect(computeRoundRobinQueue(processes, gantt, 5, 2)).toEqual([1, 2]);

      // t=6: P3 quantum expires, P1 runs [6, 8], ready queue should be [P2, P3]
      expect(computeRoundRobinQueue(processes, gantt, 6, 2)).toEqual([2, 3]);

      // t=8: P1 completes at 8, P2 runs [8, 10], ready queue should be [P3]
      expect(computeRoundRobinQueue(processes, gantt, 8, 2)).toEqual([3]);

      // t=10: P2 completes at 10, P3 runs [10, 12], ready queue should be []
      expect(computeRoundRobinQueue(processes, gantt, 10, 2)).toEqual([]);

      // t=12: All complete
      expect(computeRoundRobinQueue(processes, gantt, 12, 2)).toEqual([]);
    });

    it('handles staggered arrivals and preemption ordering properly', () => {
      const processes = [
        makeProcess(1, 0, 5),
        makeProcess(2, 2, 3),
        makeProcess(3, 3, 2),
      ];
      const { gantt } = runRoundRobin(processes, 2);

      // At t=0: P1 running, nobody else arrived yet
      expect(computeRoundRobinQueue(processes, gantt, 0, 2)).toEqual([]);
      expect(computeRoundRobinQueue(processes, gantt, 1, 2)).toEqual([]);

      // At t=2: P1 quantum expires, P2 arrives at t=2.
      // Newly arrived P2 joins before preempted P1 -> queue had [P2, P1].
      // P2 dispatched for [2, 4], leaving P1 in ready queue.
      expect(computeRoundRobinQueue(processes, gantt, 2, 2)).toEqual([1]);

      // At t=3: P3 arrives while P2 is running -> ready queue has [P1, P3]
      expect(computeRoundRobinQueue(processes, gantt, 3, 2)).toEqual([1, 3]);

      // At t=4: P2 quantum expires -> P2 re-enters at back of queue [P1, P3, P2].
      // P1 dispatched for [4, 6], leaving [P3, P2] in ready queue!
      expect(computeRoundRobinQueue(processes, gantt, 4, 2)).toEqual([3, 2]);
    });

    it('returns queue before dispatch when includeRunning is true', () => {
      const processes = [
        makeProcess(1, 0, 4),
        makeProcess(2, 0, 4),
        makeProcess(3, 0, 4),
      ];
      const { gantt } = runRoundRobin(processes, 2);

      // At t=2, right before P2 is dispatched, ready queue was [P2, P3, P1]
      expect(computeRoundRobinQueue(processes, gantt, 2, 2, { includeRunning: true })).toEqual([2, 3, 1]);
    });
  });
});

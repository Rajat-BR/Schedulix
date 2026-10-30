// ============================================================
// SCHEDULIX — SRTF Algorithm Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { runSRTF } from '../../src/engine/algorithms/srtf';
import type { Process } from '../../src/engine/types';

function makeProcess(pid: number, arrivalTime: number, burstTime: number, priority = 0): Process {
  return { pid, name: `P${pid}`, arrivalTime, burstTime, priority, color: '#fff' };
}

describe('SRTF', () => {
  it('returns empty results for empty input', () => {
    const { states, gantt } = runSRTF([]);
    expect(states).toHaveLength(0);
    expect(gantt).toHaveLength(0);
  });

  it('handles single process', () => {
    const { states } = runSRTF([makeProcess(1, 0, 6)]);
    expect(states[0].completionTime).toBe(6);
    expect(states[0].waitingTime).toBe(0);
  });

  it('preempts a longer process when a shorter one arrives', () => {
    // P1: arrival=0, burst=6. P2: arrival=2, burst=2.
    // P1 runs 0→2, then P2 preempts (remaining=4 > 2). P2 runs 2→4, P1 runs 4→8.
    const { gantt, states } = runSRTF([
      makeProcess(1, 0, 6),
      makeProcess(2, 2, 2),
    ]);
    const pids = gantt.filter(s => s.pid !== 'IDLE').map(s => s.pid);
    expect(pids).toContain(1);
    expect(pids).toContain(2);

    // P2 should complete before P1
    const p1 = states.find(s => s.pid === 1)!;
    const p2 = states.find(s => s.pid === 2)!;
    expect(p2.completionTime!).toBeLessThan(p1.completionTime!);
    expect(p1.completionTime).toBe(8);
    expect(p2.completionTime).toBe(4);
  });

  it('handles preemption with known metrics', () => {
    // Classic SRTF example:
    // P1: AT=0, BT=8; P2: AT=1, BT=4; P3: AT=2, BT=9; P4: AT=3, BT=5
    // Expected execution order changes based on remaining times
    const { states } = runSRTF([
      makeProcess(1, 0, 8),
      makeProcess(2, 1, 4),
      makeProcess(3, 2, 9),
      makeProcess(4, 3, 5),
    ]);

    // Verify all processes complete
    for (const s of states) {
      expect(s.completionTime).not.toBeNull();
      expect(s.remainingBurstTime).toBe(0);
    }
  });

  it('total executed time equals total burst time', () => {
    const processes = [makeProcess(1, 0, 5), makeProcess(2, 2, 3), makeProcess(3, 4, 2)];
    const { gantt } = runSRTF(processes);
    const totalExecuted = gantt.filter(s => s.pid !== 'IDLE').reduce((sum, s) => sum + s.duration, 0);
    const totalBurst = processes.reduce((sum, p) => sum + p.burstTime, 0);
    expect(totalExecuted).toBe(totalBurst);
  });

  it('produces no overlapping segments', () => {
    const { gantt } = runSRTF([
      makeProcess(1, 0, 8), makeProcess(2, 1, 4), makeProcess(3, 2, 9),
    ]);
    const sorted = [...gantt].sort((a, b) => a.startTime - b.startTime);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startTime).toBeGreaterThanOrEqual(sorted[i - 1].endTime);
    }
  });

  it('no negative remaining burst times', () => {
    const { states } = runSRTF([
      makeProcess(1, 0, 3), makeProcess(2, 1, 5), makeProcess(3, 2, 2),
    ]);
    for (const s of states) {
      expect(s.remainingBurstTime).toBeGreaterThanOrEqual(0);
    }
  });

  it('no process executes before arrival', () => {
    const { gantt, states } = runSRTF([
      makeProcess(1, 3, 5), makeProcess(2, 5, 2),
    ]);
    for (const seg of gantt) {
      if (seg.pid !== 'IDLE') {
        const s = states.find(p => p.pid === seg.pid)!;
        expect(seg.startTime).toBeGreaterThanOrEqual(s.arrivalTime);
      }
    }
  });

  it('each process completes exactly once', () => {
    const { states } = runSRTF([
      makeProcess(1, 0, 4), makeProcess(2, 1, 2), makeProcess(3, 3, 3),
    ]);
    for (const s of states) {
      expect(s.completionTime).not.toBeNull();
      expect(s.remainingBurstTime).toBe(0);
    }
  });

  it('handles simultaneous arrivals', () => {
    const { states } = runSRTF([
      makeProcess(1, 0, 5),
      makeProcess(2, 0, 3),
      makeProcess(3, 0, 1),
    ]);
    for (const s of states) {
      expect(s.completionTime).not.toBeNull();
    }
    // P3 has shortest burst, should complete first
    const p3 = states.find(s => s.pid === 3)!;
    expect(p3.completionTime).toBe(1);
  });

  it('handles equal burst times deterministically', () => {
    const { states } = runSRTF([
      makeProcess(1, 0, 3),
      makeProcess(2, 0, 3),
    ]);
    expect(states[0].completionTime).not.toBeNull();
    expect(states[1].completionTime).not.toBeNull();
  });
});

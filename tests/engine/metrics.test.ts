// ============================================================
// SCHEDULIX — Metrics Calculation Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { calculateMetrics, verifyTrace } from '../../src/engine/metrics';
import { runFCFS } from '../../src/engine/algorithms/fcfs';
import { runSRTF } from '../../src/engine/algorithms/srtf';
import { runRoundRobin } from '../../src/engine/algorithms/roundrobin';
import type { Process, ProcessState, ExecutionSegment } from '../../src/engine/types';

function makeProcess(pid: number, arrivalTime: number, burstTime: number, priority = 0): Process {
  return { pid, name: `P${pid}`, arrivalTime, burstTime, priority, color: '#fff' };
}

describe('Metrics Calculation', () => {
  it('handles empty process list', () => {
    const metrics = calculateMetrics([], []);
    expect(metrics.averageWaitingTime).toBe(0);
    expect(metrics.cpuUtilization).toBe(0);
    expect(metrics.throughput).toBe(0);
  });

  it('calculates correct averages for FCFS workload', () => {
    const processes = [
      makeProcess(1, 0, 5),
      makeProcess(2, 2, 3),
    ];
    const { states, gantt } = runFCFS(processes);
    const metrics = calculateMetrics(states, gantt);
    // P1: WT=0, P2: WT=3 → avg=1.5
    expect(metrics.averageWaitingTime).toBe(1.5);
    // P1: TAT=5, P2: TAT=6 → avg=5.5
    expect(metrics.averageTurnaroundTime).toBe(5.5);
  });

  it('calculates CPU utilization correctly with idle period', () => {
    const { states, gantt } = runFCFS([makeProcess(1, 5, 5)]);
    const metrics = calculateMetrics(states, gantt);
    // CPU runs 5→10, total elapsed = 10-5=5, busy=5, util=100%
    expect(metrics.cpuUtilization).toBe(100);
  });

  it('calculates CPU utilization < 100 when idle periods exist', () => {
    const { states, gantt } = runFCFS([
      makeProcess(1, 0, 2),
      makeProcess(2, 5, 3),
    ]);
    const metrics = calculateMetrics(states, gantt);
    // Runs 0→2, idle 2→5, runs 5→8. Elapsed=8, busy=5, idle=3
    // util = 5/8 * 100 = 62.5
    expect(metrics.cpuUtilization).toBeCloseTo(62.5, 1);
  });

  it('calculates throughput correctly', () => {
    const { states, gantt } = runFCFS([
      makeProcess(1, 0, 4),
      makeProcess(2, 0, 4),
    ]);
    const metrics = calculateMetrics(states, gantt);
    // 2 processes, elapsed=8, throughput = 2/8 = 0.25
    expect(metrics.throughput).toBeCloseTo(0.25, 4);
  });

  it('counts context switches correctly', () => {
    // P1→P2→P1 has 2 context switches (P1→P2 and P2→P1)
    const { states, gantt } = runRoundRobin([
      makeProcess(1, 0, 4),
      makeProcess(2, 0, 3),
    ], 2);
    const metrics = calculateMetrics(states, gantt);
    // P1 runs 0-2, P2 runs 2-4, P1 runs 4-6, P2 runs 6-7
    // Switches: P1→P2 (t=2), P2→P1 (t=4), P1→P2 (t=6) = 3
    expect(metrics.contextSwitches).toBeGreaterThan(0);
  });

  it('does not count transitions to/from IDLE as context switches', () => {
    const { states, gantt } = runFCFS([
      makeProcess(1, 0, 3),
      makeProcess(2, 6, 2),
    ]);
    const metrics = calculateMetrics(states, gantt);
    // P1 runs, then IDLE, then P2 runs — no process-to-process switches
    expect(metrics.contextSwitches).toBe(0);
  });

  it('response time is first execution minus arrival', () => {
    const { states } = runFCFS([
      makeProcess(1, 0, 5),
      makeProcess(2, 2, 3),
    ]);
    for (const s of states) {
      expect(s.responseTime).toBe(s.firstExecutionTime! - s.arrivalTime);
    }
  });
});

describe('Trace Verification', () => {
  it('validates a correct trace', () => {
    const { states, gantt } = runFCFS([
      makeProcess(1, 0, 5),
      makeProcess(2, 5, 3),
    ]);
    const result = verifyTrace(states, gantt);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects overlapping segments', () => {
    const states: ProcessState[] = [{
      pid: 1, name: 'P1', arrivalTime: 0, burstTime: 5, priority: 0, color: '',
      remainingBurstTime: 0, firstExecutionTime: 0, completionTime: 5,
      waitingTime: 0, turnaroundTime: 5, responseTime: 0,
    }];
    const gantt: ExecutionSegment[] = [
      { pid: 1, processName: 'P1', startTime: 0, endTime: 5, duration: 5 },
      { pid: 1, processName: 'P1', startTime: 3, endTime: 7, duration: 4 }, // overlaps
    ];
    const result = verifyTrace(states, gantt);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates SRTF trace correctness', () => {
    const { states, gantt } = runSRTF([
      makeProcess(1, 0, 8),
      makeProcess(2, 2, 4),
      makeProcess(3, 4, 2),
    ]);
    const result = verifyTrace(states, gantt);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// SCHEDULIX — Metrics Calculator
// Computes aggregate performance metrics from execution trace.
// ============================================================

import type { ProcessState, ExecutionSegment, SimulationMetrics } from './types';
import { countContextSwitches } from './algorithms/utils';

export function calculateMetrics(
  states: ProcessState[],
  gantt: ExecutionSegment[]
): SimulationMetrics {
  if (states.length === 0) {
    return {
      averageWaitingTime: 0,
      averageTurnaroundTime: 0,
      averageResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      contextSwitches: 0,
      totalBurstTime: 0,
      totalIdleTime: 0,
      elapsedTime: 0,
    };
  }

  const completed = states.filter(s => s.completionTime !== null);

  // Average metrics
  const n = completed.length;
  const averageWaitingTime =
    n > 0 ? completed.reduce((sum, s) => sum + (s.waitingTime ?? 0), 0) / n : 0;
  const averageTurnaroundTime =
    n > 0 ? completed.reduce((sum, s) => sum + (s.turnaroundTime ?? 0), 0) / n : 0;
  const averageResponseTime =
    n > 0 ? completed.reduce((sum, s) => sum + (s.responseTime ?? 0), 0) / n : 0;

  // CPU Utilization: CPU busy time / elapsed simulation time × 100
  const cpuBusySegments = gantt.filter(seg => seg.pid !== 'IDLE');
  const totalBurstTime = cpuBusySegments.reduce((sum, seg) => sum + seg.duration, 0);

  const idleSegments = gantt.filter(seg => seg.pid === 'IDLE');
  const totalIdleTime = idleSegments.reduce((sum, seg) => sum + seg.duration, 0);

  // Elapsed simulation time = from first arrival to last completion
  const firstArrival = Math.min(...states.map(s => s.arrivalTime));
  const lastCompletion = Math.max(...completed.map(s => s.completionTime!));
  const elapsedTime = lastCompletion - firstArrival;

  const cpuUtilization =
    elapsedTime > 0 ? (totalBurstTime / elapsedTime) * 100 : 0;

  // Throughput = processes completed / elapsed time
  const throughput = elapsedTime > 0 ? completed.length / elapsedTime : 0;

  // Context switches
  const contextSwitches = countContextSwitches(gantt);

  return {
    averageWaitingTime: round2(averageWaitingTime),
    averageTurnaroundTime: round2(averageTurnaroundTime),
    averageResponseTime: round2(averageResponseTime),
    cpuUtilization: round2(cpuUtilization),
    throughput: round4(throughput),
    contextSwitches,
    totalBurstTime,
    totalIdleTime,
    elapsedTime,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Verify execution trace integrity */
export interface TraceIntegrityResult {
  valid: boolean;
  errors: string[];
}

export function verifyTrace(
  states: ProcessState[],
  gantt: ExecutionSegment[]
): TraceIntegrityResult {
  const errors: string[] = [];

  // Check for overlapping segments
  const sorted = [...gantt].sort((a, b) => a.startTime - b.startTime);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime < sorted[i - 1].endTime) {
      errors.push(
        `Overlapping segments: [${sorted[i-1].startTime},${sorted[i-1].endTime}] and [${sorted[i].startTime},${sorted[i].endTime}]`
      );
    }
  }

  // Check no negative burst times
  for (const s of states) {
    if (s.remainingBurstTime < 0) {
      errors.push(`Process ${s.pid} has negative remaining burst: ${s.remainingBurstTime}`);
    }
  }

  // Check total CPU time equals total burst time
  const totalExecuted = gantt
    .filter(seg => seg.pid !== 'IDLE')
    .reduce((sum, seg) => sum + seg.duration, 0);
  const totalBurst = states.reduce((sum, s) => sum + s.burstTime, 0);
  if (Math.abs(totalExecuted - totalBurst) > 0.001) {
    errors.push(`Total executed CPU time (${totalExecuted}) ≠ total burst time (${totalBurst})`);
  }

  // Check every process completed exactly once
  for (const s of states) {
    if (s.completionTime === null) {
      errors.push(`Process ${s.pid} (${s.name}) never completed`);
    }
    if (s.remainingBurstTime !== 0) {
      errors.push(`Process ${s.pid} (${s.name}) has remaining burst time ${s.remainingBurstTime}`);
    }
  }

  // Check no process executes before arrival
  const pidSegments = new Map<number, ExecutionSegment[]>();
  for (const seg of gantt) {
    if (seg.pid !== 'IDLE') {
      if (!pidSegments.has(seg.pid)) pidSegments.set(seg.pid, []);
      pidSegments.get(seg.pid)!.push(seg);
    }
  }

  for (const s of states) {
    const segs = pidSegments.get(s.pid) ?? [];
    for (const seg of segs) {
      if (seg.startTime < s.arrivalTime) {
        errors.push(`Process ${s.pid} executes at t=${seg.startTime} before arrival at t=${s.arrivalTime}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

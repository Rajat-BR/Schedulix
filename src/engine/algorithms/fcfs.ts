// ============================================================
// SCHEDULIX — FCFS (First Come, First Served) Algorithm
// Non-preemptive. Processes executed in arrival order.
// Tie-breaking: stable input order (lower index = higher preference).
// ============================================================

import type {
  Process,
  ProcessState,
  ExecutionSegment,
  SchedulingEvent,
} from '../types';
import { initProcessStates, addIdleIfNeeded, recordEvent } from './utils';

export function runFCFS(processes: Process[]): {
  states: ProcessState[];
  gantt: ExecutionSegment[];
  events: SchedulingEvent[];
} {
  if (processes.length === 0) {
    return { states: [], gantt: [], events: [] };
  }

  const states = initProcessStates(processes);
  const gantt: ExecutionSegment[] = [];
  const events: SchedulingEvent[] = [];

  // Sort by arrival time, then by original input order for stable tie-breaking
  const sorted = [...states].sort(
    (a, b) =>
      a.arrivalTime - b.arrivalTime ||
      processes.findIndex(p => p.pid === a.pid) -
        processes.findIndex(p => p.pid === b.pid)
  );

  // Record arrivals
  for (const s of states) {
    recordEvent(events, s.arrivalTime, 'ARRIVAL', s.pid, s.name, `Process ${s.name} arrived at t=${s.arrivalTime}`);
  }

  let time = 0;

  for (const state of sorted) {
    // CPU idle gap
    if (time < state.arrivalTime) {
      addIdleIfNeeded(gantt, events, time, state.arrivalTime);
      time = state.arrivalTime;
    }

    // First execution time
    state.firstExecutionTime = time;
    state.responseTime = time - state.arrivalTime;

    recordEvent(events, time, 'DISPATCH', state.pid, state.name,
      `Dispatched ${state.name} (burst=${state.burstTime}, priority=${state.priority})`);

    const endTime = time + state.burstTime;

    gantt.push({
      pid: state.pid,
      processName: state.name,
      startTime: time,
      endTime,
      duration: state.burstTime,
    });

    time = endTime;
    state.remainingBurstTime = 0;
    state.completionTime = time;
    state.turnaroundTime = time - state.arrivalTime;
    state.waitingTime = state.turnaroundTime - state.burstTime;

    recordEvent(events, time, 'COMPLETION', state.pid, state.name,
      `Process ${state.name} completed at t=${time} (TAT=${state.turnaroundTime}, WT=${state.waitingTime})`);
  }

  return { states, gantt, events };
}

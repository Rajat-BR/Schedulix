// ============================================================
// SCHEDULIX — SJF (Shortest Job First) Algorithm
// Non-preemptive. When CPU is free, select the arrived process
// with the shortest burst time.
// Tie-breaking: arrival time, then input order.
// ============================================================

import type {
  Process,
  ProcessState,
  ExecutionSegment,
  SchedulingEvent,
} from '../types';
import { initProcessStates, addIdleIfNeeded, recordEvent } from './utils';

export function runSJF(processes: Process[]): {
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
  const completed = new Set<number>();

  // Record arrivals
  for (const s of states) {
    recordEvent(events, s.arrivalTime, 'ARRIVAL', s.pid, s.name, `Process ${s.name} arrived at t=${s.arrivalTime}`);
  }

  let time = 0;
  const totalProcesses = states.length;

  while (completed.size < totalProcesses) {
    // Find all processes that have arrived and are not completed
    const available = states.filter(
      s => s.arrivalTime <= time && !completed.has(s.pid)
    );

    if (available.length === 0) {
      // CPU is idle — advance to next arrival
      const nextArrival = states
        .filter(s => !completed.has(s.pid))
        .map(s => s.arrivalTime)
        .sort((a, b) => a - b)[0];

      if (nextArrival === undefined) break;
      addIdleIfNeeded(gantt, events, time, nextArrival);
      time = nextArrival;
      continue;
    }

    // Select process with shortest burst time
    // Tie-break: arrival time (earlier first), then input order
    available.sort(
      (a, b) =>
        a.burstTime - b.burstTime ||
        a.arrivalTime - b.arrivalTime ||
        processes.findIndex(p => p.pid === a.pid) -
          processes.findIndex(p => p.pid === b.pid)
    );

    const selected = available[0];

    selected.firstExecutionTime = time;
    selected.responseTime = time - selected.arrivalTime;

    recordEvent(events, time, 'DISPATCH', selected.pid, selected.name,
      `Dispatched ${selected.name} (burst=${selected.burstTime}) — shortest available`);

    const endTime = time + selected.burstTime;

    gantt.push({
      pid: selected.pid,
      processName: selected.name,
      startTime: time,
      endTime,
      duration: selected.burstTime,
    });

    time = endTime;
    selected.remainingBurstTime = 0;
    selected.completionTime = time;
    selected.turnaroundTime = time - selected.arrivalTime;
    selected.waitingTime = selected.turnaroundTime - selected.burstTime;

    completed.add(selected.pid);

    recordEvent(events, time, 'COMPLETION', selected.pid, selected.name,
      `Process ${selected.name} completed at t=${time}`);
  }

  return { states, gantt, events };
}

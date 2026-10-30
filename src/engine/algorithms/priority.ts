// ============================================================
// SCHEDULIX — Priority Scheduling Algorithm
// Two variants: Non-preemptive and Preemptive.
// Lower numeric value = higher priority.
// Tie-breaking: arrival time, then input order.
// ============================================================

import type {
  Process,
  ProcessState,
  ExecutionSegment,
  SchedulingEvent,
} from '../types';
import { initProcessStates, addIdleIfNeeded, recordEvent } from './utils';

/** Non-preemptive Priority Scheduling */
export function runPriorityNP(processes: Process[]): {
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

  for (const s of states) {
    recordEvent(events, s.arrivalTime, 'ARRIVAL', s.pid, s.name, `Process ${s.name} arrived at t=${s.arrivalTime}`);
  }

  let time = 0;
  const totalProcesses = states.length;

  while (completed.size < totalProcesses) {
    const available = states.filter(
      s => s.arrivalTime <= time && !completed.has(s.pid)
    );

    if (available.length === 0) {
      const nextArrival = states
        .filter(s => !completed.has(s.pid))
        .map(s => s.arrivalTime)
        .sort((a, b) => a - b)[0];

      if (nextArrival === undefined) break;
      addIdleIfNeeded(gantt, events, time, nextArrival);
      time = nextArrival;
      continue;
    }

    // Lower priority number = higher priority
    available.sort(
      (a, b) =>
        a.priority - b.priority ||
        a.arrivalTime - b.arrivalTime ||
        processes.findIndex(p => p.pid === a.pid) -
          processes.findIndex(p => p.pid === b.pid)
    );

    const selected = available[0];
    selected.firstExecutionTime = time;
    selected.responseTime = time - selected.arrivalTime;

    recordEvent(events, time, 'DISPATCH', selected.pid, selected.name,
      `Dispatched ${selected.name} (priority=${selected.priority}, burst=${selected.burstTime})`);

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

/** Preemptive Priority Scheduling */
export function runPriorityP(processes: Process[]): {
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

  for (const s of states) {
    recordEvent(events, s.arrivalTime, 'ARRIVAL', s.pid, s.name, `Process ${s.name} arrived at t=${s.arrivalTime}`);
  }

  let time = 0;
  let running: ProcessState | null = null;
  let segmentStart = 0;
  const totalProcesses = states.length;

  function selectProcess(t: number): ProcessState | null {
    const available = states.filter(
      s => s.arrivalTime <= t && !completed.has(s.pid) && s.remainingBurstTime > 0
    );
    if (available.length === 0) return null;

    available.sort(
      (a, b) =>
        a.priority - b.priority ||
        a.arrivalTime - b.arrivalTime ||
        processes.findIndex(p => p.pid === a.pid) -
          processes.findIndex(p => p.pid === b.pid)
    );

    return available[0];
  }

  function getNextEventTime(currentTime: number): number {
    const futureArrivals = states
      .filter(s => s.arrivalTime > currentTime && !completed.has(s.pid))
      .map(s => s.arrivalTime);

    const nextArrival = futureArrivals.length > 0 ? Math.min(...futureArrivals) : Infinity;

    if (running) {
      const runnerCompletion = currentTime + running.remainingBurstTime;
      return Math.min(nextArrival, runnerCompletion);
    }
    return nextArrival;
  }

  let iterations = 0;
  const maxIterations = processes.reduce((sum, p) => sum + p.burstTime, 0) * 10 + 1000;

  while (completed.size < totalProcesses) {
    iterations++;
    if (iterations > maxIterations) break;

    const selected = selectProcess(time);

    if (!selected) {
      const nextArrival = states
        .filter(s => !completed.has(s.pid))
        .map(s => s.arrivalTime)
        .sort((a, b) => a - b)[0];

      if (nextArrival === undefined) break;
      addIdleIfNeeded(gantt, events, time, nextArrival);
      time = nextArrival;
      running = null;
      continue;
    }

    // Preemption check
    if (running && running.pid !== selected.pid) {
      if (segmentStart < time) {
        gantt.push({
          pid: running.pid,
          processName: running.name,
          startTime: segmentStart,
          endTime: time,
          duration: time - segmentStart,
        });
      }
      recordEvent(events, time, 'PREEMPTION', running.pid, running.name,
        `${running.name} preempted by ${selected.name} (priority ${selected.priority} < ${running.priority})`);
      recordEvent(events, time, 'DISPATCH', selected.pid, selected.name,
        `Dispatched ${selected.name} (priority=${selected.priority})`);
      segmentStart = time;
    } else if (running === null || running.pid !== selected.pid) {
      recordEvent(events, time, 'DISPATCH', selected.pid, selected.name,
        `Dispatched ${selected.name} (priority=${selected.priority})`);
      segmentStart = time;
    }

    if (selected.firstExecutionTime === null) {
      selected.firstExecutionTime = time;
      selected.responseTime = time - selected.arrivalTime;
    }

    running = selected;

    const nextEvent = getNextEventTime(time);
    const runDuration = Math.min(selected.remainingBurstTime, nextEvent - time);

    if (runDuration <= 0) {
      time = nextEvent;
      continue;
    }

    selected.remainingBurstTime -= runDuration;
    time += runDuration;

    if (selected.remainingBurstTime === 0) {
      gantt.push({
        pid: selected.pid,
        processName: selected.name,
        startTime: segmentStart,
        endTime: time,
        duration: time - segmentStart,
      });

      selected.completionTime = time;
      selected.turnaroundTime = time - selected.arrivalTime;
      selected.waitingTime = selected.turnaroundTime - selected.burstTime;
      completed.add(selected.pid);
      running = null;
      segmentStart = time;

      recordEvent(events, time, 'COMPLETION', selected.pid, selected.name,
        `Process ${selected.name} completed at t=${time}`);
    } else {
      gantt.push({
        pid: selected.pid,
        processName: selected.name,
        startTime: segmentStart,
        endTime: time,
        duration: time - segmentStart,
      });
      segmentStart = time;
    }
  }

  return { states, gantt, events };
}

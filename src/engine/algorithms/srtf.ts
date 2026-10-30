// ============================================================
// SCHEDULIX — SRTF (Shortest Remaining Time First) Algorithm
// Preemptive SJF. Re-evaluate when any new process arrives.
// Tie-breaking: arrival time, then remaining burst, then input order.
// ============================================================

import type {
  Process,
  ProcessState,
  ExecutionSegment,
  SchedulingEvent,
} from '../types';
import { initProcessStates, addIdleIfNeeded, recordEvent } from './utils';

export function runSRTF(processes: Process[]): {
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
  let running: ProcessState | null = null;
  let segmentStart = 0;
  const totalProcesses = states.length;

  // Collect all event times: arrivals + (for safety) loop by 1-unit steps
  // We simulate at discrete time points where scheduling decisions occur.
  // Events: every arrival time and every completion time.

  function getNextEventTime(currentTime: number): number {
    const futureArrivals = states
      .filter(s => s.arrivalTime > currentTime && !completed.has(s.pid))
      .map(s => s.arrivalTime);

    if (futureArrivals.length === 0) {
      // No future arrivals, next event is current runner's completion
      if (running) return currentTime + running.remainingBurstTime;
      return Infinity;
    }

    const nextArrival = Math.min(...futureArrivals);

    if (running) {
      const runnerCompletion = currentTime + running.remainingBurstTime;
      return Math.min(nextArrival, runnerCompletion);
    }

    return nextArrival;
  }

  function selectProcess(time: number): ProcessState | null {
    const available = states.filter(
      s => s.arrivalTime <= time && !completed.has(s.pid) && s.remainingBurstTime > 0
    );
    if (available.length === 0) return null;

    available.sort(
      (a, b) =>
        a.remainingBurstTime - b.remainingBurstTime ||
        a.arrivalTime - b.arrivalTime ||
        processes.findIndex(p => p.pid === a.pid) -
          processes.findIndex(p => p.pid === b.pid)
    );

    return available[0];
  }

  // Safety guard against infinite loops
  let iterations = 0;
  const maxIterations = processes.reduce((sum, p) => sum + p.burstTime, 0) * 10 + 1000;

  while (completed.size < totalProcesses) {
    iterations++;
    if (iterations > maxIterations) break;

    const selected = selectProcess(time);

    if (!selected) {
      // CPU idle — advance to next arrival
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

    // Preemption check: if selected differs from running, record context switch
    if (running && running.pid !== selected.pid) {
      // Finalize current running segment
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
        `${running.name} preempted by ${selected.name} (remaining=${running.remainingBurstTime})`);
      recordEvent(events, time, 'DISPATCH', selected.pid, selected.name,
        `Dispatched ${selected.name} (remaining=${selected.remainingBurstTime})`);
      segmentStart = time;
    } else if (running === null || running.pid !== selected.pid) {
      // Fresh dispatch (from idle or initial)
      if (running === null) {
        recordEvent(events, time, 'DISPATCH', selected.pid, selected.name,
          `Dispatched ${selected.name} (remaining=${selected.remainingBurstTime})`);
      }
      segmentStart = time;
    }

    if (selected.firstExecutionTime === null) {
      selected.firstExecutionTime = time;
      selected.responseTime = time - selected.arrivalTime;
    }

    running = selected;

    // Determine how long to run before next event
    const nextEvent = getNextEventTime(time);
    const runDuration = Math.min(selected.remainingBurstTime, nextEvent - time);

    if (runDuration <= 0) {
      // Advance time to next event without running
      time = nextEvent;
      continue;
    }

    selected.remainingBurstTime -= runDuration;
    time += runDuration;

    if (selected.remainingBurstTime === 0) {
      // Process completed
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
      // Preemption will happen at next iteration — finalize segment
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

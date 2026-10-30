// ============================================================
// SCHEDULIX — Round Robin (RR) Algorithm
// Preemptive. Each process gets a configurable time quantum.
// After quantum expires, the unfinished process is re-inserted
// at the back of the ready queue.
//
// Event ordering convention:
// When quantum expires and new processes arrive at the same time:
//   1. The newly arrived processes join the ready queue first.
//   2. The preempted process is then re-inserted.
// This matches the most common academic definition.
// ============================================================

import type {
  Process,
  ProcessState,
  ExecutionSegment,
  SchedulingEvent,
} from '../types';
import { initProcessStates, addIdleIfNeeded, recordEvent } from './utils';

export function runRoundRobin(
  processes: Process[],
  timeQuantum: number
): {
  states: ProcessState[];
  gantt: ExecutionSegment[];
  events: SchedulingEvent[];
} {
  if (processes.length === 0) {
    return { states: [], gantt: [], events: [] };
  }

  if (timeQuantum <= 0) throw new Error('Time quantum must be > 0');

  const states = initProcessStates(processes);
  const gantt: ExecutionSegment[] = [];
  const events: SchedulingEvent[] = [];
  const completed = new Set<number>();

  // Build a map for quick lookup
  const stateMap = new Map<number, ProcessState>(states.map(s => [s.pid, s]));

  for (const s of states) {
    recordEvent(events, s.arrivalTime, 'ARRIVAL', s.pid, s.name, `Process ${s.name} arrived at t=${s.arrivalTime}`);
  }

  let time = 0;
  // FIFO ready queue (stores PIDs in queue order)
  const readyQueue: number[] = [];
  const enqueued = new Set<number>(); // tracks which pids are currently in queue

  // Sort by arrival time, then input order for initial queue population
  const sortedByArrival = [...states].sort(
    (a, b) =>
      a.arrivalTime - b.arrivalTime ||
      processes.findIndex(p => p.pid === a.pid) -
        processes.findIndex(p => p.pid === b.pid)
  );

  function enqueueArrived(currentTime: number, excludePid?: number): void {
    for (const s of sortedByArrival) {
      if (
        s.arrivalTime <= currentTime &&
        !completed.has(s.pid) &&
        !enqueued.has(s.pid) &&
        s.remainingBurstTime > 0 &&
        s.pid !== excludePid
      ) {
        readyQueue.push(s.pid);
        enqueued.add(s.pid);
      }
    }
  }

  const totalProcesses = states.length;
  let iterations = 0;
  const maxIterations = states.reduce((sum, s) => sum + s.burstTime, 0) * 10 + 1000;

  while (completed.size < totalProcesses) {
    iterations++;
    if (iterations > maxIterations) break;

    // Enqueue any processes that have arrived
    enqueueArrived(time);

    if (readyQueue.length === 0) {
      // CPU idle — advance to next arrival
      const nextArrival = sortedByArrival
        .filter(s => !completed.has(s.pid) && s.arrivalTime > time)
        .map(s => s.arrivalTime)
        .sort((a, b) => a - b)[0];

      if (nextArrival === undefined) break;
      addIdleIfNeeded(gantt, events, time, nextArrival);
      time = nextArrival;
      enqueueArrived(time);
      continue;
    }

    const pid = readyQueue.shift()!;
    enqueued.delete(pid);

    const state = stateMap.get(pid)!;

    if (state.firstExecutionTime === null) {
      state.firstExecutionTime = time;
      state.responseTime = time - state.arrivalTime;
    }

    const runDuration = Math.min(state.remainingBurstTime, timeQuantum);
    const endTime = time + runDuration;

    recordEvent(events, time, 'DISPATCH', state.pid, state.name,
      `Dispatched ${state.name} (remaining=${state.remainingBurstTime}, quantum=${timeQuantum})`);

    gantt.push({
      pid: state.pid,
      processName: state.name,
      startTime: time,
      endTime,
      duration: runDuration,
    });

    state.remainingBurstTime -= runDuration;
    time = endTime;

    if (state.remainingBurstTime === 0) {
      state.completionTime = time;
      state.turnaroundTime = time - state.arrivalTime;
      state.waitingTime = state.turnaroundTime - state.burstTime;
      completed.add(state.pid);

      recordEvent(events, time, 'COMPLETION', state.pid, state.name,
        `Process ${state.name} completed at t=${time}`);

      // Enqueue newly arrived processes (not the completed one)
      enqueueArrived(time);
    } else {
      // Quantum expired — process not finished
      recordEvent(events, time, 'QUANTUM_EXPIRY', state.pid, state.name,
        `Quantum expired for ${state.name} (remaining=${state.remainingBurstTime})`);

      // Convention: newly arrived processes join queue BEFORE the preempted process
      enqueueArrived(time, state.pid);

      // Re-insert the preempted process at the back
      readyQueue.push(state.pid);
      enqueued.add(state.pid);
    }
  }

  return { states, gantt, events };
}

/**
 * Computes the ready queue (as an ordered list of PIDs) for Round Robin at a given currentTime.
 * Follows standard academic Round Robin queue semantics:
 * - Processes enter ready queue upon arrival in arrival order.
 * - The dispatched process runs on the CPU and is NOT in the ready queue during execution.
 * - When a process's quantum expires:
 *     1. Newly arrived processes at or before the expiration time enter the queue first.
 *     2. The preempted process is re-inserted at the tail of the ready queue.
 * - When options.includeRunning is true (used when analyzing a scheduling decision at segment.startTime),
 *   the dispatched process is included at index 0 (front of the queue), followed by competitors in queue order.
 */
export function computeRoundRobinQueue(
  processes: (Process | ProcessState)[],
  ganttChart: ExecutionSegment[],
  currentTime: number,
  timeQuantum: number,
  options?: { includeRunning?: boolean }
): number[] {
  if (processes.length === 0) return [];

  const remainingBurst = new Map<number, number>(
    processes.map(p => [p.pid, p.burstTime])
  );
  const completed = new Set<number>();
  const readyQueue: number[] = [];
  const enqueued = new Set<number>();

  const sortedByArrival = [...processes].sort(
    (a, b) =>
      a.arrivalTime - b.arrivalTime ||
      processes.findIndex(p => p.pid === a.pid) -
        processes.findIndex(p => p.pid === b.pid)
  );

  function enqueueArrived(t: number, excludePid?: number): void {
    for (const s of sortedByArrival) {
      if (
        s.arrivalTime <= t &&
        !completed.has(s.pid) &&
        !enqueued.has(s.pid) &&
        (remainingBurst.get(s.pid) ?? 0) > 0 &&
        s.pid !== excludePid
      ) {
        readyQueue.push(s.pid);
        enqueued.add(s.pid);
      }
    }
  }

  for (let i = 0; i < ganttChart.length; i++) {
    const seg = ganttChart[i];

    if (seg.startTime > currentTime) {
      break;
    }

    if (seg.pid === 'IDLE') {
      if (currentTime < seg.endTime) {
        enqueueArrived(currentTime);
        return [...readyQueue];
      } else {
        enqueueArrived(seg.endTime);
        continue;
      }
    }

    // Process arrived up to segment start
    enqueueArrived(seg.startTime);

    // If includeRunning is requested and currentTime matches segment start,
    // return queue before dispatch with seg.pid at index 0
    if (options?.includeRunning && currentTime === seg.startTime) {
      const queueBeforeDispatch = [...readyQueue];
      if (!queueBeforeDispatch.includes(seg.pid)) {
        queueBeforeDispatch.unshift(seg.pid);
      } else {
        const pIdx = queueBeforeDispatch.indexOf(seg.pid);
        if (pIdx > 0) {
          queueBeforeDispatch.splice(pIdx, 1);
          queueBeforeDispatch.unshift(seg.pid);
        }
      }
      return queueBeforeDispatch;
    }

    // seg.pid is dispatched from ready queue
    const idx = readyQueue.indexOf(seg.pid);
    if (idx !== -1) {
      readyQueue.splice(idx, 1);
      enqueued.delete(seg.pid);
    }

    // If currentTime is strictly within this segment
    if (currentTime < seg.endTime) {
      enqueueArrived(currentTime, seg.pid);
      return [...readyQueue];
    }

    // Segment finished (currentTime >= seg.endTime)
    // 1. Newly arrived processes enter queue first
    enqueueArrived(seg.endTime, seg.pid);

    // 2. Decrement remaining burst
    const rem = (remainingBurst.get(seg.pid) ?? 0) - seg.duration;
    remainingBurst.set(seg.pid, Math.max(0, rem));

    if (rem <= 0) {
      completed.add(seg.pid);
    } else {
      // 3. Preempted process is re-inserted at back
      readyQueue.push(seg.pid);
      enqueued.add(seg.pid);
    }
  }

  // If currentTime is at or past end of ganttChart
  enqueueArrived(currentTime);
  return [...readyQueue];
}

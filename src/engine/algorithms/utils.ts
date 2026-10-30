// ============================================================
// SCHEDULIX — Algorithm Utilities
// Shared helpers for scheduling algorithm implementations.
// ============================================================

import type { Process, ProcessState, SchedulingEvent, SchedulingEventType } from '../types';

/** Initialize ProcessState objects from Process inputs */
export function initProcessStates(processes: Process[]): ProcessState[] {
  return processes.map(p => ({
    pid: p.pid,
    name: p.name,
    arrivalTime: p.arrivalTime,
    burstTime: p.burstTime,
    priority: p.priority,
    color: p.color,
    remainingBurstTime: p.burstTime,
    firstExecutionTime: null,
    completionTime: null,
    waitingTime: null,
    turnaroundTime: null,
    responseTime: null,
  }));
}

/** Find all processes that have arrived by the given time */
export function findArrived(
  states: ProcessState[],
  time: number,
  completed: Set<number>
): ProcessState[] {
  return states.filter(
    s => s.arrivalTime <= time && !completed.has(s.pid) && s.remainingBurstTime > 0
  );
}

/** Record a scheduling event */
export function recordEvent(
  events: SchedulingEvent[],
  time: number,
  type: SchedulingEventType,
  pid?: number,
  processName?: string,
  details?: string
): void {
  events.push({ time, type, pid, processName, details: details ?? '' });
}

/** Add an IDLE segment to the Gantt chart if there is a gap */
export function addIdleIfNeeded(
  gantt: { pid: number | 'IDLE'; processName: string; startTime: number; endTime: number; duration: number }[],
  events: SchedulingEvent[],
  from: number,
  to: number
): void {
  if (from < to) {
    gantt.push({
      pid: 'IDLE',
      processName: 'IDLE',
      startTime: from,
      endTime: to,
      duration: to - from,
    });
    recordEvent(events, from, 'IDLE_START', undefined, undefined, `CPU idle ${from}→${to}`);
    recordEvent(events, to, 'IDLE_END', undefined, undefined, 'CPU resumes');
  }
}

/** Count context switches: number of times execution transitions process→different process */
export function countContextSwitches(
  gantt: { pid: number | 'IDLE'; startTime: number; endTime: number; duration: number; processName: string }[]
): number {
  let switches = 0;
  let lastProcessPid: number | 'IDLE' | null = null;

  for (const seg of gantt) {
    if (seg.pid === 'IDLE') {
      // Transitions to/from IDLE are not counted as process-to-process context switches
      lastProcessPid = 'IDLE';
      continue;
    }
    if (lastProcessPid !== null && lastProcessPid !== 'IDLE' && lastProcessPid !== seg.pid) {
      switches++;
    }
    lastProcessPid = seg.pid;
  }

  return switches;
}

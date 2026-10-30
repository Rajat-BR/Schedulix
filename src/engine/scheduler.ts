// ============================================================
// SCHEDULIX — Main Scheduler
// Entry point for running any scheduling algorithm.
// Orchestrates algorithm selection, trace computation, and metrics.
// ============================================================

import type {
  Process,
  AlgorithmConfig,
  SimulationResult,
  ProcessState,
  ExecutionSegment,
  SchedulingEvent,
  SchedulingDecision,
} from './types';
import { runFCFS } from './algorithms/fcfs';
import { runSJF } from './algorithms/sjf';
import { runSRTF } from './algorithms/srtf';
import { runPriorityNP, runPriorityP } from './algorithms/priority';
import { runRoundRobin, computeRoundRobinQueue } from './algorithms/roundrobin';
import { calculateMetrics } from './metrics';
import { validateProcessList, validateAlgorithmConfig } from './validation';

export interface SchedulerError {
  type: 'VALIDATION' | 'EXECUTION';
  message: string;
  details?: string[];
}

export type SchedulerResult =
  | { success: true; result: SimulationResult }
  | { success: false; error: SchedulerError };

/** Run the scheduling simulation */
export function runScheduler(
  processes: Process[],
  config: AlgorithmConfig
): SchedulerResult {
  // Validate input
  const processErrors = validateProcessList(processes);
  const configErrors = validateAlgorithmConfig(config);
  const allErrors = [...processErrors, ...configErrors];

  if (allErrors.length > 0) {
    return {
      success: false,
      error: {
        type: 'VALIDATION',
        message: 'Invalid input',
        details: allErrors.map(e => e.message),
      },
    };
  }

  try {
    let states: ProcessState[];
    let gantt: ExecutionSegment[];
    let events: SchedulingEvent[];

    switch (config.type) {
      case 'FCFS': {
        const r = runFCFS(processes);
        states = r.states; gantt = r.gantt; events = r.events;
        break;
      }
      case 'SJF': {
        const r = runSJF(processes);
        states = r.states; gantt = r.gantt; events = r.events;
        break;
      }
      case 'SRTF': {
        const r = runSRTF(processes);
        states = r.states; gantt = r.gantt; events = r.events;
        break;
      }
      case 'PRIORITY_NP': {
        const r = runPriorityNP(processes);
        states = r.states; gantt = r.gantt; events = r.events;
        break;
      }
      case 'PRIORITY_P': {
        const r = runPriorityP(processes);
        states = r.states; gantt = r.gantt; events = r.events;
        break;
      }
      case 'RR': {
        const quantum = config.timeQuantum ?? 2;
        const r = runRoundRobin(processes, quantum);
        states = r.states; gantt = r.gantt; events = r.events;
        break;
      }
      default:
        return {
          success: false,
          error: { type: 'EXECUTION', message: `Unknown algorithm: ${config.type}` },
        };
    }

    const metrics = calculateMetrics(states, gantt);
    const totalTime = gantt.length > 0 ? gantt[gantt.length - 1].endTime : 0;

    // Chronologically sort events
    const eventOrder: Record<string, number> = {
      ARRIVAL: 1,
      COMPLETION: 2,
      QUANTUM_EXPIRY: 3,
      PREEMPTION: 4,
      IDLE_START: 5,
      IDLE_END: 6,
      DISPATCH: 7,
      CONTEXT_SWITCH: 8,
    };
    events.sort((a, b) => {
      if (a.time !== b.time) return a.time - b.time;
      return (eventOrder[a.type] ?? 99) - (eventOrder[b.type] ?? 99);
    });

    return {
      success: true,
      result: {
        algorithm: config.type,
        algorithmConfig: config,
        processes: states,
        ganttChart: gantt,
        events,
        metrics,
        totalTime,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: {
        type: 'EXECUTION',
        message: err instanceof Error ? err.message : 'Unknown execution error',
      },
    };
  }
}

/** Generate scheduling decision explanation for a Gantt segment */
export function explainDecision(
  result: SimulationResult,
  config: AlgorithmConfig,
  segmentIndex: number
): SchedulingDecision | null {
  const segment = result.ganttChart[segmentIndex];
  if (!segment) return null;

  const t = segment.startTime;

  // Find which processes were available at time t
  const stateAtT = result.processes.map(p => {
    // Calculate remaining burst at time t from the gantt chart
    const executedBefore = result.ganttChart
      .filter(seg => seg.pid === p.pid && seg.endTime <= t)
      .reduce((sum, seg) => sum + seg.duration, 0);
    const remaining = p.burstTime - executedBefore;
    const waitingTime = t - p.arrivalTime - executedBefore;

    return {
      pid: p.pid,
      name: p.name,
      arrivalTime: p.arrivalTime,
      remainingBurst: remaining,
      priority: p.priority,
      waitingTime: Math.max(0, waitingTime),
    };
  });

  const availableAtT = stateAtT.filter(
    s => s.arrivalTime <= t && s.remainingBurst > 0
  );

  // Sort available processes in the algorithm's ready queue priority order at decision time t
  if (config.type === 'RR') {
    const queueOrder = computeRoundRobinQueue(
      result.processes,
      result.ganttChart,
      t,
      config.timeQuantum ?? 2,
      { includeRunning: true }
    );
    const orderMap = new Map<number, number>(queueOrder.map((pid, idx) => [pid, idx]));
    availableAtT.sort((a, b) => {
      const idxA = orderMap.has(a.pid) ? orderMap.get(a.pid)! : 9999;
      const idxB = orderMap.has(b.pid) ? orderMap.get(b.pid)! : 9999;
      return idxA - idxB;
    });
  } else if (config.type === 'FCFS') {
    availableAtT.sort((a, b) => {
      const arrDiff = a.arrivalTime - b.arrivalTime;
      if (arrDiff !== 0) return arrDiff;
      return (
        result.processes.findIndex(p => p.pid === a.pid) -
        result.processes.findIndex(p => p.pid === b.pid)
      );
    });
  } else if (config.type === 'SJF') {
    availableAtT.sort((a, b) => {
      const burstDiff = a.remainingBurst - b.remainingBurst;
      if (burstDiff !== 0) return burstDiff;
      const arrDiff = a.arrivalTime - b.arrivalTime;
      if (arrDiff !== 0) return arrDiff;
      return (
        result.processes.findIndex(p => p.pid === a.pid) -
        result.processes.findIndex(p => p.pid === b.pid)
      );
    });
  } else if (config.type === 'SRTF') {
    availableAtT.sort((a, b) => {
      const remDiff = a.remainingBurst - b.remainingBurst;
      if (remDiff !== 0) return remDiff;
      const arrDiff = a.arrivalTime - b.arrivalTime;
      if (arrDiff !== 0) return arrDiff;
      return (
        result.processes.findIndex(p => p.pid === a.pid) -
        result.processes.findIndex(p => p.pid === b.pid)
      );
    });
  } else if (config.type === 'PRIORITY_NP' || config.type === 'PRIORITY_P') {
    availableAtT.sort((a, b) => {
      const prioDiff = a.priority - b.priority;
      if (prioDiff !== 0) return prioDiff;
      const arrDiff = a.arrivalTime - b.arrivalTime;
      if (arrDiff !== 0) return arrDiff;
      return (
        result.processes.findIndex(p => p.pid === a.pid) -
        result.processes.findIndex(p => p.pid === b.pid)
      );
    });
  }

  // Check if preemption occurred (previous segment was a different process)
  const prevSegment = segmentIndex > 0 ? result.ganttChart[segmentIndex - 1] : null;
  const preemptionOccurred =
    prevSegment !== null &&
    prevSegment.pid !== 'IDLE' &&
    segment.pid !== 'IDLE' &&
    prevSegment.pid !== segment.pid &&
    prevSegment.endTime === segment.startTime;

  let reason = '';

  if (segment.pid === 'IDLE') {
    reason = `No process available at t=${t}. CPU is idle until next arrival.`;
  } else {
    const selectedAvailable = availableAtT.find(a => a.pid === segment.pid);

    switch (config.type) {
      case 'FCFS':
        reason = `FCFS selects the process that arrived earliest. ${segment.processName} arrived first among available processes.`;
        if (preemptionOccurred) reason += ' (FCFS is non-preemptive, no preemption occurs)';
        break;

      case 'SJF': {
        const minBurst = Math.min(...availableAtT.map(a => a.remainingBurst));
        reason = `SJF selects the process with the shortest burst time. ${segment.processName} has burst=${selectedAvailable?.remainingBurst} (minimum among ${availableAtT.length} available processes, min=${minBurst}).`;
        break;
      }

      case 'SRTF': {
        const minRemaining = Math.min(...availableAtT.map(a => a.remainingBurst));
        reason = `SRTF selects the process with the shortest remaining time. ${segment.processName} has remaining=${selectedAvailable?.remainingBurst} (minimum=${minRemaining}).`;
        if (preemptionOccurred) reason += ` Preemption occurred because a newly arrived process had a shorter remaining time.`;
        break;
      }

      case 'PRIORITY_NP': {
        const minPriority = Math.min(...availableAtT.map(a => a.priority));
        reason = `Non-preemptive Priority selects the process with the highest priority (lowest number). ${segment.processName} has priority=${selectedAvailable?.priority} (minimum=${minPriority}).`;
        break;
      }

      case 'PRIORITY_P': {
        const minPriority = Math.min(...availableAtT.map(a => a.priority));
        reason = `Preemptive Priority selects the process with the highest priority (lowest number). ${segment.processName} has priority=${selectedAvailable?.priority} (minimum=${minPriority}).`;
        if (preemptionOccurred) reason += ` Preemption occurred because a higher-priority process arrived.`;
        break;
      }

      case 'RR': {
        const quantum = config.timeQuantum ?? 2;
        reason = `Round Robin serves processes in FIFO order with quantum=${quantum}. ${segment.processName} was at the front of the ready queue at t=${t}.`;
        if (preemptionOccurred) reason += ` The previous process was preempted due to quantum expiry.`;
        break;
      }
    }
  }

  return {
    timestamp: t,
    selectedPid: segment.pid,
    selectedProcessName: segment.processName,
    availableProcesses: availableAtT,
    reason,
    preemptionOccurred,
    algorithm: config.type,
  };
}

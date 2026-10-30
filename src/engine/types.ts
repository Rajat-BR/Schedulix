// ============================================================
// SCHEDULIX — Core Type Definitions
// ============================================================

/** A single process in the simulation */
export interface Process {
  pid: number;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color: string;
}

/** Internal process state during simulation */
export interface ProcessState {
  pid: number;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color: string;
  remainingBurstTime: number;
  firstExecutionTime: number | null;
  completionTime: number | null;
  waitingTime: number | null;
  turnaroundTime: number | null;
  responseTime: number | null;
}

/** A single execution segment in the Gantt chart */
export interface ExecutionSegment {
  pid: number | 'IDLE';
  processName: string;
  startTime: number;
  endTime: number;
  duration: number;
}

/** Types of scheduling events */
export type SchedulingEventType =
  | 'ARRIVAL'
  | 'DISPATCH'
  | 'PREEMPTION'
  | 'QUANTUM_EXPIRY'
  | 'COMPLETION'
  | 'IDLE_START'
  | 'IDLE_END'
  | 'CONTEXT_SWITCH';

/** A scheduling event recorded during simulation */
export interface SchedulingEvent {
  time: number;
  type: SchedulingEventType;
  pid?: number;
  processName?: string;
  details: string;
}

/** Supported scheduling algorithms */
export type AlgorithmType =
  | 'FCFS'
  | 'SJF'
  | 'SRTF'
  | 'PRIORITY_NP'
  | 'PRIORITY_P'
  | 'RR';

/** Algorithm configuration */
export interface AlgorithmConfig {
  type: AlgorithmType;
  timeQuantum?: number;  // for Round Robin
}

/** Complete simulation result */
export interface SimulationResult {
  algorithm: AlgorithmType;
  algorithmConfig: AlgorithmConfig;
  processes: ProcessState[];
  ganttChart: ExecutionSegment[];
  events: SchedulingEvent[];
  metrics: SimulationMetrics;
  totalTime: number;
}

/** Aggregate performance metrics */
export interface SimulationMetrics {
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  contextSwitches: number;
  totalBurstTime: number;
  totalIdleTime: number;
  elapsedTime: number;
}

/** Ready queue entry (used during simulation) */
export interface ReadyQueueEntry {
  pid: number;
  remainingBurstTime: number;
  arrivalTime: number;
  priority: number;
  name: string;
  color: string;
  insertionOrder: number; // for stable tie-breaking
}

/** Playback state for simulation replay */
export interface PlaybackState {
  currentTime: number;
  isPlaying: boolean;
  speed: 1 | 2 | 4 | 8;
  currentSegmentIndex: number;
  completedProcesses: number;
  activeSegment: ExecutionSegment | null;
  readyQueue: ReadyQueueEntry[];
  runningProcess: ProcessState | null;
}

/** Validation error for process input */
export interface ValidationError {
  field: string;
  message: string;
}

/** Predefined workload */
export interface SampleWorkload {
  id: string;
  name: string;
  description: string;
  processes: Omit<Process, 'color'>[];
  recommendedAlgorithm?: AlgorithmType;
  recommendedQuantum?: number;
}

/** Algorithm metadata for the UI */
export interface AlgorithmInfo {
  type: AlgorithmType;
  name: string;
  shortName: string;
  isPreemptive: boolean;
  description: string;
  complexity: string;
  usesPriority: boolean;
  usesQuantum: boolean;
}

/** Decision explanation for a selected Gantt segment */
export interface SchedulingDecision {
  timestamp: number;
  selectedPid: number | 'IDLE';
  selectedProcessName: string;
  availableProcesses: {
    pid: number;
    name: string;
    remainingBurst: number;
    priority: number;
    waitingTime: number;
  }[];
  reason: string;
  preemptionOccurred: boolean;
  algorithm: AlgorithmType;
}

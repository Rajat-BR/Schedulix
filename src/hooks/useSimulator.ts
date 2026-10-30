// ============================================================
// SCHEDULIX — Simulation Store Hook
// Central state management for the simulator.
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Process, AlgorithmConfig, SimulationResult, PlaybackState, ReadyQueueEntry } from '../engine/types';
import { runScheduler } from '../engine/scheduler';
import { computeRoundRobinQueue } from '../engine/algorithms/roundrobin';
import { getProcessColor } from '../data/workloads';

let nextPid = 1;

function generatePid(existing: Process[]): number {
  const usedPids = new Set(existing.map(p => p.pid));
  while (usedPids.has(nextPid)) nextPid++;
  return nextPid++;
}

const DEFAULT_PROCESSES: Process[] = [
  { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 8, priority: 2, color: getProcessColor(0) },
  { pid: 2, name: 'P2', arrivalTime: 2, burstTime: 4, priority: 1, color: getProcessColor(1) },
  { pid: 3, name: 'P3', arrivalTime: 4, burstTime: 6, priority: 3, color: getProcessColor(2) },
];

const DEFAULT_CONFIG: AlgorithmConfig = { type: 'FCFS' };

export interface SimulatorState {
  processes: Process[];
  config: AlgorithmConfig;
  result: SimulationResult | null;
  error: string | null;
  playback: PlaybackState;
}

export interface SimulatorActions {
  addProcess: () => void;
  updateProcess: (pid: number, updates: Partial<Omit<Process, 'pid' | 'color'>>) => void;
  deleteProcess: (pid: number) => void;
  setProcesses: (processes: Process[]) => void;
  setConfig: (config: AlgorithmConfig) => void;
  runSimulation: () => void;
  resetSimulation: () => void;
  // Playback
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  setSpeed: (speed: 1 | 2 | 4 | 8) => void;
  seekTo: (time: number) => void;
  // Workload utilities
  generateRandom: (count?: number) => void;
  loadWorkload: (processes: Omit<Process, 'color'>[]) => void;
  clearProcesses: () => void;
}

function computePlaybackState(
  result: SimulationResult,
  currentTime: number
): Omit<PlaybackState, 'isPlaying' | 'speed'> {
  const gantt = result.ganttChart;

  // Find current segment index
  let currentSegmentIndex = -1;
  for (let i = 0; i < gantt.length; i++) {
    if (gantt[i].startTime <= currentTime && currentTime < gantt[i].endTime) {
      currentSegmentIndex = i;
      break;
    }
    if (gantt[i].endTime <= currentTime) {
      currentSegmentIndex = i;
    }
  }

  const activeSegment = currentSegmentIndex >= 0 ? gantt[currentSegmentIndex] : null;

  // Determine running process
  let runningProcess = null;
  if (activeSegment && activeSegment.pid !== 'IDLE' && activeSegment.startTime <= currentTime && currentTime < activeSegment.endTime) {
    runningProcess = result.processes.find(p => p.pid === activeSegment.pid) ?? null;
  }

  // Count completed processes
  const completedProcesses = result.processes.filter(
    p => p.completionTime !== null && p.completionTime <= currentTime
  ).length;

  // Compute ready queue at currentTime
  const readyQueue: ReadyQueueEntry[] = [];
  let insertionOrder = 0;

  for (const p of result.processes) {
    if (p.arrivalTime > currentTime) continue;
    if (p.completionTime !== null && p.completionTime <= currentTime) continue;

    // Check if currently running
    if (activeSegment && activeSegment.pid === p.pid && activeSegment.startTime <= currentTime && currentTime < activeSegment.endTime) continue;

    // Calculate remaining burst
    const executedUpToNow = gantt
      .filter(seg => seg.pid === p.pid && seg.endTime <= currentTime)
      .reduce((sum, seg) => sum + seg.duration, 0);
    const partialExecution = (activeSegment && activeSegment.pid === p.pid)
      ? currentTime - activeSegment.startTime
      : 0;
    const remaining = p.burstTime - executedUpToNow - partialExecution;

    if (remaining > 0) {
      readyQueue.push({
        pid: p.pid,
        name: p.name,
        color: p.color,
        remainingBurstTime: remaining,
        arrivalTime: p.arrivalTime,
        priority: p.priority,
        insertionOrder: insertionOrder++,
      });
    }
  }

  // Sort ready queue according to the active algorithm's queue semantics
  if (result.algorithm === 'RR') {
    const queueOrder = computeRoundRobinQueue(
      result.processes,
      result.ganttChart,
      currentTime,
      result.algorithmConfig.timeQuantum ?? 2
    );
    const orderMap = new Map<number, number>(queueOrder.map((pid, idx) => [pid, idx]));
    readyQueue.sort((a, b) => {
      const idxA = orderMap.has(a.pid) ? orderMap.get(a.pid)! : 9999;
      const idxB = orderMap.has(b.pid) ? orderMap.get(b.pid)! : 9999;
      return idxA - idxB;
    });
  } else if (result.algorithm === 'FCFS') {
    readyQueue.sort((a, b) => {
      const arrDiff = a.arrivalTime - b.arrivalTime;
      if (arrDiff !== 0) return arrDiff;
      return (
        result.processes.findIndex(p => p.pid === a.pid) -
        result.processes.findIndex(p => p.pid === b.pid)
      );
    });
  } else if (result.algorithm === 'SJF') {
    readyQueue.sort((a, b) => {
      const burstDiff = a.remainingBurstTime - b.remainingBurstTime;
      if (burstDiff !== 0) return burstDiff;
      const arrDiff = a.arrivalTime - b.arrivalTime;
      if (arrDiff !== 0) return arrDiff;
      return (
        result.processes.findIndex(p => p.pid === a.pid) -
        result.processes.findIndex(p => p.pid === b.pid)
      );
    });
  } else if (result.algorithm === 'SRTF') {
    readyQueue.sort((a, b) => {
      const remDiff = a.remainingBurstTime - b.remainingBurstTime;
      if (remDiff !== 0) return remDiff;
      const arrDiff = a.arrivalTime - b.arrivalTime;
      if (arrDiff !== 0) return arrDiff;
      return (
        result.processes.findIndex(p => p.pid === a.pid) -
        result.processes.findIndex(p => p.pid === b.pid)
      );
    });
  } else if (result.algorithm === 'PRIORITY_NP' || result.algorithm === 'PRIORITY_P') {
    readyQueue.sort((a, b) => {
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

  // Update insertionOrder to reflect true queue position
  readyQueue.forEach((entry, idx) => {
    entry.insertionOrder = idx;
  });

  return {
    currentTime,
    currentSegmentIndex,
    completedProcesses,
    activeSegment,
    readyQueue,
    runningProcess,
  };
}

export function useSimulator(): SimulatorState & SimulatorActions {
  const [processes, setProcessesState] = useState<Process[]>(DEFAULT_PROCESSES);
  const [config, setConfigState] = useState<AlgorithmConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>({
    currentTime: 0,
    isPlaying: false,
    speed: 1,
    currentSegmentIndex: -1,
    completedProcesses: 0,
    activeSegment: null,
    readyQueue: [],
    runningProcess: null,
  });

  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const playbackRef = useRef(playback);
  const resultRef = useRef(result);

  playbackRef.current = playback;
  resultRef.current = result;

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!resultRef.current) return;

    const { isPlaying, speed, currentTime } = playbackRef.current;
    if (!isPlaying) return;

    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = timestamp;
    }

    const deltaMs = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    // Each real second = speed simulation seconds
    const deltaSimTime = (deltaMs / 1000) * speed;
    const newTime = currentTime + deltaSimTime;

    const totalTime = resultRef.current.totalTime;

    if (newTime >= totalTime) {
      const computed = computePlaybackState(resultRef.current, totalTime);
      setPlayback(prev => ({
        ...prev,
        ...computed,
        currentTime: totalTime,
        isPlaying: false,
      }));
      return;
    }

    const computed = computePlaybackState(resultRef.current, newTime);
    setPlayback(prev => ({ ...prev, ...computed, currentTime: newTime }));

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (playback.isPlaying) {
      lastTimestampRef.current = null;
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [playback.isPlaying, animate]);

  // Actions
  const addProcess = useCallback(() => {
    setProcessesState(prev => {
      const pid = generatePid(prev);
      const color = getProcessColor(prev.length);
      return [...prev, {
        pid,
        name: `P${pid}`,
        arrivalTime: 0,
        burstTime: 4,
        priority: 1,
        color,
      }];
    });
  }, []);

  const updateProcess = useCallback((pid: number, updates: Partial<Omit<Process, 'pid' | 'color'>>) => {
    setProcessesState(prev =>
      prev.map(p => p.pid === pid ? { ...p, ...updates } : p)
    );
    setResult(null);
  }, []);

  const deleteProcess = useCallback((pid: number) => {
    setProcessesState(prev => prev.filter(p => p.pid !== pid));
    setResult(null);
  }, []);

  const setProcesses = useCallback((procs: Process[]) => {
    setProcessesState(procs);
    setResult(null);
  }, []);

  const setConfig = useCallback((cfg: AlgorithmConfig) => {
    setConfigState(cfg);
    setResult(null);
  }, []);

  const runSimulation = useCallback(() => {
    const schedResult = runScheduler(processes, config);
    if (schedResult.success) {
      setResult(schedResult.result);
      setError(null);
      setPlayback({
        currentTime: 0,
        isPlaying: false,
        speed: 1,
        currentSegmentIndex: -1,
        completedProcesses: 0,
        activeSegment: null,
        readyQueue: [],
        runningProcess: null,
      });
    } else {
      setError(schedResult.error.details?.join('\n') ?? schedResult.error.message);
    }
  }, [processes, config]);

  const resetSimulation = useCallback(() => {
    setResult(null);
    setError(null);
    setPlayback({
      currentTime: 0,
      isPlaying: false,
      speed: 1,
      currentSegmentIndex: -1,
      completedProcesses: 0,
      activeSegment: null,
      readyQueue: [],
      runningProcess: null,
    });
  }, []);

  const play = useCallback(() => {
    setPlayback(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setPlayback(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const step = useCallback(() => {
    if (!result) return;
    const { currentTime } = playbackRef.current;

    // Step to end of current segment
    const current = result.ganttChart.find(
      seg => seg.startTime <= currentTime && currentTime < seg.endTime
    );

    let nextTime: number;
    if (current) {
      nextTime = current.endTime;
    } else {
      // Find next segment start
      const next = result.ganttChart.find(seg => seg.startTime > currentTime);
      nextTime = next ? next.startTime : result.totalTime;
    }

    const computed = computePlaybackState(result, nextTime);
    setPlayback(prev => ({
      ...prev,
      ...computed,
      isPlaying: false,
    }));
  }, [result]);

  const resetPlayback = useCallback(() => {
    setPlayback(prev => ({
      ...prev,
      currentTime: 0,
      isPlaying: false,
      currentSegmentIndex: -1,
      completedProcesses: 0,
      activeSegment: null,
      readyQueue: [],
      runningProcess: null,
    }));
  }, []);

  const setSpeed = useCallback((speed: 1 | 2 | 4 | 8) => {
    setPlayback(prev => ({ ...prev, speed }));
  }, []);

  const seekTo = useCallback((time: number) => {
    if (!result) return;
    const clampedTime = Math.max(0, Math.min(time, result.totalTime));
    const computed = computePlaybackState(result, clampedTime);
    setPlayback(prev => ({
      ...prev,
      ...computed,
      isPlaying: false,
    }));
  }, [result]);

  const generateRandom = useCallback((count = 5) => {
    const procs: Process[] = [];
    nextPid = 1;
    for (let i = 0; i < count; i++) {
      const pid = i + 1;
      procs.push({
        pid,
        name: `P${pid}`,
        arrivalTime: Math.floor(Math.random() * 10),
        burstTime: Math.floor(Math.random() * 10) + 1,
        priority: Math.floor(Math.random() * 5),
        color: getProcessColor(i),
      });
    }
    setProcessesState(procs);
    setResult(null);
  }, []);

  const loadWorkload = useCallback((procs: Omit<Process, 'color'>[]) => {
    nextPid = procs.length + 1;
    const withColors = procs.map((p, i) => ({ ...p, color: getProcessColor(i) }));
    setProcessesState(withColors);
    setResult(null);
  }, []);

  const clearProcesses = useCallback(() => {
    setProcessesState([]);
    setResult(null);
    nextPid = 1;
  }, []);

  return {
    processes,
    config,
    result,
    error,
    playback,
    addProcess,
    updateProcess,
    deleteProcess,
    setProcesses,
    setConfig,
    runSimulation,
    resetSimulation,
    play,
    pause,
    step,
    reset: resetPlayback,
    setSpeed,
    seekTo,
    generateRandom,
    loadWorkload,
    clearProcesses,
  };
}

// ============================================================
// SCHEDULIX — Sample Workloads
// Predefined process sets for demonstration and testing.
// ============================================================

import type { SampleWorkload } from '../engine/types';

export const SAMPLE_WORKLOADS: SampleWorkload[] = [
  {
    id: 'basic',
    name: 'Basic Scheduling Demo',
    description: 'Three processes with sequential arrivals. Good for understanding fundamental scheduling differences.',
    processes: [
      { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 10, priority: 2 },
      { pid: 2, name: 'P2', arrivalTime: 2, burstTime: 4, priority: 1 },
      { pid: 3, name: 'P3', arrivalTime: 4, burstTime: 6, priority: 3 },
    ],
    recommendedAlgorithm: 'FCFS',
  },
  {
    id: 'varied-arrival',
    name: 'Varied Arrival Times',
    description: 'Processes arrive at different times, including a CPU idle period. Demonstrates FCFS idle handling and SJF queue selection.',
    processes: [
      { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 5, priority: 2 },
      { pid: 2, name: 'P2', arrivalTime: 3, burstTime: 3, priority: 1 },
      { pid: 3, name: 'P3', arrivalTime: 9, burstTime: 4, priority: 3 },
      { pid: 4, name: 'P4', arrivalTime: 9, burstTime: 1, priority: 0 },
    ],
    recommendedAlgorithm: 'SJF',
  },
  {
    id: 'preemption',
    name: 'Preemption Showcase',
    description: 'A long-running process is preempted by shorter-burst arrivals. Best observed with SRTF and Preemptive Priority.',
    processes: [
      { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 12, priority: 3 },
      { pid: 2, name: 'P2', arrivalTime: 2, burstTime: 4, priority: 1 },
      { pid: 3, name: 'P3', arrivalTime: 4, burstTime: 2, priority: 2 },
      { pid: 4, name: 'P4', arrivalTime: 6, burstTime: 3, priority: 0 },
    ],
    recommendedAlgorithm: 'SRTF',
  },
  {
    id: 'round-robin',
    name: 'Round Robin Demo',
    description: 'Multiple processes with similar burst times. Shows Round Robin time-sharing and queue cycling. Use quantum=3.',
    processes: [
      { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 8, priority: 1 },
      { pid: 2, name: 'P2', arrivalTime: 1, burstTime: 6, priority: 2 },
      { pid: 3, name: 'P3', arrivalTime: 2, burstTime: 4, priority: 1 },
      { pid: 4, name: 'P4', arrivalTime: 3, burstTime: 5, priority: 3 },
    ],
    recommendedAlgorithm: 'RR',
    recommendedQuantum: 3,
  },
  {
    id: 'priority-starvation',
    name: 'Priority & Starvation Risk',
    description: 'High and low priority processes demonstrate potential starvation in priority scheduling.',
    processes: [
      { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 6, priority: 3 },
      { pid: 2, name: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
      { pid: 3, name: 'P3', arrivalTime: 2, burstTime: 4, priority: 0 },
      { pid: 4, name: 'P4', arrivalTime: 3, burstTime: 2, priority: 0 },
      { pid: 5, name: 'P5', arrivalTime: 4, burstTime: 5, priority: 4 },
    ],
    recommendedAlgorithm: 'PRIORITY_P',
  },
];

export const PROCESS_COLORS = [
  '#22d3ee', // cyan
  '#8b5cf6', // violet
  '#34d399', // emerald
  '#fbbf24', // amber
  '#fb7185', // rose
  '#60a5fa', // blue
  '#f472b6', // pink
  '#a3e635', // lime
  '#fb923c', // orange
  '#e879f9', // fuchsia
];

export function getProcessColor(index: number): string {
  return PROCESS_COLORS[index % PROCESS_COLORS.length];
}

export const ALGORITHM_INFO = [
  {
    type: 'FCFS' as const,
    name: 'First Come, First Served',
    shortName: 'FCFS',
    isPreemptive: false,
    description: 'Processes are executed in the order they arrive. Simple but can cause the convoy effect.',
    complexity: 'O(n log n)',
    usesPriority: false,
    usesQuantum: false,
  },
  {
    type: 'SJF' as const,
    name: 'Shortest Job First',
    shortName: 'SJF',
    isPreemptive: false,
    description: 'Non-preemptive. Selects the process with the shortest burst time when the CPU becomes free.',
    complexity: 'O(n log n) per selection',
    usesPriority: false,
    usesQuantum: false,
  },
  {
    type: 'SRTF' as const,
    name: 'Shortest Remaining Time First',
    shortName: 'SRTF',
    isPreemptive: true,
    description: 'Preemptive SJF. Re-evaluates the ready queue whenever a new process arrives.',
    complexity: 'O(n) per preemption check',
    usesPriority: false,
    usesQuantum: false,
  },
  {
    type: 'PRIORITY_NP' as const,
    name: 'Priority (Non-Preemptive)',
    shortName: 'Priority NP',
    isPreemptive: false,
    description: 'Selects the highest-priority process (lowest number) when CPU is free. Runs to completion.',
    complexity: 'O(n log n) per selection',
    usesPriority: true,
    usesQuantum: false,
  },
  {
    type: 'PRIORITY_P' as const,
    name: 'Priority (Preemptive)',
    shortName: 'Priority P',
    isPreemptive: true,
    description: 'Higher-priority arrivals preempt the running process. Risk of starvation for low-priority processes.',
    complexity: 'O(n) per preemption check',
    usesPriority: true,
    usesQuantum: false,
  },
  {
    type: 'RR' as const,
    name: 'Round Robin',
    shortName: 'Round Robin',
    isPreemptive: true,
    description: 'Time-sharing with a fixed quantum. Fair CPU distribution but higher context-switch overhead.',
    complexity: 'O(1) per dispatch',
    usesPriority: false,
    usesQuantum: true,
  },
];

import { useState } from 'react';
import {
  FlaskConical,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import GanttChart from '../components/gantt/GanttChart';
import MetricsSummary from '../components/analytics/MetricsSummary';
import { runScheduler } from '../engine/scheduler';
import { getProcessColor } from '../data/workloads';
import type { AlgorithmType, Process } from '../engine/types';

interface LabAlgorithmData {
  type: AlgorithmType;
  title: string;
  badge: string;
  isPreemptive: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  pseudocode: string;
  workedExample: {
    description: string;
    processes: Process[];
    quantum?: number;
    steps: { step: number; time: string; action: string; note: string }[];
  };
  advantages: string[];
  disadvantages: string[];
  realWorldUse: string;
}

const LAB_DATA: Record<AlgorithmType, LabAlgorithmData> = {
  FCFS: {
    type: 'FCFS',
    title: 'First Come, First Served (FCFS)',
    badge: 'Non-Preemptive',
    isPreemptive: false,
    timeComplexity: 'O(n log n) sorting by arrival, O(n) execution',
    spaceComplexity: 'O(n) for ready queue',
    description:
      'First Come First Served is the simplest CPU scheduling algorithm. Processes are allocated the CPU in the order they request it (FIFO ready queue). Once a process gets the CPU, it runs until completion without preemption.',
    pseudocode: `function FCFS_Schedule(processes):
    sort processes by arrivalTime ascending, then PID ascending
    currentTime = 0
    readyQueue = Queue()

    while processes remaining or readyQueue not empty:
        add arriving processes to readyQueue where arrivalTime <= currentTime
        
        if readyQueue is empty:
            currentTime = next process arrivalTime // CPU idle
            continue

        process = readyQueue.pop()
        record startTime = currentTime
        currentTime += process.burstTime
        record completionTime = currentTime
        record turnaroundTime = completionTime - process.arrivalTime
        record waitingTime = turnaroundTime - process.burstTime`,
    workedExample: {
      description:
        'Three processes arrive: P1 (AT=0, BT=8), P2 (AT=2, BT=4), P3 (AT=4, BT=2). Notice how P2 and P3 must wait for P1 to finish even though their burst times are shorter.',
      processes: [
        { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 8, priority: 2, color: getProcessColor(0) },
        { pid: 2, name: 'P2', arrivalTime: 2, burstTime: 4, priority: 1, color: getProcessColor(1) },
        { pid: 3, name: 'P3', arrivalTime: 4, burstTime: 2, priority: 3, color: getProcessColor(2) },
      ],
      steps: [
        { step: 1, time: 't=0 → t=8', action: 'P1 executes', note: 'Arrives at t=0, claims CPU immediately. P2 arrives at t=2 and P3 arrives at t=4, both queue behind P1.' },
        { step: 2, time: 't=8 → t=12', action: 'P2 executes', note: 'P1 completes at t=8. P2 was next in FIFO queue. Waits 6 units.' },
        { step: 3, time: 't=12 → t=14', action: 'P3 executes', note: 'P2 completes at t=12. P3 executes to finish. Total time = 14u.' },
      ],
    },
    advantages: [
      'Simple to understand, verify, and implement.',
      'Completely starvation-free; every arriving process will eventually be served in FIFO order.',
      'Extremely low scheduling overhead since no preemption or re-sorting occurs.',
    ],
    disadvantages: [
      'Convoy Effect: Short processes get trapped waiting behind long CPU-bound processes.',
      'High average waiting time compared to shortest job first algorithms.',
      'Unsuitable for interactive and time-sharing operating systems.',
    ],
    realWorldUse:
      'Used in batch systems, print spoolers, background worker task queues, and embedded systems where predictability is preferred over responsiveness.',
  },

  SJF: {
    type: 'SJF',
    title: 'Shortest Job First (SJF) — Non-Preemptive',
    badge: 'Non-Preemptive',
    isPreemptive: false,
    timeComplexity: 'O(n log n) with priority queue/heap',
    spaceComplexity: 'O(n)',
    description:
      'Non-preemptive Shortest Job First selects the waiting process with the smallest CPU burst time whenever the CPU becomes available. Once dispatched, the selected process runs to completion uninterrupted.',
    pseudocode: `function SJF_Schedule(processes):
    currentTime = 0
    completed = []

    while completed.length < processes.length:
        available = processes where arrivalTime <= currentTime and not completed
        
        if available is empty:
            currentTime = next arriving process time
            continue

        // Select shortest burst; tie-break by arrivalTime then PID
        nextProcess = available.minBy(burstTime, arrivalTime, pid)
        
        record startTime = currentTime
        currentTime += nextProcess.burstTime
        record completionTime = currentTime
        completed.add(nextProcess)`,
    workedExample: {
      description:
        'P1 starts at t=0. At t=5 when P1 finishes, both P2 (BT=6) and P3 (BT=2) are ready. SJF picks P3 because BT=2 < BT=6.',
      processes: [
        { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 5, priority: 1, color: getProcessColor(0) },
        { pid: 2, name: 'P2', arrivalTime: 2, burstTime: 6, priority: 2, color: getProcessColor(1) },
        { pid: 3, name: 'P3', arrivalTime: 3, burstTime: 2, priority: 3, color: getProcessColor(2) },
      ],
      steps: [
        { step: 1, time: 't=0 → t=5', action: 'P1 executes', note: 'Only P1 is present at t=0. Runs until t=5.' },
        { step: 2, time: 't=5 → t=7', action: 'P3 executes', note: 'At t=5, P2 (BT=6) and P3 (BT=2) are ready. P3 is shorter, so it runs first.' },
        { step: 3, time: 't=7 → t=13', action: 'P2 executes', note: 'P3 finishes at t=7. P2 runs to completion at t=13.' },
      ],
    },
    advantages: [
      'Provably optimal among non-preemptive algorithms for minimizing average waiting time.',
      'Greatly reduces the convoy effect seen in FCFS.',
      'High system throughput for short jobs.',
    ],
    disadvantages: [
      'Burst times cannot usually be known in advance in general-purpose OSs (must be predicted).',
      'Starvation risk: Continuous arrival of short processes causes long processes to starve.',
      'Not suitable for interactive environments due to lack of preemption.',
    ],
    realWorldUse:
      'Long-term batch scheduling where job runtimes are declared in advance, supercomputing queues, and print queues.',
  },

  SRTF: {
    type: 'SRTF',
    title: 'Shortest Remaining Time First (SRTF)',
    badge: 'Preemptive',
    isPreemptive: true,
    timeComplexity: 'O(n) per preemption check, O(n log n) overall',
    spaceComplexity: 'O(n)',
    description:
      'SRTF is the preemptive variant of SJF. Whenever a new process arrives, its burst time is compared to the remaining execution time of the currently running process. If the newcomer is shorter, the running process is preempted and returned to the ready queue.',
    pseudocode: `function SRTF_Schedule(processes):
    currentTime = 0
    while processes remain unfinished:
        available = unfinished processes where arrivalTime <= currentTime
        
        if available is empty:
            currentTime = next process arrivalTime
            continue

        // Choose process with smallest remaining burst
        current = available.minBy(remainingBurst, arrivalTime, pid)
        nextEventTime = min(
            currentTime + current.remainingBurst,
            next process arrivalTime > currentTime
        )
        
        run current from currentTime to nextEventTime
        current.remainingBurst -= (nextEventTime - currentTime)
        currentTime = nextEventTime`,
    workedExample: {
      description:
        'P1 starts at t=0 with BT=8. At t=2, P2 arrives with BT=2. P1 has 6u remaining. Since 2 < 6, P2 preempts P1!',
      processes: [
        { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 8, priority: 1, color: getProcessColor(0) },
        { pid: 2, name: 'P2', arrivalTime: 2, burstTime: 2, priority: 2, color: getProcessColor(1) },
        { pid: 3, name: 'P3', arrivalTime: 4, burstTime: 3, priority: 3, color: getProcessColor(2) },
      ],
      steps: [
        { step: 1, time: 't=0 → t=2', action: 'P1 executes (part 1)', note: 'P1 runs 2 units. Remaining burst drops to 6u.' },
        { step: 2, time: 't=2 → t=4', action: 'P2 preempts and completes', note: 'P2 arrives with BT=2. 2 < 6, so P2 preempts P1 and completes at t=4.' },
        { step: 3, time: 't=4 → t=7', action: 'P3 executes and completes', note: 'At t=4, P3 arrives with BT=3. P1 remaining is 6. 3 < 6, so P3 runs until t=7.' },
        { step: 4, time: 't=7 → t=13', action: 'P1 resumes and completes', note: 'P1 resumes with remaining 6u and finishes at t=13.' },
      ],
    },
    advantages: [
      'Minimizes overall average waiting time among all scheduling algorithms.',
      'Instant response for newly arrived short interactive tasks.',
      'High throughput for systems with burst variance.',
    ],
    disadvantages: [
      'Frequent context switches increase CPU overhead.',
      'Severe starvation potential for long-running processes if short processes continuously arrive.',
      'Burst time must be estimated via exponential moving averages.',
    ],
    realWorldUse:
      'Interactive server requests, video rendering job scheduling with runtime heuristics, and prioritized network packet scheduling.',
  },

  PRIORITY_NP: {
    type: 'PRIORITY_NP',
    title: 'Priority Scheduling (Non-Preemptive)',
    badge: 'Non-Preemptive',
    isPreemptive: false,
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    description:
      'Each process has a priority integer (by OS convention, lower number = higher priority). When the CPU is free, the algorithm selects the process with the highest priority from the ready queue. The selected process runs to completion.',
    pseudocode: `function Priority_NP_Schedule(processes):
    currentTime = 0
    completed = []

    while completed.length < processes.length:
        available = processes where arrivalTime <= currentTime and not completed
        if available is empty:
            currentTime = next arrival; continue
            
        // Lower priority number = higher priority
        nextProcess = available.minBy(priority, arrivalTime, pid)
        currentTime += nextProcess.burstTime
        completed.add(nextProcess)`,
    workedExample: {
      description:
        'P1 (Priority=3) runs from t=0. During its run, P2 (Priority=1) and P3 (Priority=0) arrive. When P1 finishes, P3 runs next because Priority 0 is highest.',
      processes: [
        { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 6, priority: 3, color: getProcessColor(0) },
        { pid: 2, name: 'P2', arrivalTime: 2, burstTime: 3, priority: 1, color: getProcessColor(1) },
        { pid: 3, name: 'P3', arrivalTime: 3, burstTime: 2, priority: 0, color: getProcessColor(2) },
      ],
      steps: [
        { step: 1, time: 't=0 → t=6', action: 'P1 executes', note: 'Runs to completion without preemption.' },
        { step: 2, time: 't=6 → t=8', action: 'P3 executes', note: 'P3 has priority=0 (higher than P2 priority=1), so P3 is chosen.' },
        { step: 3, time: 't=8 → t=11', action: 'P2 executes', note: 'P2 runs to completion at t=11.' },
      ],
    },
    advantages: [
      'Aligns execution with business, system, or administrative importance.',
      'Supports critical system daemon processes over standard user jobs.',
      'Simple queue management based on priority rank.',
    ],
    disadvantages: [
      'Indefinite blocking (starvation) for low-priority processes.',
      'Does not guarantee optimal average waiting time.',
      'Needs an aging mechanism to gradually increase priority of waiting jobs.',
    ],
    realWorldUse:
      'Real-time control systems, medical device monitors, and print queues with VIP user privileges.',
  },

  PRIORITY_P: {
    type: 'PRIORITY_P',
    title: 'Priority Scheduling (Preemptive)',
    badge: 'Preemptive',
    isPreemptive: true,
    timeComplexity: 'O(n) per arrival check, O(n log n) overall',
    spaceComplexity: 'O(n)',
    description:
      'Preemptive Priority scheduling compares the priority of newly arrived processes with the running process. If a higher-priority process arrives (lower priority value), the running process is immediately preempted.',
    pseudocode: `function Priority_P_Schedule(processes):
    currentTime = 0
    while unfinished processes remain:
        available = processes where arrivalTime <= currentTime and remainingBurst > 0
        if available is empty:
            currentTime = next arrival; continue
            
        current = available.minBy(priority, arrivalTime, pid)
        nextEvent = min(currentTime + current.remainingBurst, next arrivalTime > currentTime)
        
        run current from currentTime to nextEvent
        current.remainingBurst -= (nextEvent - currentTime)
        currentTime = nextEvent`,
    workedExample: {
      description:
        'P1 (Priority=2) starts at t=0. At t=3, P2 arrives with Priority=0. P2 preempts P1 immediately!',
      processes: [
        { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 7, priority: 2, color: getProcessColor(0) },
        { pid: 2, name: 'P2', arrivalTime: 3, burstTime: 3, priority: 0, color: getProcessColor(1) },
      ],
      steps: [
        { step: 1, time: 't=0 → t=3', action: 'P1 executes (part 1)', note: 'P1 executes for 3 units before preemption.' },
        { step: 2, time: 't=3 → t=6', action: 'P2 preempts and completes', note: 'P2 has priority 0 < 2, so it takes the CPU and finishes.' },
        { step: 3, time: 't=6 → t=10', action: 'P1 resumes and completes', note: 'P1 resumes with remaining 4u burst and finishes at t=10.' },
      ],
    },
    advantages: [
      'Guarantees immediate CPU access for urgent system events and interrupts.',
      'Essential for real-time operating systems with strict deadline requirements.',
      'High responsiveness for critical tasks.',
    ],
    disadvantages: [
      'Priority inversion problem (when low priority holds a lock needed by high priority).',
      'High context switch overhead under noisy workloads.',
      'Starvation of background jobs without aging.',
    ],
    realWorldUse:
      'Operating system kernel threads, interrupt handling routines, and flight control real-time operating systems (RTOS).',
  },

  RR: {
    type: 'RR',
    title: 'Round Robin (RR)',
    badge: 'Preemptive (Time-Sliced)',
    isPreemptive: true,
    timeComplexity: 'O(1) per dispatch, O(totalBurst / quantum) context switches',
    spaceComplexity: 'O(n) FIFO circular queue',
    description:
      'Round Robin is specifically designed for time-sharing systems. The CPU scheduler allocates a small unit of time called a time quantum (slice). The ready queue is treated as a circular FIFO queue. Each process executes for at most one quantum before being preempted.',
    pseudocode: `function RoundRobin_Schedule(processes, quantum):
    readyQueue = CircularQueue()
    currentTime = 0

    while unfinished processes remain:
        add newly arrived processes (arrivalTime <= currentTime) to readyQueue
        if readyQueue is empty:
            currentTime = next arrival; continue
            
        process = readyQueue.pop()
        execTime = min(quantum, process.remainingBurst)
        
        run process from currentTime to currentTime + execTime
        currentTime += execTime
        process.remainingBurst -= execTime
        
        // Add new arrivals that arrived DURING this execution
        add newly arrived processes to readyQueue
        
        if process.remainingBurst > 0:
            readyQueue.push(process) // Re-enter queue at back
        else:
            record completion`,
    workedExample: {
      description:
        'With quantum=2, P1 (BT=5), P2 (BT=3), P3 (BT=1) cycle smoothly through the CPU.',
      processes: [
        { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 5, priority: 1, color: getProcessColor(0) },
        { pid: 2, name: 'P2', arrivalTime: 1, burstTime: 3, priority: 2, color: getProcessColor(1) },
        { pid: 3, name: 'P3', arrivalTime: 2, burstTime: 1, priority: 3, color: getProcessColor(2) },
      ],
      steps: [
        { step: 1, time: 't=0 → t=2', action: 'P1 executes (slice 1)', note: 'P1 runs 2u (remaining 3u). P2 and P3 arrive during this slice.' },
        { step: 2, time: 't=2 → t=4', action: 'P2 executes (slice 1)', note: 'P2 runs 2u (remaining 1u). P1 waits in ready queue.' },
        { step: 3, time: 't=4 → t=5', action: 'P3 executes & completes', note: 'P3 only needs 1u, finishes before quantum expires at t=5.' },
        { step: 4, time: 't=5 → t=7', action: 'P1 executes (slice 2)', note: 'P1 runs 2u (remaining 1u).' },
        { step: 5, time: 't=7 → t=8', action: 'P2 executes & completes', note: 'P2 finishes its remaining 1u at t=8.' },
        { step: 6, time: 't=8 → t=9', action: 'P1 executes & completes', note: 'P1 finishes its last 1u at t=9.' },
      ],
    },
    advantages: [
      'Fair CPU sharing: No process monopolizes the CPU.',
      'Excellent response time for interactive user tasks.',
      'Starvation-free by design.',
    ],
    disadvantages: [
      'High context-switching overhead if quantum is too small.',
      'Degenerates into FCFS if quantum is set too large.',
      'Average turnaround time is often higher than SJF.',
    ],
    realWorldUse:
      'Modern general-purpose operating systems (Linux CFS, Windows scheduler, macOS) use multi-level feedback queues based on time-slicing principles.',
  },
};

export default function AlgorithmLabPage() {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>('FCFS');
  const [labQuantum, setLabQuantum] = useState<number>(2);

  const data = LAB_DATA[selectedAlgo];

  // Run simulation for the worked example
  const workedResult = runScheduler(data.workedExample.processes, {
    type: selectedAlgo,
    timeQuantum: selectedAlgo === 'RR' ? labQuantum : undefined,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Educational Algorithm Laboratory"
        subtitle="Deep dive into scheduling mechanics with theoretical breakdowns, formal pseudocode, step-by-step traces, and interactive sandboxes."
        badge="Interactive Learning"
      />

      {/* Algorithm Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {(Object.keys(LAB_DATA) as AlgorithmType[]).map(key => {
          const item = LAB_DATA[key];
          const isSelected = selectedAlgo === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedAlgo(key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-text-primary shadow-lg shadow-cyan-500/10'
                  : 'bg-surface border-border hover:border-border-hover text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="text-xs font-bold font-mono">{key}</div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">{item.badge}</div>
            </button>
          );
        })}
      </div>

      {/* Main Algorithm Overview Card */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <BookOpen size={20} className="text-cyan-400" />
              {data.title}
            </h2>
            <p className="text-xs text-text-secondary mt-1">{data.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`badge ${data.isPreemptive ? 'badge-amber' : 'badge-emerald'}`}
            >
              {data.badge}
            </span>
            {selectedAlgo === 'RR' && (
              <div className="flex items-center gap-1.5 bg-surface-2 px-2.5 py-1 rounded-lg border border-border text-xs">
                <span className="text-text-muted">Quantum:</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={labQuantum}
                  onChange={e => setLabQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 bg-surface-3 border border-border rounded px-1.5 py-0.5 text-center font-mono text-cyan-400 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Complexity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-surface-2 p-3 rounded-lg border border-border">
            <span className="text-text-muted block text-[10px] uppercase">Time Complexity:</span>
            <span className="text-cyan-400 font-bold">{data.timeComplexity}</span>
          </div>
          <div className="bg-surface-2 p-3 rounded-lg border border-border">
            <span className="text-text-muted block text-[10px] uppercase">Space Complexity:</span>
            <span className="text-violet-400 font-bold">{data.spaceComplexity}</span>
          </div>
        </div>
      </div>

      {/* Worked Example Trace & Interactive Gantt */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            Worked Example & Cycle-by-Cycle Execution Trace
          </h3>
          <span className="text-[11px] text-text-muted">Interactive verification</span>
        </div>

        <p className="text-xs text-text-secondary">{data.workedExample.description}</p>

        {workedResult.success && (
          <div className="space-y-4">
            <GanttChart
              result={workedResult.result}
              currentTime={workedResult.result.totalTime}
            />

            <MetricsSummary result={workedResult.result} />
          </div>
        )}

        {/* Step by Step Breakdown */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Step-by-Step Rationale Walkthrough
          </div>
          <div className="grid grid-cols-1 gap-2">
            {data.workedExample.steps.map(step => (
              <div
                key={step.step}
                className="bg-surface-2/60 border border-border rounded-lg p-3 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {step.step}
                  </span>
                  <div>
                    <span className="text-cyan-400 font-bold mr-2">{step.time}:</span>
                    <span className="text-text-primary font-semibold">{step.action}</span>
                  </div>
                </div>
                <div className="text-[11px] text-text-muted sm:max-w-md">{step.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formal Pseudocode */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Code2 size={16} className="text-cyan-400" />
          Formal Algorithm Pseudocode
        </h3>
        <div className="bg-[#0e1017] border border-border rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
            {data.pseudocode}
          </pre>
        </div>
      </div>

      {/* Advantages & Disadvantages Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-3 border-emerald-500/20 bg-emerald-500/5">
          <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Advantages & Strengths
          </h4>
          <ul className="space-y-2 text-xs text-text-secondary">
            {data.advantages.map((adv, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{adv}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-3 border-rose-500/20 bg-rose-500/5">
          <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
            <XCircle size={16} />
            Limitations & Edge Cases
          </h4>
          <ul className="space-y-2 text-xs text-text-secondary">
            {data.disadvantages.map((dis, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>{dis}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Real-World Systems Context */}
      <div className="card space-y-2">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} className="text-violet-400" />
          Real-World Operating System Implementations
        </h4>
        <p className="text-xs text-text-secondary leading-relaxed font-mono bg-surface-2 p-3 rounded-lg border border-border">
          {data.realWorldUse}
        </p>
      </div>
    </div>
  );
}

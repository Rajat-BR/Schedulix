import { useState } from 'react';
import {
  BookOpen,
  Calculator,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight,
  Zap,
  CheckCircle,
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';

export default function DocsPage() {
  // Interactive formula tester
  const [at, setAt] = useState<number>(2);
  const [bt, setBt] = useState<number>(5);
  const [ct, setCt] = useState<number>(10);
  const [fr, setFr] = useState<number>(4);

  const tat = ct - at;
  const wt = tat - bt;
  const rt = fr - at;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Documentation & Theory Reference"
        subtitle="Comprehensive guide to CPU scheduling theory, mathematical formulas, scheduling criteria, and operating system mechanics."
        badge="Operating Systems Guide"
      />

      {/* Interactive Metric Calculator Widget */}
      <div className="card space-y-4 border-cyan-500/30 bg-gradient-to-br from-surface to-cyan-950/20">
        <div className="flex items-center gap-2">
          <Calculator size={18} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            Interactive Metric Calculator & Equation Tester
          </h3>
        </div>
        <p className="text-xs text-text-muted">
          Input your process parameters to verify Turnaround Time (TAT), Waiting Time (WT), and Response Time (RT).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-2 p-3 rounded-lg border border-border">
            <label className="text-[10px] text-text-muted uppercase font-mono block mb-1">
              Arrival Time (AT)
            </label>
            <input
              type="number"
              value={at}
              onChange={e => setAt(Number(e.target.value))}
              className="w-full bg-surface-3 border border-border rounded px-2 py-1 text-sm font-mono text-cyan-400"
            />
          </div>

          <div className="bg-surface-2 p-3 rounded-lg border border-border">
            <label className="text-[10px] text-text-muted uppercase font-mono block mb-1">
              Burst Time (BT)
            </label>
            <input
              type="number"
              value={bt}
              onChange={e => setBt(Number(e.target.value))}
              className="w-full bg-surface-3 border border-border rounded px-2 py-1 text-sm font-mono text-cyan-400"
            />
          </div>

          <div className="bg-surface-2 p-3 rounded-lg border border-border">
            <label className="text-[10px] text-text-muted uppercase font-mono block mb-1">
              Completion Time (CT)
            </label>
            <input
              type="number"
              value={ct}
              onChange={e => setCt(Number(e.target.value))}
              className="w-full bg-surface-3 border border-border rounded px-2 py-1 text-sm font-mono text-cyan-400"
            />
          </div>

          <div className="bg-surface-2 p-3 rounded-lg border border-border">
            <label className="text-[10px] text-text-muted uppercase font-mono block mb-1">
              First Response (FR)
            </label>
            <input
              type="number"
              value={fr}
              onChange={e => setFr(Number(e.target.value))}
              className="w-full bg-surface-3 border border-border rounded px-2 py-1 text-sm font-mono text-cyan-400"
            />
          </div>
        </div>

        {/* Calculated Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 font-mono">
            <div className="text-[11px] text-cyan-400 font-bold uppercase">Turnaround Time (TAT)</div>
            <div className="text-xl font-bold text-text-primary mt-1">{tat} units</div>
            <div className="text-[10px] text-text-muted mt-0.5">CT ({ct}) - AT ({at})</div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 font-mono">
            <div className="text-[11px] text-amber-400 font-bold uppercase">Waiting Time (WT)</div>
            <div className="text-xl font-bold text-text-primary mt-1">{wt} units</div>
            <div className="text-[10px] text-text-muted mt-0.5">TAT ({tat}) - BT ({bt})</div>
          </div>

          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 font-mono">
            <div className="text-[11px] text-violet-400 font-bold uppercase">Response Time (RT)</div>
            <div className="text-xl font-bold text-text-primary mt-1">{rt} units</div>
            <div className="text-[10px] text-text-muted mt-0.5">First Run ({fr}) - AT ({at})</div>
          </div>
        </div>
      </div>

      {/* Core Scheduling Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Cpu size={16} className="text-cyan-400" />
            Scheduler vs. Dispatcher
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            The <strong className="text-text-primary">CPU Scheduler</strong> is the decision maker: it selects which process in the ready queue should execute next according to a given policy (e.g. FCFS, SJF, Priority, Round Robin).
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            The <strong className="text-text-primary">Dispatcher</strong> is the mechanism that gives control of the CPU to the process selected by the short-term scheduler. It performs:
          </p>
          <ul className="text-xs text-text-muted space-y-1 font-mono list-disc list-inside">
            <li>Context switching (saving registers & reloading state)</li>
            <li>Switching from kernel mode to user mode</li>
            <li>Jumping to the proper location in the user program to restart it</li>
          </ul>
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Layers size={16} className="text-violet-400" />
            Preemptive vs. Non-Preemptive Scheduling
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong className="text-emerald-400">Non-Preemptive (Cooperative):</strong> Once a process is allocated the CPU, it keeps the CPU until it either terminates or switches to the waiting state (e.g., I/O request). FCFS and non-preemptive SJF/Priority are examples.
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong className="text-amber-400">Preemptive:</strong> The OS kernel can interrupt a currently executing process to reallocate the CPU to another higher-priority or shorter process (e.g. SRTF, Round Robin time slice expiration).
          </p>
        </div>
      </div>

      {/* Scheduling Criteria & Equations Reference */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <BookOpen size={16} className="text-cyan-400" />
          Standard Scheduling Performance Criteria
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-1.5">
            <div className="text-xs font-bold text-cyan-400 font-mono">1. CPU Utilization</div>
            <p className="text-xs text-text-secondary leading-relaxed">
              The fraction of total time the CPU is actively performing user computation rather than sitting idle.
            </p>
            <div className="bg-surface-3 p-2 rounded text-[11px] font-mono text-cyan-300">
              Util = (TotalTime - IdleTime) / TotalTime × 100%
            </div>
          </div>

          <div className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-1.5">
            <div className="text-xs font-bold text-amber-400 font-mono">2. Throughput</div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Number of processes that complete their execution per unit of time. Higher throughput means more completed work.
            </p>
            <div className="bg-surface-3 p-2 rounded text-[11px] font-mono text-amber-300">
              Throughput = CompletedProcesses / TotalTime
            </div>
          </div>

          <div className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-1.5">
            <div className="text-xs font-bold text-emerald-400 font-mono">3. Turnaround Time (TAT)</div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Total interval from process submission (arrival) to final completion. Includes waiting, I/O, and CPU execution.
            </p>
            <div className="bg-surface-3 p-2 rounded text-[11px] font-mono text-emerald-300">
              TAT = CompletionTime - ArrivalTime
            </div>
          </div>

          <div className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-1.5">
            <div className="text-xs font-bold text-rose-400 font-mono">4. Waiting Time (WT)</div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Total amount of time spent waiting in the ready queue. Does not include CPU burst execution.
            </p>
            <div className="bg-surface-3 p-2 rounded text-[11px] font-mono text-rose-300">
              WT = TurnaroundTime - BurstTime
            </div>
          </div>

          <div className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-1.5">
            <div className="text-xs font-bold text-violet-400 font-mono">5. Response Time (RT)</div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Time from process arrival until the CPU begins executing it for the very first time. Critical for interactive apps.
            </p>
            <div className="bg-surface-3 p-2 rounded text-[11px] font-mono text-violet-300">
              RT = FirstExecutionTime - ArrivalTime
            </div>
          </div>

          <div className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-1.5">
            <div className="text-xs font-bold text-blue-400 font-mono">6. Context Switch Cost</div>
            <p className="text-xs text-text-secondary leading-relaxed">
              The pure overhead incurred while saving and restoring state. Pure overhead because the CPU does no useful work.
            </p>
            <div className="bg-surface-3 p-2 rounded text-[11px] font-mono text-blue-300">
              Overhead ∝ Number of Context Switches
            </div>
          </div>
        </div>
      </div>

      {/* Pathological OS Phenomena */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Zap size={16} className="text-amber-400" />
          Classic Scheduling Challenges & Solutions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-2">
            <div className="font-bold text-text-primary text-sm">The Convoy Effect</div>
            <p className="text-text-secondary leading-relaxed">
              Occurs in FCFS when one CPU-bound process with a huge burst time monopolizes the CPU. Short I/O-bound processes wait behind it, resulting in lower device utilization and high average waiting time.
            </p>
            <div className="text-[11px] text-cyan-400 font-mono">Remedy: SRTF or Round Robin time slicing</div>
          </div>

          <div className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-2">
            <div className="font-bold text-text-primary text-sm">Starvation (Indefinite Blocking)</div>
            <p className="text-text-secondary leading-relaxed">
              In SJF, SRTF, and Priority scheduling, low-priority or long-burst jobs may wait indefinitely if shorter or higher-priority jobs keep arriving continuously.
            </p>
            <div className="text-[11px] text-cyan-400 font-mono">Remedy: Aging (gradually incrementing priority)</div>
          </div>

          <div className="bg-surface-2 p-3.5 rounded-xl border border-border space-y-2">
            <div className="font-bold text-text-primary text-sm">Round Robin Quantum Sizing</div>
            <p className="text-text-secondary leading-relaxed">
              If quantum is extremely large, RR degrades to FCFS. If quantum is extremely small (e.g. 1ms), context switch overhead consumes most CPU cycles.
            </p>
            <div className="text-[11px] text-cyan-400 font-mono">Rule of thumb: 80% of CPU bursts should finish in 1 quantum</div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import {
  Cpu,
  BarChart3,
  FlaskConical,
  BookOpen,
  Zap,
  ArrowRight,
  CheckCircle2,
  Play,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { ALGORITHM_INFO, SAMPLE_WORKLOADS } from '../data/workloads';

export default function OverviewPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-950/40 via-surface to-violet-950/30 border border-border p-8 lg:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Zap size={14} />
            <span>Interactive CPU Scheduling Simulator</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-black text-text-primary tracking-tight leading-tight">
            Master CPU Scheduling with <span className="text-gradient-cyan">Schedulix</span>
          </h1>

          <p className="text-sm lg:text-base text-text-secondary leading-relaxed">
            Experience animated cycle-by-cycle execution, examine ready-queue transitions, explore preemption decisions, and benchmark classic scheduling algorithms with mathematical precision.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/simulator"
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 shadow-lg shadow-cyan-500/20 text-sm"
            >
              <Play size={16} className="fill-current" />
              <span>Launch Simulator</span>
            </Link>

            <Link
              to="/comparison"
              className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <BarChart3 size={16} className="text-cyan-400" />
              <span>Benchmark Algorithms</span>
            </Link>

            <Link
              to="/lab"
              className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              <FlaskConical size={16} className="text-violet-400" />
              <span>Algorithm Lab</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card space-y-3 p-5 hover:border-cyan-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu size={20} />
          </div>
          <h3 className="text-base font-bold text-text-primary">Interactive Timeline</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Scrub through time, step cycle-by-cycle, toggle playback speed (1x to 8x), and inspect CPU state and live ready-queue transitions with animated Gantt bars.
          </p>
        </div>

        <div className="card space-y-3 p-5 hover:border-violet-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <BarChart3 size={20} />
          </div>
          <h3 className="text-base font-bold text-text-primary">Comparative Laboratory</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Execute all 6 algorithms on identical process workloads simultaneously. Compare waiting time, turnaround time, throughput, and context switch costs with Recharts.
          </p>
        </div>

        <div className="card space-y-3 p-5 hover:border-emerald-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-base font-bold text-text-primary">Deterministic Engine</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Engineered with strict algorithmic correctness, stable tie-breaking, preemption verification, CPU idle period detection, and comprehensive test suite validation.
          </p>
        </div>
      </div>

      {/* Supported Algorithms Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Supported Scheduling Algorithms</h2>
            <p className="text-xs text-text-muted">
              Complete implementations verified against classic operating systems specifications
            </p>
          </div>
          <Link to="/lab" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
            <span>Explore all in Lab</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALGORITHM_INFO.map(algo => (
            <div
              key={algo.type}
              className="card p-5 space-y-3 hover:border-border-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold font-mono text-cyan-400">{algo.shortName}</span>
                  <span
                    className={`badge ${algo.isPreemptive ? 'badge-amber' : 'badge-emerald'}`}
                  >
                    {algo.isPreemptive ? 'Preemptive' : 'Non-Preemptive'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-text-primary">{algo.name}</h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">{algo.description}</p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                <span className="text-[11px] text-text-muted">Complexity: {algo.complexity}</span>
                <Link
                  to="/simulator"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <span>Simulate</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workload Presets Quick Launch */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-text-primary">
              Predefined Educational Workloads
            </h3>
          </div>
          <span className="text-xs text-text-muted">Curated for specific OS demonstrations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SAMPLE_WORKLOADS.map(wl => (
            <div
              key={wl.id}
              className="bg-surface-2 p-4 rounded-xl border border-border space-y-2 hover:bg-surface-3 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">{wl.name}</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {wl.processes.length} Processes
                </span>
              </div>
              <p className="text-[11px] text-text-secondary leading-snug line-clamp-2">
                {wl.description}
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>Best: {wl.recommendedAlgorithm}</span>
                <Link
                  to="/simulator"
                  className="text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  Load <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

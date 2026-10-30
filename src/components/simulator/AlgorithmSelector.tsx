import { ALGORITHM_INFO } from '../../data/workloads';
import type { AlgorithmConfig } from '../../engine/types';

interface AlgorithmSelectorProps {
  config: AlgorithmConfig;
  onChange: (config: AlgorithmConfig) => void;
}

export default function AlgorithmSelector({ config, onChange }: AlgorithmSelectorProps) {
  const selected = ALGORITHM_INFO.find(a => a.type === config.type);

  return (
    <div className="space-y-4">
      {/* Algorithm grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ALGORITHM_INFO.map(algo => (
          <button
            key={algo.type}
            onClick={() => onChange({ type: algo.type, timeQuantum: config.timeQuantum ?? 2 })}
            className={`p-3 rounded-xl border text-left transition-all duration-200 ${
              config.type === algo.type
                ? 'bg-cyan-500/10 border-cyan-500/40 text-text-primary'
                : 'bg-surface border-border hover:border-border-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono">{algo.shortName}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                algo.isPreemptive
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {algo.isPreemptive ? 'P' : 'NP'}
              </span>
            </div>
            <div className="text-[10px] text-text-muted leading-snug line-clamp-2">
              {algo.name}
            </div>
          </button>
        ))}
      </div>

      {/* Selected algorithm info */}
      {selected && (
        <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-text-primary">{selected.name}</div>
            <div className="flex items-center gap-2">
              <span className={`badge ${selected.isPreemptive ? 'badge-amber' : 'badge-emerald'}`}>
                {selected.isPreemptive ? 'Preemptive' : 'Non-Preemptive'}
              </span>
              {selected.usesPriority && <span className="badge-violet">Priority</span>}
            </div>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{selected.description}</p>
          <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
            <span>Complexity: {selected.complexity}</span>
          </div>
        </div>
      )}

      {/* Time Quantum (Round Robin only) */}
      {config.type === 'RR' && (
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
          <label className="block text-xs font-medium text-cyan-400 mb-2">
            Time Quantum
          </label>
          <div className="flex items-center gap-3">
            <input
              id="time-quantum-input"
              type="number"
              min={1}
              max={100}
              value={config.timeQuantum ?? 2}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  onChange({ ...config, timeQuantum: val });
                }
              }}
              className="input-field w-24 font-mono"
            />
            <span className="text-xs text-text-muted">time units per process slice</span>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[1, 2, 3, 4].map(q => (
              <button
                key={q}
                onClick={() => onChange({ ...config, timeQuantum: q })}
                className={`px-2 py-1 text-xs rounded font-mono transition-colors ${
                  config.timeQuantum === q
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-surface-2 text-text-muted hover:text-text-secondary border border-border'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { BarChart3, Shuffle, Layers } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import ComparisonLab from '../components/comparison/ComparisonLab';
import ProcessTable from '../components/process/ProcessTable';
import { SAMPLE_WORKLOADS, getProcessColor } from '../data/workloads';
import type { Process } from '../engine/types';

export default function ComparisonPage() {
  const [processes, setProcesses] = useState<Process[]>([
    { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 8, priority: 2, color: getProcessColor(0) },
    { pid: 2, name: 'P2', arrivalTime: 2, burstTime: 4, priority: 1, color: getProcessColor(1) },
    { pid: 3, name: 'P3', arrivalTime: 4, burstTime: 6, priority: 3, color: getProcessColor(2) },
    { pid: 4, name: 'P4', arrivalTime: 5, burstTime: 2, priority: 0, color: getProcessColor(3) },
  ]);

  const [showEditor, setShowEditor] = useState<boolean>(false);

  const handleAddProcess = () => {
    const nextPid = Math.max(...processes.map(p => p.pid), 0) + 1;
    setProcesses(prev => [
      ...prev,
      {
        pid: nextPid,
        name: `P${nextPid}`,
        arrivalTime: 0,
        burstTime: 4,
        priority: 1,
        color: getProcessColor(prev.length),
      },
    ]);
  };

  const handleUpdateProcess = (
    pid: number,
    updates: Partial<Omit<Process, 'pid' | 'color'>>
  ) => {
    setProcesses(prev => prev.map(p => (p.pid === pid ? { ...p, ...updates } : p)));
  };

  const handleDeleteProcess = (pid: number) => {
    setProcesses(prev => prev.filter(p => p.pid !== pid));
  };

  const handleGenerateRandom = (count = 4) => {
    const generated: Process[] = [];
    for (let i = 0; i < count; i++) {
      generated.push({
        pid: i + 1,
        name: `P${i + 1}`,
        arrivalTime: Math.floor(Math.random() * 8),
        burstTime: Math.floor(Math.random() * 8) + 1,
        priority: Math.floor(Math.random() * 5),
        color: getProcessColor(i),
      });
    }
    setProcesses(generated);
  };

  const handleLoadWorkload = (raw: Omit<Process, 'color'>[]) => {
    setProcesses(
      raw.map((p, idx) => ({
        ...p,
        color: getProcessColor(idx),
      }))
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Algorithm Comparison Laboratory"
        subtitle="Benchmark FCFS, SJF, SRTF, Priority NP, Priority P, and Round Robin simultaneously on identical process workloads."
        badge="6 Algorithms"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateRandom(4)}
              className="btn-secondary flex items-center gap-1.5 text-xs"
            >
              <Shuffle size={14} />
              Random Workload
            </button>
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="btn-primary flex items-center gap-1.5 text-xs"
            >
              <Layers size={14} />
              {showEditor ? 'Hide Workload Editor' : 'Edit Workload'}
            </button>
          </div>
        }
      />

      {/* Preset Workload Quick Selector */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <span className="text-xs font-medium text-text-muted mr-1">Workload Presets:</span>
        {SAMPLE_WORKLOADS.map(wl => (
          <button
            key={wl.id}
            onClick={() => handleLoadWorkload(wl.processes)}
            className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            {wl.name}
          </button>
        ))}
      </div>

      {/* Optional Workload Editor Accordion */}
      {showEditor && (
        <div className="animate-in">
          <ProcessTable
            processes={processes}
            onAdd={handleAddProcess}
            onUpdate={handleUpdateProcess}
            onDelete={handleDeleteProcess}
            onGenerateRandom={handleGenerateRandom}
            onLoadWorkload={handleLoadWorkload}
            onClear={() => setProcesses([])}
          />
        </div>
      )}

      {/* Comparison Laboratory Core */}
      {processes.length > 0 ? (
        <ComparisonLab processes={processes} />
      ) : (
        <div className="card py-12 text-center text-text-muted text-xs">
          Please add at least one process to run the comparison benchmark.
        </div>
      )}
    </div>
  );
}

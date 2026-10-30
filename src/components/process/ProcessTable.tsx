import { useState } from 'react';
import { Plus, Trash2, Shuffle, Upload, Download, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Process } from '../../engine/types';
import { validateProcess } from '../../engine/validation';
import { SAMPLE_WORKLOADS } from '../../data/workloads';
import { exportProcessesToCSV, downloadFile, importProcessesFromCSV, readFileAsText } from '../../utils/export';

interface ProcessTableProps {
  processes: Process[];
  onAdd: () => void;
  onUpdate: (pid: number, updates: Partial<Omit<Process, 'pid' | 'color'>>) => void;
  onDelete: (pid: number) => void;
  onGenerateRandom: (count?: number) => void;
  onLoadWorkload: (processes: Omit<Process, 'color'>[]) => void;
  onClear: () => void;
}

export default function ProcessTable({
  processes,
  onAdd,
  onUpdate,
  onDelete,
  onGenerateRandom,
  onLoadWorkload,
  onClear,
}: ProcessTableProps) {
  const [editErrors, setEditErrors] = useState<Map<number, Record<string, string>>>(new Map());
  const [showWorkloads, setShowWorkloads] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  function handleFieldChange(pid: number, field: keyof Omit<Process, 'pid' | 'color' | 'name'>, rawValue: string) {
    const numValue = parseFloat(rawValue);
    if (isNaN(numValue)) return;

    const current = processes.find(p => p.pid === pid)!;
    const updated = { ...current, [field]: numValue };
    const errors = validateProcess(updated, processes.filter(p => p.pid !== pid).map(p => p.pid));
    const fieldError = errors.find(e => e.field === field);

    setEditErrors(prev => {
      const next = new Map(prev);
      const pidErrors = { ...(next.get(pid) ?? {}) };
      if (fieldError) {
        pidErrors[field] = fieldError.message;
      } else {
        delete pidErrors[field];
      }
      next.set(pid, pidErrors);
      return next;
    });

    if (!fieldError) {
      onUpdate(pid, { [field]: numValue });
    }
  }

  function handleNameChange(pid: number, value: string) {
    onUpdate(pid, { name: value });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const { processes: imported, errors } = importProcessesFromCSV(text);
      if (errors.length > 0) {
        setImportError(errors.map(e => e.message).join('\n'));
        return;
      }
      setImportError(null);
      onLoadWorkload(imported);
    } catch {
      setImportError('Failed to read file');
    }
    e.target.value = '';
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={onAdd} className="btn-primary flex items-center gap-1.5" id="add-process-btn">
            <Plus size={14} />
            Add Process
          </button>
          <button onClick={() => onGenerateRandom()} className="btn-secondary flex items-center gap-1.5">
            <Shuffle size={14} />
            Random
          </button>

          {/* Workload dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowWorkloads(v => !v)}
              className="btn-secondary flex items-center gap-1.5"
              id="load-workload-btn"
            >
              Load Example
              <ChevronDown size={12} className={`transition-transform ${showWorkloads ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showWorkloads && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 mt-1 w-64 bg-surface-2 border border-border rounded-xl shadow-xl z-20 overflow-hidden"
                >
                  {SAMPLE_WORKLOADS.map(wl => (
                    <button
                      key={wl.id}
                      onClick={() => {
                        onLoadWorkload(wl.processes);
                        setShowWorkloads(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-surface-3 transition-colors border-b border-border last:border-0"
                    >
                      <div className="text-sm font-medium text-text-primary">{wl.name}</div>
                      <div className="text-xs text-text-muted mt-0.5 leading-snug">{wl.description}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Import CSV */}
          <label className="btn-secondary flex items-center gap-1.5 cursor-pointer">
            <Upload size={14} />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>

          {/* Export CSV */}
          <button
            onClick={() => {
              const csv = exportProcessesToCSV(processes);
              downloadFile(csv, 'schedulix-processes.csv');
            }}
            className="btn-secondary flex items-center gap-1.5"
            disabled={processes.length === 0}
          >
            <Download size={14} />
            Export CSV
          </button>

          <button onClick={onClear} className="btn-ghost text-text-muted hover:text-rose-400">
            Clear All
          </button>
        </div>
      </div>

      {/* Import error */}
      {importError && (
        <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <pre className="font-mono text-xs whitespace-pre-wrap">{importError}</pre>
        </div>
      )}

      {/* Table */}
      {processes.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <div className="text-text-muted text-sm">No processes. Add one or load an example.</div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-text-muted font-medium text-xs uppercase tracking-wide w-12">Color</th>
                <th className="text-left px-4 py-2.5 text-text-muted font-medium text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-2.5 text-text-muted font-medium text-xs uppercase tracking-wide">Arrival (ms)</th>
                <th className="text-left px-4 py-2.5 text-text-muted font-medium text-xs uppercase tracking-wide">Burst (ms)</th>
                <th className="text-left px-4 py-2.5 text-text-muted font-medium text-xs uppercase tracking-wide">Priority</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {processes.map((p, idx) => {
                  const pidErrors = editErrors.get(p.pid) ?? {};
                  return (
                    <motion.tr
                      key={p.pid}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.15 }}
                      className="border-b border-border/50 last:border-0 hover:bg-surface-2/50 group"
                    >
                      <td className="px-4 py-2.5">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={p.name}
                          onChange={e => handleNameChange(p.pid, e.target.value)}
                          className="input-field w-20 py-1 text-xs font-mono"
                          maxLength={10}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            defaultValue={p.arrivalTime}
                            onChange={e => handleFieldChange(p.pid, 'arrivalTime', e.target.value)}
                            className={`input-field w-20 py-1 text-xs font-mono ${pidErrors.arrivalTime ? 'border-rose-500/50' : ''}`}
                          />
                          {pidErrors.arrivalTime && (
                            <div className="absolute top-full mt-0.5 left-0 text-rose-400 text-xs bg-surface border border-rose-500/20 rounded px-2 py-1 z-10 w-max max-w-xs">
                              {pidErrors.arrivalTime}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            defaultValue={p.burstTime}
                            onChange={e => handleFieldChange(p.pid, 'burstTime', e.target.value)}
                            className={`input-field w-20 py-1 text-xs font-mono ${pidErrors.burstTime ? 'border-rose-500/50' : ''}`}
                          />
                          {pidErrors.burstTime && (
                            <div className="absolute top-full mt-0.5 left-0 text-rose-400 text-xs bg-surface border border-rose-500/20 rounded px-2 py-1 z-10 w-max max-w-xs">
                              {pidErrors.burstTime}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={p.priority}
                          onChange={e => handleFieldChange(p.pid, 'priority', e.target.value)}
                          className="input-field w-20 py-1 text-xs font-mono"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => onDelete(p.pid)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-rose-400 transition-all rounded"
                          title="Delete process"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
      <div className="text-xs text-text-muted">
        {processes.length} process{processes.length !== 1 ? 'es' : ''} · Lower priority number = higher priority
      </div>
    </div>
  );
}

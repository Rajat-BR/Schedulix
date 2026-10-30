import { useState } from 'react';
import {
  HelpCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  ListOrdered,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { SimulationResult, SchedulingEventType } from '../../engine/types';
import { explainDecision } from '../../engine/scheduler';

interface DecisionInspectorProps {
  result: SimulationResult;
  selectedSegmentIndex: number;
  onSelectSegment: (index: number) => void;
}

export default function DecisionInspector({
  result,
  selectedSegmentIndex,
  onSelectSegment,
}: DecisionInspectorProps) {
  const [activeTab, setActiveTab] = useState<'decision' | 'events'>('decision');
  const [eventFilter, setEventFilter] = useState<string>('ALL');

  const { ganttChart, events, algorithmConfig } = result;
  const currentSegment = ganttChart[selectedSegmentIndex] ?? ganttChart[0];
  const decision = currentSegment
    ? explainDecision(result, algorithmConfig, selectedSegmentIndex)
    : null;

  const filteredEvents = events.filter(e => {
    if (eventFilter === 'ALL') return true;
    return e.type === eventFilter;
  });

  const getEventBadgeClass = (type: SchedulingEventType) => {
    switch (type) {
      case 'ARRIVAL':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'DISPATCH':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'PREEMPTION':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'QUANTUM_EXPIRY':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'COMPLETION':
        return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
      case 'IDLE_START':
      case 'IDLE_END':
        return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
      case 'CONTEXT_SWITCH':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-surface-3 text-text-muted';
    }
  };

  return (
    <div className="card space-y-4">
      {/* Header with Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            Scheduling Decision Inspector
          </h3>
        </div>

        <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab('decision')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'decision'
                ? 'bg-surface-3 text-cyan-400 shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Decision Analysis
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'events'
                ? 'bg-surface-3 text-cyan-400 shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Trace Log ({events.length})
          </button>
        </div>
      </div>

      {activeTab === 'decision' ? (
        <div className="space-y-4">
          {/* Segment Navigator */}
          <div className="flex items-center justify-between bg-surface-2/60 border border-border rounded-xl p-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">Gantt Segment:</span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="font-bold text-text-primary">
                  {selectedSegmentIndex + 1} of {ganttChart.length}
                </span>
                <span className="text-text-muted">|</span>
                <span className="text-cyan-400 font-semibold">
                  [{currentSegment?.startTime}u → {currentSegment?.endTime}u]
                </span>
                <span className="text-text-muted">|</span>
                <span className="font-semibold text-text-primary">
                  {currentSegment?.processName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onSelectSegment(Math.max(0, selectedSegmentIndex - 1))}
                disabled={selectedSegmentIndex <= 0}
                className="btn-ghost p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous segment"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  onSelectSegment(Math.min(ganttChart.length - 1, selectedSegmentIndex + 1))
                }
                disabled={selectedSegmentIndex >= ganttChart.length - 1}
                className="btn-ghost p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next segment"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Decision Explanation Box */}
          {decision && (
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-cyan-400" />
                  <span className="text-xs font-mono font-semibold text-cyan-400">
                    Decision at t={decision.timestamp}
                  </span>
                </div>
                {decision.preemptionOccurred && (
                  <span className="badge-rose flex items-center gap-1 text-[10px]">
                    <AlertTriangle size={11} />
                    Preemption Event
                  </span>
                )}
              </div>

              <p className="text-xs text-text-primary leading-relaxed font-mono bg-surface-2/80 p-3 rounded-lg border border-border">
                {decision.reason}
              </p>

              {/* Ready Queue Candidates at that moment */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={13} />
                  Ready Queue Competitors at t={decision.timestamp} ({decision.availableProcesses.length})
                </div>

                {decision.availableProcesses.length === 0 ? (
                  <div className="text-xs text-text-muted italic py-1">
                    No processes waiting in ready queue at this timestamp.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {decision.availableProcesses.map(p => {
                      const isSelected = p.pid === decision.selectedPid;
                      return (
                        <div
                          key={p.pid}
                          className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                            isSelected
                              ? 'bg-cyan-500/15 border-cyan-500/50 ring-1 ring-cyan-500/30'
                              : 'bg-surface-2/40 border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-text-primary">
                              {p.name} {isSelected && '✓ [DISPATCHED]'}
                            </span>
                            <span className="text-[10px] text-text-muted">PID {p.pid}</span>
                          </div>
                          <div className="text-[11px] text-text-secondary space-y-0.5">
                            <div>Remaining BT: <span className="text-amber-400">{p.remainingBurst}u</span></div>
                            <div>Priority: <span className="text-violet-400">{p.priority}</span></div>
                            <div>Waiting: <span className="text-text-muted">{p.waitingTime}u</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Chronological Events Log */
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-text-muted flex items-center gap-1 mr-1">
              <Filter size={12} />
              Filter:
            </span>
            {['ALL', 'ARRIVAL', 'DISPATCH', 'PREEMPTION', 'QUANTUM_EXPIRY', 'COMPLETION', 'IDLE_START'].map(
              f => (
                <button
                  key={f}
                  onClick={() => setEventFilter(f)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                    eventFilter === f
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-surface-2 text-text-muted hover:text-text-primary'
                  }`}
                >
                  {f}
                </button>
              )
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filteredEvents.map((event, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-surface-2/50 border border-border/60 hover:bg-surface-2 text-xs font-mono transition-colors"
              >
                <div className="w-12 text-cyan-400 font-bold flex-shrink-0 pt-0.5">
                  t={event.time}u
                </div>
                <div className="flex-shrink-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getEventBadgeClass(
                      event.type
                    )}`}
                  >
                    {event.type}
                  </span>
                </div>
                <div className="flex-1 text-text-primary text-[11px] leading-relaxed">
                  {event.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

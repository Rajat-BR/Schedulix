import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Cpu, CheckCircle } from 'lucide-react';
import type { PlaybackState, SimulationResult } from '../../engine/types';

interface CPUMonitorProps {
  playback: PlaybackState;
  result: SimulationResult;
}

export default function CPUMonitor({ playback, result }: CPUMonitorProps) {
  const { currentTime, activeSegment, runningProcess, completedProcesses, readyQueue } = playback;
  const isIdle = !activeSegment || activeSegment.pid === 'IDLE';

  // Find next event
  const nextEvent = result.ganttChart.find(seg => seg.startTime > currentTime);

  return (
    <div className="space-y-3">
      {/* CPU Status */}
      <div className={`border rounded-xl p-4 transition-colors ${
        isIdle
          ? 'bg-surface border-border'
          : 'bg-cyan-500/5 border-cyan-500/30'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu size={14} className={isIdle ? 'text-text-muted' : 'text-cyan-400'} />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">CPU</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            isIdle
              ? 'bg-surface-3 text-text-muted'
              : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isIdle ? 'bg-text-muted' : 'bg-cyan-400 animate-pulse'}`} />
            {isIdle ? 'Idle' : 'Running'}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isIdle && runningProcess ? (
            <motion.div
              key={runningProcess.pid}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: runningProcess.color }}
                />
                <span className="text-sm font-bold text-text-primary font-mono">{runningProcess.name}</span>
                <span className="text-xs text-text-muted">PID {runningProcess.pid}</span>
              </div>
              {activeSegment && (
                <div className="text-xs text-text-muted font-mono space-y-0.5">
                  <div>Remaining: {Math.max(0, activeSegment.endTime - currentTime).toFixed(1)}u</div>
                  <div>Priority: {runningProcess.priority}</div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-text-muted"
            >
              {nextEvent
                ? `Next process arrives at t=${nextEvent.startTime}`
                : 'Simulation complete'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Time & Progress */}
      <div className="grid grid-cols-2 gap-2">
        <div className="metric-card">
          <div className="section-label text-[10px]">Simulation Time</div>
          <div className="text-lg font-bold font-mono text-text-primary">
            {currentTime.toFixed(1)}
          </div>
        </div>
        <div className="metric-card">
          <div className="section-label text-[10px]">Completed</div>
          <div className="text-lg font-bold font-mono text-text-primary">
            {completedProcesses} / {result.processes.length}
          </div>
        </div>
      </div>

      {/* Ready Queue */}
      <div className="bg-surface border border-border rounded-xl p-3">
        <div className="section-label mb-2 flex items-center justify-between">
          <span>Ready Queue ({readyQueue.length})</span>
          {readyQueue.length > 0 && (
            <span className="text-[10px] text-text-muted font-mono font-normal">
              FIFO (Head → Tail)
            </span>
          )}
        </div>
        {readyQueue.length === 0 ? (
          <div className="text-xs text-text-muted">Empty</div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {readyQueue.slice(0, 6).map((entry, idx) => (
                <motion.div
                  key={entry.pid}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-between bg-surface-2 rounded-lg px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-text-muted w-3 text-right">
                      {idx + 1}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs font-mono font-medium text-text-primary">{entry.name}</span>
                    {idx === 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        HEAD
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono">
                    <span>rem={entry.remainingBurstTime.toFixed(1)}</span>
                    <span>pri={entry.priority}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {readyQueue.length > 6 && (
              <div className="text-[10px] text-text-muted text-center pt-1 font-mono">
                +{readyQueue.length - 6} more waiting
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next event */}
      {nextEvent && nextEvent.startTime > currentTime && (
        <div className="text-xs text-text-muted bg-surface border border-border rounded-lg px-3 py-2 font-mono">
          Next: {nextEvent.processName} at t={nextEvent.startTime}
        </div>
      )}
    </div>
  );
}

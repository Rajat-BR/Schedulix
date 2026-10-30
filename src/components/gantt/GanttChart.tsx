import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ExecutionSegment, SimulationResult } from '../../engine/types';

interface GanttChartProps {
  result: SimulationResult;
  currentTime: number;
  onSeek?: (time: number) => void;
  onSegmentClick?: (index: number) => void;
  selectedSegmentIndex?: number;
}

const TIMELINE_HEIGHT = 56;
const LABEL_WIDTH = 0;
const MIN_SEGMENT_WIDTH = 24;

export default function GanttChart({
  result,
  currentTime,
  onSeek,
  onSegmentClick,
  selectedSegmentIndex,
}: GanttChartProps) {
  const [tooltip, setTooltip] = useState<{
    seg: ExecutionSegment;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { ganttChart: segments, totalTime } = result;
  if (segments.length === 0) return null;

  const chartWidth = containerRef.current?.clientWidth ?? 800;
  const availableWidth = Math.max(chartWidth - LABEL_WIDTH - 40, 400);

  // Scale: pixels per time unit
  const scale = availableWidth / Math.max(totalTime, 1);
  const minScale = MIN_SEGMENT_WIDTH / 1; // minimum width
  const effectiveScale = Math.max(scale, minScale);
  const totalChartWidth = totalTime * effectiveScale;

  // Playhead position
  const playheadX = currentTime * effectiveScale;

  // Generate time tick marks
  const tickInterval = Math.ceil(totalTime / 20); // ~20 ticks max
  const ticks: number[] = [];
  for (let t = 0; t <= totalTime; t += Math.max(1, tickInterval)) {
    ticks.push(t);
  }
  if (!ticks.includes(totalTime)) ticks.push(totalTime);

  function handleScrubClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onSeek || !containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - LABEL_WIDTH;
    const clickedTime = x / effectiveScale;
    onSeek(Math.max(0, Math.min(clickedTime, totalTime)));
  }

  function handleSegmentMouseEnter(seg: ExecutionSegment, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setTooltip({ seg, x: rect.left + rect.width / 2, y: rect.top - 8 });
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-text-muted font-mono flex items-center justify-between">
        <span>Gantt Chart</span>
        <span className="text-cyan-400">t = {currentTime.toFixed(1)}</span>
      </div>

      <div
        ref={containerRef}
        className="bg-surface-2 border border-border rounded-xl overflow-x-auto"
        style={{ position: 'relative' }}
      >
        <div style={{ minWidth: totalChartWidth + 60, padding: '12px 20px' }}>
          {/* Segments row */}
          <div
            className="relative cursor-crosshair select-none"
            style={{ height: TIMELINE_HEIGHT, marginBottom: 20 }}
            onClick={handleScrubClick}
          >
            {/* Background grid lines */}
            {ticks.map(t => (
              <div
                key={t}
                className="absolute top-0 bottom-0 border-l border-border/40"
                style={{ left: t * effectiveScale }}
              />
            ))}

            {/* Segments */}
            {segments.map((seg, idx) => {
              const x = seg.startTime * effectiveScale;
              const width = seg.duration * effectiveScale;
              const isIdle = seg.pid === 'IDLE';
              const isActive = seg.startTime <= currentTime && currentTime < seg.endTime;
              const isCompleted = seg.endTime <= currentTime;
              const isSelected = idx === selectedSegmentIndex;

              const bgColor = isIdle
                ? undefined
                : (result.processes.find(p => p.pid === seg.pid)?.color ?? '#22d3ee');

              return (
                <motion.div
                  key={`${idx}-${seg.startTime}`}
                  className={`absolute top-1 flex items-center justify-center rounded text-xs font-bold font-mono cursor-pointer transition-all ${
                    isIdle
                      ? 'bg-surface-3 border border-dashed border-border text-text-muted'
                      : `border`
                  } ${isSelected ? 'ring-2 ring-white/40' : ''}`}
                  style={{
                    left: x + 1,
                    width: Math.max(width - 2, 2),
                    height: TIMELINE_HEIGHT - 8,
                    backgroundColor: isIdle ? undefined : `${bgColor}${isCompleted ? '66' : isActive ? 'ff' : '33'}`,
                    borderColor: isIdle ? undefined : `${bgColor}88`,
                    color: isIdle ? undefined : bgColor,
                    opacity: isCompleted ? 0.75 : 1,
                  }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  onMouseEnter={e => handleSegmentMouseEnter(seg, e)}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={e => {
                    e.stopPropagation();
                    onSegmentClick?.(idx);
                  }}
                  title={`${seg.processName}: ${seg.startTime}→${seg.endTime} (${seg.duration}u)`}
                >
                  {width > 30 && (
                    <span style={{ color: isIdle ? undefined : bgColor }}>
                      {seg.pid === 'IDLE' ? 'IDLE' : seg.processName}
                    </span>
                  )}
                </motion.div>
              );
            })}

            {/* Playhead */}
            <motion.div
              className="absolute top-0 bottom-0 z-10 pointer-events-none"
              style={{ left: playheadX }}
              animate={{ left: playheadX }}
              transition={{ duration: 0.05 }}
            >
              <div className="w-0.5 h-full bg-white/80 relative">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white" />
              </div>
            </motion.div>
          </div>

          {/* Time axis */}
          <div className="relative h-5" style={{ marginTop: -12 }}>
            {ticks.map(t => (
              <div
                key={t}
                className="absolute text-[10px] font-mono text-text-muted transform -translate-x-1/2"
                style={{ left: t * effectiveScale }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-border px-5 py-2 flex flex-wrap gap-3">
          {result.processes.map(p => (
            <div key={p.pid} className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              <span className="font-mono">{p.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <div className="w-2.5 h-2.5 rounded-sm bg-surface-3 border border-dashed border-border" />
            <span>IDLE</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="font-bold text-text-primary">{tooltip.seg.processName}</div>
          <div className="text-text-secondary font-mono">
            {tooltip.seg.startTime} → {tooltip.seg.endTime}
          </div>
          <div className="text-text-muted">Duration: {tooltip.seg.duration} units</div>
        </div>
      )}
    </div>
  );
}

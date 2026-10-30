import { Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import type { PlaybackState, SimulationResult } from '../../engine/types';

interface PlaybackControlsProps {
  playback: PlaybackState;
  result: SimulationResult;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSetSpeed: (speed: 1 | 2 | 4 | 8) => void;
  onSeek: (time: number) => void;
}

const SPEEDS: Array<1 | 2 | 4 | 8> = [1, 2, 4, 8];

export default function PlaybackControls({
  playback,
  result,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSetSpeed,
  onSeek,
}: PlaybackControlsProps) {
  const { currentTime, isPlaying, speed } = playback;
  const totalTime = result.totalTime;
  const progress = totalTime > 0 ? currentTime / totalTime : 0;
  const isFinished = currentTime >= totalTime;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
      {/* Timeline scrubber */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-text-muted font-mono">
          <span>t = {currentTime.toFixed(1)}</span>
          <span>{totalTime} units</span>
        </div>
        <input
          id="timeline-scrubber"
          type="range"
          min={0}
          max={totalTime}
          step={0.1}
          value={currentTime}
          onChange={e => onSeek(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #22d3ee ${progress * 100}%, #22263a ${progress * 100}%)`,
          }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Main controls */}
        <div className="flex items-center gap-2">
          <button
            id="playback-reset-btn"
            onClick={onReset}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-lg transition-all"
            title="Reset"
          >
            <RotateCcw size={15} />
          </button>

          <button
            id="playback-play-btn"
            onClick={isPlaying ? onPause : onPlay}
            disabled={isFinished && !isPlaying}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isFinished
                ? 'bg-surface-2 text-text-muted cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-background'
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause' : isFinished ? 'Done' : 'Play'}
          </button>

          <button
            id="playback-step-btn"
            onClick={onStep}
            disabled={isFinished}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Step forward"
          >
            <SkipForward size={15} />
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1.5">
          <Gauge size={13} className="text-text-muted" />
          <div className="flex gap-1">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-1 text-xs font-mono rounded transition-all ${
                  speed === s
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-2 border border-transparent'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500 transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

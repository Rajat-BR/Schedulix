import { useState } from 'react';
import { Cpu, Play, AlertCircle } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import ProcessTable from '../components/process/ProcessTable';
import AlgorithmSelector from '../components/simulator/AlgorithmSelector';
import PlaybackControls from '../components/simulator/PlaybackControls';
import GanttChart from '../components/gantt/GanttChart';
import CPUMonitor from '../components/simulator/CPUMonitor';
import DecisionInspector from '../components/simulator/DecisionInspector';
import MetricsSummary from '../components/analytics/MetricsSummary';
import ProcessMetricsTable from '../components/analytics/ProcessMetricsTable';
import { useSimulator } from '../hooks/useSimulator';

export default function SimulatorPage() {
  const {
    processes,
    config,
    result,
    error,
    playback,
    addProcess,
    updateProcess,
    deleteProcess,
    setConfig,
    runSimulation,
    play,
    pause,
    step,
    reset,
    setSpeed,
    seekTo,
    generateRandom,
    loadWorkload,
    clearProcesses,
  } = useSimulator();

  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);

  const handleSegmentClick = (index: number) => {
    setSelectedSegmentIndex(index);
    if (result && result.ganttChart[index]) {
      seekTo(result.ganttChart[index].startTime);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="CPU Scheduling Simulator"
        subtitle="Configure workloads, execute scheduling algorithms, and examine animated cycle traces in real time."
        badge={config.type}
        actions={
          <button
            onClick={runSimulation}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Play size={15} className="fill-current" />
            <span>Run Simulation</span>
          </button>
        }
      />

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Grid: Workload Management & Algorithm Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ProcessTable
            processes={processes}
            onAdd={addProcess}
            onUpdate={updateProcess}
            onDelete={deleteProcess}
            onGenerateRandom={generateRandom}
            onLoadWorkload={loadWorkload}
            onClear={clearProcesses}
          />
        </div>

        <div className="lg:col-span-5">
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Cpu size={16} className="text-cyan-400" />
              Algorithm Selection & Configuration
            </h3>
            <AlgorithmSelector config={config} onChange={setConfig} />
          </div>
        </div>
      </div>

      {/* Simulation Execution & Visualization */}
      {result ? (
        <div className="space-y-6">
          {/* Playback Controls */}
          <PlaybackControls
            playback={playback}
            result={result}
            onPlay={play}
            onPause={pause}
            onStep={step}
            onReset={reset}
            onSetSpeed={setSpeed}
            onSeek={seekTo}
          />

          {/* Interactive Gantt Chart */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Interactive Execution Timeline</h3>
              <span className="text-[11px] text-text-muted">
                Click any segment to inspect scheduling rationale & queue state
              </span>
            </div>
            <GanttChart
              result={result}
              currentTime={playback.currentTime}
              onSeek={seekTo}
              onSegmentClick={handleSegmentClick}
              selectedSegmentIndex={selectedSegmentIndex}
            />
          </div>

          {/* CPU Monitor & Decision Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <div className="card space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">CPU & Ready Queue State</h3>
                <CPUMonitor playback={playback} result={result} />
              </div>
            </div>

            <div className="lg:col-span-8">
              <DecisionInspector
                result={result}
                selectedSegmentIndex={selectedSegmentIndex}
                onSelectSegment={handleSegmentClick}
              />
            </div>
          </div>

          {/* Performance Analytics & Process Metrics Table */}
          <MetricsSummary result={result} />
          <ProcessMetricsTable result={result} />
        </div>
      ) : (
        <div className="card py-12 text-center space-y-3">
          <Cpu size={36} className="mx-auto text-cyan-400/50" />
          <h3 className="text-base font-semibold text-text-primary">Simulation Ready</h3>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Click &quot;Run Simulation&quot; above to calculate execution traces, generate the Gantt chart, and compute scheduling analytics.
          </p>
          <button
            onClick={runSimulation}
            className="btn-primary inline-flex items-center gap-2 mt-2"
          >
            <Play size={14} className="fill-current" />
            Execute Now
          </button>
        </div>
      )}
    </div>
  );
}

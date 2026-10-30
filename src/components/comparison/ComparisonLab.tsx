import { useState, useMemo } from 'react';
import {
  BarChart3,
  Award,
  Layers,
  Settings,
  Download,
  CheckCircle2,
} from 'lucide-react';
import type { Process, SimulationResult, AlgorithmConfig } from '../../engine/types';
import { runScheduler } from '../../engine/scheduler';
import { ALGORITHM_INFO } from '../../data/workloads';
import { downloadFile } from '../../utils/export';

interface ComparisonLabProps {
  processes: Process[];
}

export default function ComparisonLab({ processes }: ComparisonLabProps) {
  const [rrQuantum, setRrQuantum] = useState<number>(2);

  // Run all 6 algorithms on the current workload
  const comparisonResults = useMemo(() => {
    const algorithms: AlgorithmConfig[] = [
      { type: 'FCFS' },
      { type: 'SJF' },
      { type: 'SRTF' },
      { type: 'PRIORITY_NP' },
      { type: 'PRIORITY_P' },
      { type: 'RR', timeQuantum: rrQuantum },
    ];

    const results: { config: AlgorithmConfig; result: SimulationResult }[] = [];

    for (const config of algorithms) {
      const res = runScheduler(processes, config);
      if (res.success) {
        results.push({ config, result: res.result });
      }
    }

    return results;
  }, [processes, rrQuantum]);

  // Find best performers for each metric
  const bestMetrics = useMemo(() => {
    if (comparisonResults.length === 0) return null;

    let minWT = Infinity;
    let minTAT = Infinity;
    let minRT = Infinity;
    let maxUtil = -Infinity;
    let minCS = Infinity;

    for (const { result } of comparisonResults) {
      if (result.metrics.averageWaitingTime < minWT) minWT = result.metrics.averageWaitingTime;
      if (result.metrics.averageTurnaroundTime < minTAT) minTAT = result.metrics.averageTurnaroundTime;
      if (result.metrics.averageResponseTime < minRT) minRT = result.metrics.averageResponseTime;
      if (result.metrics.cpuUtilization > maxUtil) maxUtil = result.metrics.cpuUtilization;
      if (result.metrics.contextSwitches < minCS) minCS = result.metrics.contextSwitches;
    }

    return { minWT, minTAT, minRT, maxUtil, minCS };
  }, [comparisonResults]);

  // Export comparison table to CSV
  const handleExportCSV = () => {
    const headers = [
      'Algorithm',
      'Avg Waiting Time',
      'Avg Turnaround Time',
      'Avg Response Time',
      'CPU Utilization (%)',
      'Throughput (proc/u)',
      'Context Switches',
      'Total Time',
    ];

    const rows = comparisonResults.map(({ result, config }) => {
      const name = config.type === 'RR' ? `RR (q=${rrQuantum})` : config.type;
      return [
        name,
        result.metrics.averageWaitingTime.toFixed(2),
        result.metrics.averageTurnaroundTime.toFixed(2),
        result.metrics.averageResponseTime.toFixed(2),
        result.metrics.cpuUtilization.toFixed(1),
        result.metrics.throughput.toFixed(3),
        result.metrics.contextSwitches,
        result.totalTime,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, 'schedulix_algorithm_comparison.csv', 'text/csv');
  };

  const maxTotalTime = useMemo(() => {
    return Math.max(...comparisonResults.map(r => r.result.totalTime), 1);
  }, [comparisonResults]);

  return (
    <div className="space-y-6">
      {/* Configuration bar */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-cyan-400" />
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Multi-Algorithm Comparison Laboratory
            </h3>
            <p className="text-xs text-text-muted">
              Benchmarking {comparisonResults.length} algorithms on {processes.length} identical processes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
            <Settings size={14} className="text-text-muted" />
            <span className="text-xs text-text-secondary font-mono">RR Quantum:</span>
            <input
              type="number"
              min={1}
              max={20}
              value={rrQuantum}
              onChange={e => setRrQuantum(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 bg-surface-3 border border-border rounded px-2 py-0.5 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="btn-secondary flex items-center gap-1.5 text-xs"
            title="Export comparison data to CSV"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Side-by-Side Comprehensive Metrics Table */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Award size={16} className="text-amber-400" />
            Comparative Metrics Matrix
          </h4>
          <span className="text-[11px] text-text-muted">
            Green highlights indicate best algorithm performance in each category
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-2 text-text-secondary border-b border-border">
                <th className="py-2.5 px-3 font-semibold">Algorithm</th>
                <th className="py-2.5 px-3 font-semibold text-right">Avg Waiting Time</th>
                <th className="py-2.5 px-3 font-semibold text-right">Avg Turnaround Time</th>
                <th className="py-2.5 px-3 font-semibold text-right">Avg Response Time</th>
                <th className="py-2.5 px-3 font-semibold text-right">CPU Utilization</th>
                <th className="py-2.5 px-3 font-semibold text-right">Throughput</th>
                <th className="py-2.5 px-3 font-semibold text-right">Context Switches</th>
                <th className="py-2.5 px-3 font-semibold text-right">Total Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {comparisonResults.map(({ result, config }) => {
                const info = ALGORITHM_INFO.find(a => a.type === config.type);
                const isBestWT = bestMetrics && result.metrics.averageWaitingTime === bestMetrics.minWT;
                const isBestTAT = bestMetrics && result.metrics.averageTurnaroundTime === bestMetrics.minTAT;
                const isBestRT = bestMetrics && result.metrics.averageResponseTime === bestMetrics.minRT;
                const isBestUtil = bestMetrics && result.metrics.cpuUtilization === bestMetrics.maxUtil;
                const isBestCS = bestMetrics && result.metrics.contextSwitches === bestMetrics.minCS;

                return (
                  <tr key={config.type} className="hover:bg-surface-2/60 transition-colors">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-text-primary font-bold">
                          {config.type === 'RR' ? `Round Robin (q=${rrQuantum})` : info?.name}
                        </span>
                        <span
                          className={`badge text-[9px] ${
                            info?.isPreemptive ? 'badge-amber' : 'badge-emerald'
                          }`}
                        >
                          {info?.isPreemptive ? 'Preemptive' : 'Non-Preemptive'}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        isBestWT ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-text-secondary'
                      }`}
                    >
                      {result.metrics.averageWaitingTime.toFixed(2)}u
                      {isBestWT && ' ★'}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        isBestTAT ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-text-secondary'
                      }`}
                    >
                      {result.metrics.averageTurnaroundTime.toFixed(2)}u
                      {isBestTAT && ' ★'}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        isBestRT ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-text-secondary'
                      }`}
                    >
                      {result.metrics.averageResponseTime.toFixed(2)}u
                      {isBestRT && ' ★'}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        isBestUtil ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-text-secondary'
                      }`}
                    >
                      {result.metrics.cpuUtilization.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-text-secondary">
                      {result.metrics.throughput.toFixed(3)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        isBestCS ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-text-secondary'
                      }`}
                    >
                      {result.metrics.contextSwitches}
                    </td>
                    <td className="py-2.5 px-3 text-right text-text-muted">
                      {result.totalTime}u
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Mini Gantt Timelines */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Layers size={16} className="text-cyan-400" />
            Timeline Alignment Across Algorithms
          </h4>
          <span className="text-[11px] text-text-muted">
            Direct visual comparison of CPU allocation patterns
          </span>
        </div>

        <div className="space-y-3">
          {comparisonResults.map(({ result, config }) => {
            const info = ALGORITHM_INFO.find(a => a.type === config.type);
            const label = config.type === 'RR' ? `RR (q=${rrQuantum})` : (info?.shortName ?? config.type);

            return (
              <div key={config.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-text-primary">{label}</span>
                  <span className="text-text-muted text-[11px]">
                    Total: {result.totalTime}u | WT: {result.metrics.averageWaitingTime.toFixed(2)}u
                  </span>
                </div>

                <div className="h-7 w-full bg-surface-2 rounded-lg border border-border overflow-hidden flex relative">
                  {result.ganttChart.map((seg, idx) => {
                    const widthPercent = (seg.duration / maxTotalTime) * 100;
                    const isIdle = seg.pid === 'IDLE';
                    const process = isIdle ? null : processes.find(p => p.pid === seg.pid);

                    return (
                      <div
                        key={idx}
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: isIdle ? '#1a1d27' : process?.color ?? '#22d3ee',
                        }}
                        className={`h-full border-r border-background/40 flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                          isIdle ? 'text-text-muted' : 'text-background'
                        }`}
                        title={`${seg.processName} [${seg.startTime} → ${seg.endTime}] duration: ${seg.duration}u`}
                      >
                        {widthPercent > 4 ? seg.processName : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

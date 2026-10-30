import { useState } from 'react';
import {
  Clock,
  Zap,
  Activity,
  ArrowRightLeft,
  Percent,
  TrendingUp,
  Download,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import type { SimulationResult } from '../../engine/types';
import { exportResultsToCSV, exportSummaryText, downloadFile } from '../../utils/export';

interface MetricsSummaryProps {
  result: SimulationResult;
}

export default function MetricsSummary({ result }: MetricsSummaryProps) {
  const [copied, setCopied] = useState(false);
  const { metrics, algorithm, totalTime } = result;

  const handleCopySummary = async () => {
    const text = exportSummaryText(result);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const csv = exportResultsToCSV(result);
    downloadFile(csv, `schedulix_${algorithm.toLowerCase()}_results.csv`, 'text/csv');
  };

  const handleDownloadSummary = () => {
    const text = exportSummaryText(result);
    downloadFile(text, `schedulix_${algorithm.toLowerCase()}_summary.txt`, 'text/plain');
  };

  const metricCards = [
    {
      label: 'Avg Waiting Time',
      value: `${metrics.averageWaitingTime.toFixed(2)}`,
      unit: 'time units',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      description: 'Time spent waiting in ready queue',
    },
    {
      label: 'Avg Turnaround Time',
      value: `${metrics.averageTurnaroundTime.toFixed(2)}`,
      unit: 'time units',
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      description: 'Time from arrival to completion',
    },
    {
      label: 'Avg Response Time',
      value: `${metrics.averageResponseTime.toFixed(2)}`,
      unit: 'time units',
      icon: Zap,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
      description: 'Time from arrival to first execution',
    },
    {
      label: 'CPU Utilization',
      value: `${metrics.cpuUtilization.toFixed(1)}%`,
      unit: `${metrics.totalBurstTime}u busy / ${totalTime}u total`,
      icon: Percent,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      description: 'Percentage of time CPU was non-idle',
    },
    {
      label: 'Throughput',
      value: `${metrics.throughput.toFixed(3)}`,
      unit: 'processes / time unit',
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      description: 'Completed processes per unit of time',
    },
    {
      label: 'Context Switches',
      value: `${metrics.contextSwitches}`,
      unit: 'switch events',
      icon: ArrowRightLeft,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      description: 'CPU handover between processes',
    },
  ];

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Activity size={18} className="text-cyan-400" />
            Performance Analytics
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Key system metrics for {algorithm} simulation (Total Duration: {totalTime} units)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="btn-ghost flex items-center gap-1.5 text-xs"
            title="Copy summary text to clipboard"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownloadSummary}
            className="btn-ghost flex items-center gap-1.5 text-xs"
            title="Download formatted text report"
          >
            <FileText size={14} />
            Report
          </button>
          <button
            onClick={handleDownloadCSV}
            className="btn-secondary flex items-center gap-1.5 text-xs"
            title="Export full metrics to CSV"
          >
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricCards.map((card, idx) => (
          <div
            key={idx}
            className={`border rounded-xl p-3.5 flex flex-col justify-between ${card.bgColor} ${card.borderColor} transition-all duration-200 hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-text-secondary leading-tight line-clamp-1">
                {card.label}
              </span>
              <card.icon size={15} className={card.color} />
            </div>

            <div>
              <div className={`text-xl font-bold font-mono tracking-tight ${card.color}`}>
                {card.value}
              </div>
              <div className="text-[10px] text-text-muted font-mono mt-0.5 truncate">
                {card.unit}
              </div>
            </div>

            <div className="text-[10px] text-text-muted/80 mt-2 pt-2 border-t border-border/40 leading-tight">
              {card.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

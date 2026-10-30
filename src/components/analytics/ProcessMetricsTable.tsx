import { Table, Info } from 'lucide-react';
import type { SimulationResult } from '../../engine/types';

interface ProcessMetricsTableProps {
  result: SimulationResult;
}

export default function ProcessMetricsTable({ result }: ProcessMetricsTableProps) {
  const { processes, metrics } = result;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-text-primary">Process Execution Metrics</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <Info size={13} />
          <span>TAT = CT - AT | WT = TAT - BT | RT = First Run - AT</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-surface-2 text-text-secondary border-b border-border">
              <th className="py-2.5 px-3 font-semibold">Process</th>
              <th className="py-2.5 px-3 font-semibold text-right">Arrival (AT)</th>
              <th className="py-2.5 px-3 font-semibold text-right">Burst (BT)</th>
              <th className="py-2.5 px-3 font-semibold text-right">Priority</th>
              <th className="py-2.5 px-3 font-semibold text-right">Completion (CT)</th>
              <th className="py-2.5 px-3 font-semibold text-right text-cyan-400">Turnaround (TAT)</th>
              <th className="py-2.5 px-3 font-semibold text-right text-amber-400">Waiting (WT)</th>
              <th className="py-2.5 px-3 font-semibold text-right text-violet-400">Response (RT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {processes.map(p => (
              <tr key={p.pid} className="hover:bg-surface-2/60 transition-colors">
                <td className="py-2 px-3 font-mono">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-semibold text-text-primary">{p.name}</span>
                    <span className="text-[10px] text-text-muted">(PID {p.pid})</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-right font-mono text-text-secondary">
                  {p.arrivalTime}
                </td>
                <td className="py-2 px-3 text-right font-mono text-text-secondary">
                  {p.burstTime}
                </td>
                <td className="py-2 px-3 text-right font-mono text-text-secondary">
                  {p.priority}
                </td>
                <td className="py-2 px-3 text-right font-mono font-medium text-text-primary">
                  {p.completionTime !== null ? p.completionTime : '—'}
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-cyan-400">
                  {p.turnaroundTime !== null ? p.turnaroundTime : '—'}
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-amber-400">
                  {p.waitingTime !== null ? p.waitingTime : '—'}
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-violet-400">
                  {p.responseTime !== null ? p.responseTime : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-surface-2/80 font-bold border-t-2 border-border text-text-primary">
              <td className="py-2.5 px-3 font-semibold">Average</td>
              <td className="py-2.5 px-3 text-right text-text-muted font-mono">—</td>
              <td className="py-2.5 px-3 text-right text-text-muted font-mono">—</td>
              <td className="py-2.5 px-3 text-right text-text-muted font-mono">—</td>
              <td className="py-2.5 px-3 text-right text-text-muted font-mono">—</td>
              <td className="py-2.5 px-3 text-right font-mono text-cyan-400">
                {metrics.averageTurnaroundTime.toFixed(2)}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                {metrics.averageWaitingTime.toFixed(2)}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-violet-400">
                {metrics.averageResponseTime.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

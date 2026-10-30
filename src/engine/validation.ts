// ============================================================
// SCHEDULIX — Input Validation
// ============================================================

import type { Process, ValidationError, AlgorithmConfig } from './types';

export function validateProcess(
  process: Partial<Process>,
  existingPids: number[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (process.arrivalTime === undefined || process.arrivalTime < 0) {
    errors.push({ field: 'arrivalTime', message: 'Arrival time must be ≥ 0' });
  }

  if (
    process.burstTime === undefined ||
    process.burstTime <= 0 ||
    !Number.isFinite(process.burstTime)
  ) {
    errors.push({ field: 'burstTime', message: 'Burst time must be > 0' });
  }

  if (
    process.priority === undefined ||
    !Number.isInteger(process.priority) ||
    process.priority < 0
  ) {
    errors.push({ field: 'priority', message: 'Priority must be a non-negative integer' });
  }

  if (process.pid !== undefined && existingPids.includes(process.pid)) {
    errors.push({ field: 'pid', message: `PID ${process.pid} already exists` });
  }

  if (!process.name || process.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Process name cannot be empty' });
  }

  if (process.name && process.name.length > 20) {
    errors.push({ field: 'name', message: 'Process name must be ≤ 20 characters' });
  }

  return errors;
}

export function validateProcessList(processes: Process[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const pids = new Set<number>();
  const names = new Set<string>();

  for (const p of processes) {
    if (pids.has(p.pid)) {
      errors.push({ field: 'pid', message: `Duplicate PID: ${p.pid}` });
    }
    pids.add(p.pid);

    if (names.has(p.name)) {
      errors.push({ field: 'name', message: `Duplicate process name: ${p.name}` });
    }
    names.add(p.name);

    if (p.arrivalTime < 0) {
      errors.push({ field: 'arrivalTime', message: `P${p.pid}: Arrival time must be ≥ 0` });
    }

    if (p.burstTime <= 0) {
      errors.push({ field: 'burstTime', message: `P${p.pid}: Burst time must be > 0` });
    }

    if (p.priority < 0) {
      errors.push({ field: 'priority', message: `P${p.pid}: Priority must be ≥ 0` });
    }
  }

  return errors;
}

export function validateAlgorithmConfig(config: AlgorithmConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  if (config.type === 'RR') {
    if (
      config.timeQuantum === undefined ||
      config.timeQuantum <= 0 ||
      !Number.isFinite(config.timeQuantum) ||
      !Number.isInteger(config.timeQuantum)
    ) {
      errors.push({
        field: 'timeQuantum',
        message: 'Time quantum must be a positive integer for Round Robin',
      });
    }
  }

  return errors;
}

/** Parse and validate CSV for process import */
export interface CSVParseResult {
  processes: Omit<Process, 'color'>[];
  errors: { row: number; message: string }[];
}

export function parseProcessCSV(csvText: string): CSVParseResult {
  const errors: { row: number; message: string }[] = [];
  const processes: Omit<Process, 'color'>[] = [];

  const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { processes, errors: [{ row: 0, message: 'CSV is empty' }] };
  }

  const header = lines[0].toLowerCase().replace(/\s/g, '');
  const expectedHeaders = ['pid', 'name', 'arrivaltime', 'bursttime', 'priority'];
  const hasHeader = expectedHeaders.some(h => header.includes(h));

  const dataLines = hasHeader ? lines.slice(1) : lines;

  for (let i = 0; i < dataLines.length; i++) {
    const row = i + (hasHeader ? 2 : 1);
    const parts = dataLines[i].split(',').map(p => p.trim());

    if (parts.length < 4) {
      errors.push({ row, message: `Row ${row}: Expected at least 4 columns (pid, name, arrivalTime, burstTime)` });
      continue;
    }

    const pid = parseInt(parts[0], 10);
    const name = parts[1] || `P${pid}`;
    const arrivalTime = parseFloat(parts[2]);
    const burstTime = parseFloat(parts[3]);
    const priority = parts[4] ? parseInt(parts[4], 10) : 0;

    if (isNaN(pid)) {
      errors.push({ row, message: `Row ${row}: Invalid PID "${parts[0]}"` });
      continue;
    }
    if (isNaN(arrivalTime) || arrivalTime < 0) {
      errors.push({ row, message: `Row ${row}: Invalid arrival time "${parts[2]}"` });
      continue;
    }
    if (isNaN(burstTime) || burstTime <= 0) {
      errors.push({ row, message: `Row ${row}: Invalid burst time "${parts[3]}"` });
      continue;
    }
    if (isNaN(priority) || priority < 0) {
      errors.push({ row, message: `Row ${row}: Invalid priority "${parts[4]}"` });
      continue;
    }

    processes.push({ pid, name, arrivalTime, burstTime, priority });
  }

  return { processes, errors };
}

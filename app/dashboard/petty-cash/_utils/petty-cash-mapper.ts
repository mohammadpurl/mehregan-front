import type {
  PettyCashExpenseLine,
  PettyCashExpenseLineInput,
  PettyCashResponse,
  PettyCashSettlementStatus,
} from '../_types/petty-cash.types';

function pick<T>(row: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k] as T;
  }
  return undefined;
}

function normalizeExpenseLine(row: unknown): PettyCashExpenseLine | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const description = String(pick<string>(r, 'description') ?? '').trim();
  const amount = Number(pick<number>(r, 'amount') ?? 0);
  if (!description || !Number.isFinite(amount)) return null;
  return {
    id: pick<number>(r, 'id'),
    description,
    amount,
    date: pick<string>(r, 'date', 'expense_date') ?? null,
  };
}

export function normalizePettyCashFromApi(row: unknown): PettyCashResponse | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const id = Number(pick<number>(r, 'id'));
  if (!Number.isFinite(id)) return null;

  const rawLines = pick<unknown[]>(r, 'expense_lines', 'expenseLines', 'lines') ?? [];
  const expenseLines = Array.isArray(rawLines)
    ? rawLines.map(normalizeExpenseLine).filter(Boolean)
    : [];

  return {
    id,
    amount: Number(pick<number>(r, 'amount') ?? 0),
    reason: String(pick<string>(r, 'reason') ?? ''),
    description: pick<string>(r, 'description') ?? null,
    status: String(pick<string>(r, 'status') ?? 'pending').toLowerCase(),
    settlementStatus: (pick<string>(r, 'settlement_status', 'settlementStatus') ?? null) as PettyCashSettlementStatus | null,
    workflowInstanceId: pick<number>(r, 'workflow_instance_id', 'workflowInstanceId') ?? null,
    requesterId: pick<string>(r, 'requester_id', 'requesterId') != null ? String(pick(r, 'requester_id', 'requesterId')) : null,
    requesterName: pick<string>(r, 'requester_name', 'requesterName') ?? null,
    expenseLines: expenseLines as PettyCashExpenseLine[],
    totalExpenses: pick<number>(r, 'total_expenses', 'totalExpenses'),
    remainingAmount: pick<number>(r, 'remaining_amount', 'remainingAmount'),
    createdAt: pick<string>(r, 'created_at', 'createdAt'),
    updatedAt: pick<string>(r, 'updated_at', 'updatedAt'),
  };
}

export function pettyCashCreateToBody(values: { amount: number; reason: string; description?: string }) {
  return {
    amount: values.amount,
    reason: values.reason.trim(),
    description: values.description?.trim() || undefined,
  };
}

export function expenseLinesToBody(lines: PettyCashExpenseLineInput[]) {
  return {
    lines: lines.map((l) => ({
      description: l.description.trim(),
      amount: l.amount,
      date: l.date?.trim() || undefined,
    })),
  };
}

export function isPettyCashSettled(record: PettyCashResponse): boolean {
  const s = String(record.settlementStatus ?? '').toUpperCase();
  return s === 'SETTLED';
}

export function canSettlePettyCash(record: PettyCashResponse): boolean {
  const status = String(record.status).toLowerCase();
  if (status !== 'approved') return false;
  return !isPettyCashSettled(record);
}

export function sumExpenseLines(lines: PettyCashExpenseLine[]): number {
  return lines.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
}

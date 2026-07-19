import { collectAttachmentItems } from '@/app/utils/attachment-display.utils';
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

  const attachmentItems = collectAttachmentItems({
    documentsUrls: pick<string[]>(r, 'documents_urls', 'documentsUrls'),
    attachments: pick(r, 'attachments') as PettyCashResponse['attachments'],
  });

  return {
    id,
    title: pick<string>(r, 'title') ?? null,
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
    requestedDate: pick<string>(r, 'requested_date', 'requestedDate') ?? null,
    sepidarRegisteredAt: pick<string>(r, 'sepidar_registered_at', 'sepidarRegisteredAt') ?? null,
    sepidarRegisteredBy:
      pick<number>(r, 'sepidar_registered_by', 'sepidarRegisteredBy') != null
        ? Number(pick(r, 'sepidar_registered_by', 'sepidarRegisteredBy'))
        : null,
    sepidarConfirmedAt: pick<string>(r, 'sepidar_confirmed_at', 'sepidarConfirmedAt') ?? null,
    sepidarConfirmedBy:
      pick<number>(r, 'sepidar_confirmed_by', 'sepidarConfirmedBy') != null
        ? Number(pick(r, 'sepidar_confirmed_by', 'sepidarConfirmedBy'))
        : null,
    createdAt: pick<string>(r, 'created_at', 'createdAt'),
    updatedAt: pick<string>(r, 'updated_at', 'updatedAt'),
    documentsUrls: attachmentItems.map((a) => a.fileUrl),
    attachments: attachmentItems.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
    })),
    attachmentCount:
      typeof pick<number>(r, 'attachment_count', 'attachmentCount') === 'number'
        ? pick<number>(r, 'attachment_count', 'attachmentCount')
        : attachmentItems.length,
    expenseLineCount: pick<number>(r, 'expense_line_count', 'expenseLineCount'),
  };
}

export function pettyCashCreateToBody(values: {
  title?: string;
  amount: number;
  reason: string;
  description?: string;
}) {
  return {
    title: values.title?.trim() || undefined,
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
  if (isPettyCashSettled(record)) return false;
  const settlement = String(record.settlementStatus ?? '').toUpperCase();
  // فقط وقتی منتظر ثبت خرج است؛ در حال تأیید خرج قابل ویرایش نیست
  return settlement === 'PENDING_SETTLEMENT' || settlement === '';
}

export function sumExpenseLines(lines: PettyCashExpenseLine[]): number {
  return lines.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
}

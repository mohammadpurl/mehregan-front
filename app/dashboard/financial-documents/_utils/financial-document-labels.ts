import type { FinancialDocumentStatus, FinancialDocumentType } from '../_types/financial-document.types';

const TYPE_LABELS: Record<FinancialDocumentType, string> = {
  check: 'چک',
  other: 'سایر',
};

const STATUS_LABELS: Record<FinancialDocumentStatus, string> = {
  pending: 'در انتظار تأیید',
  approved: 'تأیید شده',
  rejected: 'رد شده',
};

export function financialDocumentTypeLabel(t: string): string {
  return TYPE_LABELS[t as FinancialDocumentType] ?? t;
}

export function financialDocumentStatusLabel(s: string): string {
  return STATUS_LABELS[s as FinancialDocumentStatus] ?? s;
}

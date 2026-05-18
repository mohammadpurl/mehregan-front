export const PETTY_CASH_STATUS_LABEL: Record<string, string> = {
  pending: 'در انتظار تأیید',
  approved: 'تأیید شده',
  rejected: 'رد شده',
};

export const PETTY_CASH_SETTLEMENT_LABEL: Record<string, string> = {
  pending_settlement: 'منتظر ثبت خرج',
  PENDING_SETTLEMENT: 'منتظر ثبت خرج',
  settled: 'تسویه شده',
  SETTLED: 'تسویه شده',
};

export function pettyCashStatusLabel(status: string): string {
  return PETTY_CASH_STATUS_LABEL[status.toLowerCase()] ?? status;
}

export function pettyCashSettlementLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return PETTY_CASH_SETTLEMENT_LABEL[status] ?? PETTY_CASH_SETTLEMENT_LABEL[status.toUpperCase()] ?? status;
}

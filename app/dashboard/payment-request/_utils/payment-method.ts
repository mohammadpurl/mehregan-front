export const PaymentMethod = {
  CHECK: 'check',
  TRANSFER: 'transfer',
  CASH: 'cash',
} as const;

export type PaymentMethodValue = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.CHECK]: 'چک',
  [PaymentMethod.TRANSFER]: 'حواله',
  [PaymentMethod.CASH]: 'نقدی',
};

export function paymentMethodLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const key = value.toLowerCase();
  return PAYMENT_METHOD_LABELS[key] ?? value;
}

export function paymentLocationLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const key = value.toLowerCase();
  if (key === 'bank') return 'بانک';
  if (key === 'petty_cash' || key === 'petty-cash') return 'تنخواه';
  return value;
}

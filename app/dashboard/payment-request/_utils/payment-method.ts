export const PaymentMethod = {
  CHECK: 'check',
  TRANSFER: 'transfer',
} as const;

export type PaymentMethodValue = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  [PaymentMethod.CHECK]: 'چک',
  [PaymentMethod.TRANSFER]: 'حواله',
};

export function paymentMethodLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const key = value.toLowerCase() as PaymentMethodValue;
  return PAYMENT_METHOD_LABELS[key] ?? value;
}

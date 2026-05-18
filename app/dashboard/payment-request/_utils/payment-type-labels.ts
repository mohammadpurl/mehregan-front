import { PaymentRequestType } from '../_types/payment-request.types';

/** برچسب فارسی نوع درخواست مالی — هم‌راستا با بک‌اند */
export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  [PaymentRequestType.LOAN]: 'وام',
  [PaymentRequestType.ADVANCE]: 'مساعده',
  [PaymentRequestType.PAYMENT_ORDER]: 'دستور پرداخت',
  [PaymentRequestType.CASH]: 'تنخواه',
  [PaymentRequestType.PAYMENT]: 'پرداخت',
  [PaymentRequestType.OTHER]: 'سایر',
  payment_order: 'دستور پرداخت',
};

export function paymentTypeLabel(type: string): string {
  return PAYMENT_TYPE_LABELS[type] ?? PAYMENT_TYPE_LABELS[type.toLowerCase()] ?? type;
}

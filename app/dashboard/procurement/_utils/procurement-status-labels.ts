export const purchaseRequestStatusLabels: Record<string, string> = {
  pending: 'در انتظار تأیید',
  awaiting_proforma: 'منتظر پیش‌فاکتور',
  proforma_review: 'بررسی پیش‌فاکتور',
  ready_for_payment: 'آماده پرداخت',
  awaiting_invoice: 'منتظر فاکتور / پرداخت',
  payment_pending: 'در انتظار تأیید پرداخت',
  receiving: 'در حال دریافت انبار',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  completed: 'تکمیل',
};

export const purchaseRequestStatusClass: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  awaiting_proforma: 'bg-orange-100 text-orange-800',
  proforma_review: 'bg-purple-100 text-purple-800',
  ready_for_payment: 'bg-blue-100 text-blue-800',
  awaiting_invoice: 'bg-sky-100 text-sky-800',
  payment_pending: 'bg-cyan-100 text-cyan-800',
  receiving: 'bg-indigo-100 text-indigo-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-muted text-muted-foreground',
};

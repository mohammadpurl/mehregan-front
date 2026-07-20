/**
 * نگاشت کد نوع درخواست (refType) به عنوان فارسی برای گزارش‌ها و فیلترها.
 */
export const REQUEST_REF_TYPE_LABELS: Record<string, string> = {
  payment_request: 'درخواست مالی (وام/مساعده)',
  payment_order: 'دستور پرداخت',
  petty_cash: 'تنخواه',
  petty_cash_settlement: 'تأیید خرج تنخواه',
  financial_document: 'سند مالی',
  purchase_request: 'درخواست خرید',
  request: 'درخواست خرید',
  procurement_proforma: 'پیش‌فاکتور خرید',
  mission_request: 'درخواست ماموریت',
  mission_report: 'تأیید گزارش ماموریت',
  warehouse_form: 'فرم انبار',
  workflow_form: 'درخواست اداری',
  ad_hoc_task: 'کار ارجاعی / پیش‌بینی‌نشده',
  workflow: 'گردش تأیید',
};

/** ترتیب نمایش در فیلتر گزارش درخواست‌ها */
export const REQUEST_REPORT_REF_TYPE_OPTIONS = [
  'payment_request',
  'payment_order',
  'petty_cash',
  'financial_document',
  'purchase_request',
  'mission_request',
  'warehouse_form',
  'workflow_form',
  'ad_hoc_task',
] as const;

export function getRequestRefTypeLabel(refType: string | null | undefined): string {
  const key = String(refType ?? '').trim();
  if (!key) return '—';
  return REQUEST_REF_TYPE_LABELS[key] ?? key;
}

export function toRequestRefTypeOption(value: string): { value: string; label: string } {
  return { value, label: getRequestRefTypeLabel(value) };
}

/** برچسب فارسی وضعیت نمونه گردش‌کار (پیگیری / کارتابل) */

export const WORKFLOW_INSTANCE_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار',
  in_progress: 'در حال تأیید',
  active: 'در حال تأیید',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  returned: 'برگشت به درخواست‌کننده',
  cancelled: 'لغو شده',
  canceled: 'لغو شده',
  completed: 'تکمیل‌شده',
};

export function workflowInstanceStatusLabel(status?: string | null): string {
  const key = String(status ?? '').trim().toLowerCase();
  if (!key) return '—';
  return WORKFLOW_INSTANCE_STATUS_LABELS[key] ?? status ?? '—';
}

/** گزینه‌های فیلتر وضعیت — value همان کد انگلیسی API است */
export const WORKFLOW_INSTANCE_STATUS_FILTER_OPTIONS = [
  { value: 'pending', label: 'در انتظار' },
  { value: 'in_progress', label: 'در حال تأیید' },
  { value: 'approved', label: 'تأیید شده' },
  { value: 'rejected', label: 'رد شده' },
  { value: 'returned', label: 'برگشت به درخواست‌کننده' },
] as const;

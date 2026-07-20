/** برچسب فارسی وضعیت نمونه گردش‌کار (پیگیری / کارتابل) */

export const WORKFLOW_INSTANCE_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار',
  in_progress: 'در حال تأیید',
  active: 'در حال تأیید',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  returned: 'برگشت به درخواست‌کننده',
  cancelled: 'لغو شده',
  completed: 'تکمیل شده',
};

export function getWorkflowInstanceStatusLabel(status: string | null | undefined): string {
  const key = String(status ?? '').trim().toLowerCase();
  if (!key) return '—';
  return WORKFLOW_INSTANCE_STATUS_LABELS[key] ?? status ?? '—';
}

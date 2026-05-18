/** پیام تأیید پیش‌فرض قبل از حذف */
export const DELETE_CONFIRM_MESSAGE = 'آیا از حذف اطلاعات انتخاب شده مطمئن هستید؟';

/** fallback وقتی Provider در دسترس نیست */
export function confirmDeleteFallback(): boolean {
  if (typeof window === 'undefined') return false;
  return window.confirm(DELETE_CONFIRM_MESSAGE);
}

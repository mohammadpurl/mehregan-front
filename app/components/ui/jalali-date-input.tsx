'use client';

import { formatJalaliDate } from '@/app/utils/jalali-date';
import { JalaliDatePicker, type JalaliDatePickerProps } from '@/app/components/ui/jalali-date-picker';

export type JalaliDateInputProps = JalaliDatePickerProps;

/**
 * @deprecated نام جدید: JalaliDatePicker — همان انتخابگر تقویم شمسی.
 * ورودی تاریخ شمسی — مقدار فرم همیشه ISO میلادی (YYYY-MM-DD) برای API.
 */
export function JalaliDateInput(props: JalaliDateInputProps) {
  return <JalaliDatePicker {...props} />;
}

/** نمایش فقط‌خواندنی تاریخ شمسی */
export function JalaliDateText({
  value,
  className,
  fallback = '—',
}: {
  value?: string | Date | null;
  className?: string;
  fallback?: string;
}) {
  return <span className={className}>{formatJalaliDate(value, { fallback })}</span>;
}

export { JalaliDatePicker } from '@/app/components/ui/jalali-date-picker';

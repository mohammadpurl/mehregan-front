'use client';

import { useMemo } from 'react';
import DatePicker from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { gregorianIsoToJsDate, jsDateToGregorianIso } from '@/app/utils/jalali-date';
import { cn } from '@/lib/utils';
import './jalali-date-picker.css';

const INPUT_CLASS =
  'flex h-9 min-h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm leading-snug ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';

export type JalaliDatePickerProps = {
  /** مقدار میلادی ISO (YYYY-MM-DD) برای API */
  value?: string;
  onChange: (gregorianIso: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  minDate?: string;
  maxDate?: string;
};

/**
 * انتخابگر تاریخ شمسی — تقویم کلیکی + ورود دستی.
 * مقدار خروجی همیشا ISO میلادی (YYYY-MM-DD) است.
 */
export function JalaliDatePicker({
  value = '',
  onChange,
  onBlur,
  disabled,
  placeholder = '۱۴۰۴/۰۱/۰۱',
  className,
  id,
  name,
  minDate,
  maxDate,
}: JalaliDatePickerProps) {
  const pickerValue = useMemo(() => {
    const d = gregorianIsoToJsDate(value);
    return d ? new DateObject(d) : undefined;
  }, [value]);

  const min = useMemo(() => {
    const d = gregorianIsoToJsDate(minDate);
    return d ? new DateObject(d) : undefined;
  }, [minDate]);

  const max = useMemo(() => {
    const d = gregorianIsoToJsDate(maxDate);
    return d ? new DateObject(d) : undefined;
  }, [maxDate]);

  return (
    <DatePicker
      id={id}
      name={name}
      value={pickerValue}
      onChange={(date) => {
        if (!date || Array.isArray(date)) {
          onChange('');
          return;
        }
        onChange(jsDateToGregorianIso((date as DateObject).toDate()));
      }}
      onClose={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      calendar={persian}
      locale={persian_fa}
      format="YYYY/MM/DD"
      editable
      arrow
      minDate={min}
      maxDate={max}
      calendarPosition="bottom-center"
      className={cn('jalali-date-picker-root rmdp-rtl w-full', className)}
      containerClassName="w-full"
      inputClass={INPUT_CLASS}
      mapDays={({ date }) => {
        if (date.weekDay.index === 6) {
          return { className: 'text-destructive/80' };
        }
        return {};
      }}
    />
  );
}

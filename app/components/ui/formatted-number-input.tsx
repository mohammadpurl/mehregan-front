'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/app/components/ui/input';
import {
  formatNumber,
  parseFormattedNumber,
  sanitizeNumberInput,
  toEditingNumberString,
} from '@/app/utils/number-format';
import { cn } from '@/lib/utils';

type Props = {
  value?: number;
  onChange?: (value: number) => void;
  /** alias سازگار با برخی فرم‌ها — ترجیحاً از onChange استفاده کنید */
  onValueChange?: (value: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  /** حداکثر رقم اعشار — برای مبلغ معمولاً ۰ */
  maximumFractionDigits?: number;
  min?: number;
  max?: number;
};

/**
 * ورودی عددی با جداکننده سه‌رقمی — مقدار فرم عدد خام (برای API) می‌ماند.
 */
export function FormattedNumberInput({
  value = 0,
  onChange,
  onValueChange,
  onBlur,
  disabled,
  placeholder = '۰',
  className,
  id,
  name,
  maximumFractionDigits = 0,
  min,
  max,
}: Props) {
  const emitChange = onChange ?? onValueChange;
  const [display, setDisplay] = useState(() =>
    value ? formatNumber(value, { maximumFractionDigits }) : '',
  );
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDisplay(value ? formatNumber(value, { maximumFractionDigits }) : '');
    }
  }, [value, focused, maximumFractionDigits]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      emitChange?.(0);
      setDisplay('');
      return;
    }
    let n = parseFormattedNumber(trimmed);
    if (n == null) {
      setDisplay(value ? formatNumber(value, { maximumFractionDigits }) : '');
      return;
    }
    if (min != null && n < min) n = min;
    if (max != null && n > max) n = max;
    emitChange?.(n);
    setDisplay(formatNumber(n, { maximumFractionDigits }));
  };

  return (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      dir="ltr"
      disabled={disabled}
      placeholder={placeholder}
      className={cn('text-left font-mono tabular-nums tracking-wide', className)}
      value={display}
      onFocus={() => {
        setFocused(true);
        setDisplay(toEditingNumberString(value));
      }}
      onChange={(e) => {
        const cleaned = sanitizeNumberInput(e.target.value);
        setDisplay(cleaned);
        if (!cleaned) {
          emitChange?.(0);
          return;
        }
        const n = parseFormattedNumber(cleaned);
        if (n != null) emitChange?.(n);
      }}
      onBlur={() => {
        commit(display);
        setFocused(false);
        onBlur?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

/** نمایش عدد / مبلغ در جدول یا متن */
export function FormattedNumberText({
  value,
  unit,
  className,
  fallback = '—',
  maximumFractionDigits = 0,
}: {
  value?: number | string | null;
  unit?: string;
  className?: string;
  fallback?: string;
  maximumFractionDigits?: number;
}) {
  const text = unit
    ? `${formatNumber(value, { fallback, maximumFractionDigits })} ${unit}`.trim()
    : formatNumber(value, { fallback, maximumFractionDigits });
  return <span className={cn('tabular-nums', className)}>{text}</span>;
}

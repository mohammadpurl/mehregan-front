import { toLatinDigits } from '@/app/utils/jalali-date';

const GROUP_SEPARATORS = /[,\s٬،]/g;

export type FormatNumberOptions = {
  /** ارقام فارسی (پیش‌فرض: true) */
  persianDigits?: boolean;
  /** حداکثر رقم اعشار */
  maximumFractionDigits?: number;
  /** حداقل رقم اعشار */
  minimumFractionDigits?: number;
  /** متن جایگزین برای مقدار خالی/نامعتبر */
  fallback?: string;
};

const defaultNumberOptions: Required<Pick<FormatNumberOptions, 'persianDigits' | 'maximumFractionDigits' | 'minimumFractionDigits'>> =
  {
    persianDigits: true,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  };

/** حذف جداکننده‌ها و تبدیل ارقام → عدد */
export function parseFormattedNumber(input: string | null | undefined): number | null {
  if (input == null) return null;
  let s = toLatinDigits(String(input).trim()).replace(GROUP_SEPARATORS, '');
  if (!s) return null;

  const faMinus = s.includes('−');
  s = s.replace(/[^\d.-]/g, '');
  if (!s || s === '-' || s === '.') return null;

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return faMinus && n > 0 ? -n : n;
}

/**
 * نمایش عدد با جداکننده سه‌رقمی (پیش‌فرض fa-IR).
 * برای مبالغ مالی، تعداد بدون اعشار و اسناد حسابداری.
 */
export function formatNumber(
  value: number | string | null | undefined,
  options?: FormatNumberOptions,
): string {
  const fallback = options?.fallback ?? '—';
  if (value == null || value === '') return fallback;

  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^-?\d/.test(toLatinDigits(value).replace(GROUP_SEPARATORS, ''))
        ? parseFormattedNumber(value)
        : parseFormattedNumber(String(value));

  if (n == null || !Number.isFinite(n)) return fallback;

  const persianDigits = options?.persianDigits ?? defaultNumberOptions.persianDigits;
  const maximumFractionDigits = options?.maximumFractionDigits ?? defaultNumberOptions.maximumFractionDigits;
  const minimumFractionDigits = options?.minimumFractionDigits ?? defaultNumberOptions.minimumFractionDigits;

  const formatted = new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(n);

  if (!persianDigits) {
    return toLatinDigits(formatted);
  }
  return formatted;
}

/** مبلغ با واحد (پیش‌فرض: ریال) */
export function formatAmount(
  value: number | string | null | undefined,
  options?: FormatNumberOptions & { unit?: string },
): string {
  const num = formatNumber(value, options);
  if (num === (options?.fallback ?? '—')) return num;
  const unit = options?.unit?.trim();
  return unit ? `${num} ${unit}` : num;
}

/** برای مقداردهی اولیه فیلد ورودی هنگام فوکوس */
export function toEditingNumberString(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) return '';
  return String(value);
}

/** نرمال‌سازی رشته ورودی کاربر به ارقام لاتین (بدون جداکننده) */
export function sanitizeNumberInput(raw: string): string {
  return toLatinDigits(raw).replace(GROUP_SEPARATORS, '').replace(/[^\d.-]/g, '');
}

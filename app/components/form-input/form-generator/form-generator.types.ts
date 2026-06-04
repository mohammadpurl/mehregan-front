export type GridSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type FormField = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'amount' | 'email' | 'password' | 'select' | 'textarea' | 'date' | 'checkbox' | 'switch' | 'file' | 'custom';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** برای select — نمایش حالت بارگذاری */
  loading?: boolean;
  options?: { label: string; value: any }[]; // برای select

  /** شماره ردیف (از ۰). فیلدهای یک row با هم در یک ردیف قرار می‌گیرند. */
  row?: number;
  /** عرض در شبکهٔ ۱۲تایی (پیش‌فرض md/lg). اولویت با lgColSpan / mdColSpan است. */
  colSpan?: GridSpan;
  mdColSpan?: GridSpan;
  lgColSpan?: GridSpan;
  className?: string;
  inputClassName?: string;

  /** سازگاری با اسکیمای قدیمی — همان نقش colSpan / mdColSpan / lgColSpan */
  span?: GridSpan;
  mdSpan?: GridSpan;
  lgSpan?: GridSpan;
};

export type FormSchema = {
  fields: FormField[];
  sections?: Array<{
    title: string;
    fields: string[];
  }>;
  /**
   * چیدمان ردیف‌ها:
   * - اگر برای `rowIndex` مقدار ندهید: شبکهٔ **۱۲ ستونی** (با `colSpan` / `lgSpan` و غیره).
   * - اگر `rowGridColumns[rowIndex] = N` بگذارید: از md به بالا **N ستون مساوی**؛ هر فیلد یک سلول
   *   (برای «هر تعداد فیلد در یک سطر با عرض یکسان» مثل ۳، ۵، ۷ تایی).
   * روی موبایل همیشه یک ستون (زیر هم).
   */
  rowGridColumns?: Partial<Record<number, GridSpan>>;
};
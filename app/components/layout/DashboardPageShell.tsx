import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type ShellVariant = 'default' | 'form' | 'narrow';

const variantClass: Record<ShellVariant, string> = {
  /** فقط پهنای کامل — پدینگ افقی از layout داشبورد می‌آید */
  default: '',
  /** فرم‌های چندفیلدی: حداکثر عرض روی دسکتاپ، تمام‌عرض روی موبایل */
  form: 'mx-auto w-full max-w-4xl',
  /** صفحات کوتاه (مثلاً پیام راهنما) */
  narrow: 'mx-auto w-full max-w-lg',
};

type DashboardPageShellProps = {
  children: ReactNode;
  /** کلاس اضافه روی ریشه (مثلاً فاصله عمودی بیشتر) */
  className?: string;
  variant?: ShellVariant;
};

/**
 * پوستهٔ مشترک صفحات داشبورد — mobile-first:
 * پهنا محدود به viewport، بدون overflow افقی ناخواسته، فاصلهٔ عمودی مناسب touch.
 */
export function DashboardPageShell({
  children,
  className,
  variant = 'default',
}: DashboardPageShellProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0 max-w-full space-y-4 sm:space-y-6',
        variantClass[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}

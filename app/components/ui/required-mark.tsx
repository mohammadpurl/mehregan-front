import { cn } from '@/lib/utils';

/** ستارهٔ قرمز کنار برچسب فیلدهای اجباری */
export function RequiredMark({ className }: { className?: string }) {
  return (
    <span className={cn('ms-0.5 font-semibold text-destructive', className)} aria-hidden="true">
      *
    </span>
  );
}

/** راهنمای کوتاه زیر عنوان بخش فرم */
export function RequiredFieldsHint({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      فیلدهای دارای <RequiredMark className="inline" /> الزامی هستند.
    </p>
  );
}

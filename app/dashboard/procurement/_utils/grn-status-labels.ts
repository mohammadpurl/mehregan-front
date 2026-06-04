import type { GrnStatus } from '@/app/_types/grn.types';

export const grnStatusLabels: Record<GrnStatus, string> = {
  draft: 'پیش‌نویس',
  posted: 'ثبت‌شده (ورود به انبار)',
  cancelled: 'لغو',
};

export const grnStatusClass: Record<GrnStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  posted: 'bg-green-100 text-green-800',
  cancelled: 'bg-muted text-muted-foreground',
};

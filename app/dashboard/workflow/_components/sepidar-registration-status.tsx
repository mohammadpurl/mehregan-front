'use client';

import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { formatJalaliDate } from '@/app/utils/jalali-date';

type Props = {
  registeredAt?: string | null;
  confirmedAt?: string | null;
};

/** وضعیت ثبت/تأیید سپیدار روی جزئیات درخواست مالی */
export function SepidarRegistrationStatus({ registeredAt, confirmedAt }: Props) {
  if (!registeredAt && !confirmedAt) return null;

  return (
    <Alert className="border-teal-200/80 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/30">
      <AlertTitle className="text-sm">وضعیت سپیدار</AlertTitle>
      <AlertDescription className="space-y-1 text-sm">
        {registeredAt ? (
          <p>ثبت توسط کارشناس مالی: {formatJalaliDate(registeredAt, { withTime: true })}</p>
        ) : (
          <p className="text-muted-foreground">هنوز توسط کارشناس مالی ثبت نشده است.</p>
        )}
        {confirmedAt ? (
          <p>تأیید سرپرست مالی: {formatJalaliDate(confirmedAt, { withTime: true })}</p>
        ) : registeredAt ? (
          <p className="text-muted-foreground">در انتظار تأیید سرپرست مالی.</p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import type { PettyCashResponse } from '@/app/dashboard/petty-cash/_types/petty-cash.types';
import { pettyCashSettlementLabel, pettyCashStatusLabel } from '@/app/dashboard/petty-cash/_utils/petty-cash-labels';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';

type Props = {
  record: PettyCashResponse;
};

export function WorkflowPettyCashReview({ record }: Props) {
  return (
    <div className="space-y-4">
      <Alert className="border-primary/30 bg-primary/5">
        <AlertTitle>درخواست تنخواه</AlertTitle>
        <AlertDescription className="space-y-1 text-sm">
          <p>درخواست‌کننده: {record.requesterName || '—'}</p>
          <p>مبلغ: {formatAmount(record.amount, { unit: 'ریال' })}</p>
          <p>شرح: {record.reason}</p>
          {record.description && <p>توضیحات: {record.description}</p>}
        </AlertDescription>
      </Alert>

      <div className="grid gap-2 rounded-lg border bg-muted/20 p-3 text-sm md:grid-cols-2">
        <p>
          <span className="text-muted-foreground">وضعیت: </span>
          {pettyCashStatusLabel(record.status)}
        </p>
        <p>
          <span className="text-muted-foreground">تسویه: </span>
          {pettyCashSettlementLabel(record.settlementStatus)}
        </p>
        <p>
          <span className="text-muted-foreground">تاریخ: </span>
          {record.createdAt ? formatJalaliDate(record.createdAt) : '—'}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        پس از تأیید مدیر مالی و مدیرعامل، درخواست‌کننده می‌تواند اقلام هزینه را در صفحه تنخواه ثبت کند.
      </p>
    </div>
  );
}


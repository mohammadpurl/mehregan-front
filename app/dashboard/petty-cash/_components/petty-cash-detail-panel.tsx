'use client';

import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import type { PettyCashResponse } from '../_types/petty-cash.types';
import { pettyCashSettlementLabel, pettyCashStatusLabel } from '../_utils/petty-cash-labels';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { PettyCashExpenseSettlement } from './petty-cash-expense-settlement';
import { isPettyCashSettled } from '../_utils/petty-cash-mapper';

type Props = {
  record: PettyCashResponse;
  onUpdated: (record: PettyCashResponse) => void;
};

export function PettyCashDetailPanel({ record, onUpdated }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-lg border bg-muted/20 p-3 text-sm md:grid-cols-2">
        <p>
          <span className="text-muted-foreground">مبلغ: </span>
          {formatAmount(record.amount, { unit: 'ریال' })}
        </p>
        <p>
          <span className="text-muted-foreground">وضعیت: </span>
          {pettyCashStatusLabel(record.status)}
        </p>
        <p>
          <span className="text-muted-foreground">تسویه: </span>
          {pettyCashSettlementLabel(record.settlementStatus)}
        </p>
        <p>
          <span className="text-muted-foreground">تاریخ ثبت: </span>
          {record.createdAt ? formatJalaliDate(record.createdAt) : '—'}
        </p>
        <p className="md:col-span-2">
          <span className="text-muted-foreground">شرح: </span>
          {record.reason}
        </p>
        {record.description && (
          <p className="md:col-span-2">
            <span className="text-muted-foreground">توضیحات: </span>
            {record.description}
          </p>
        )}
      </div>

      {isPettyCashSettled(record) && (
        <Alert className="border-green-200 bg-green-50/50">
          <AlertTitle>تسویه تکمیل شد</AlertTitle>
          <AlertDescription className="text-sm">اقلام هزینه ثبت و تنخواه بسته شده است.</AlertDescription>
        </Alert>
      )}

      <PettyCashExpenseSettlement record={record} onUpdated={onUpdated} />
    </div>
  );
}

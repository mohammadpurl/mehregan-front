'use client';

import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Button } from '@/app/components/ui/button';
import { RequestAttachmentsPanel } from '@/app/components/attachments/request-attachments-panel';
import type { PettyCashResponse } from '../_types/petty-cash.types';
import { pettyCashSettlementLabel, pettyCashStatusLabel } from '../_utils/petty-cash-labels';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { sumExpenseLines, isPettyCashSettled } from '../_utils/petty-cash-mapper';
import { PettyCashExpenseLinesTable } from './petty-cash-expense-lines-table';

type Props = {
  record: PettyCashResponse;
};

export function PettyCashLedgerDetail({ record }: Props) {
  const expenseTotal = record.totalExpenses ?? sumExpenseLines(record.expenseLines ?? []);
  const remaining = Math.max(0, record.amount - expenseTotal);

  return (
    <div className="space-y-5">
      <div className="grid gap-2 rounded-lg border bg-muted/20 p-4 text-sm md:grid-cols-2">
        <p>
          <span className="text-muted-foreground">شناسه: </span>
          {record.id}
        </p>
        <p>
          <span className="text-muted-foreground">درخواست‌کننده: </span>
          {record.requesterName || '—'}
        </p>
        <p>
          <span className="text-muted-foreground">مبلغ تنخواه: </span>
          {formatAmount(record.amount, { unit: 'ریال' })}
        </p>
        <p>
          <span className="text-muted-foreground">جمع خرج: </span>
          {formatAmount(expenseTotal, { unit: 'ریال' })}
        </p>
        <p>
          <span className="text-muted-foreground">باقی‌مانده: </span>
          {formatAmount(remaining, { unit: 'ریال' })}
        </p>
        <p>
          <span className="text-muted-foreground">وضعیت تأیید: </span>
          {pettyCashStatusLabel(record.status)}
        </p>
        <p>
          <span className="text-muted-foreground">وضعیت تسویه: </span>
          {pettyCashSettlementLabel(record.settlementStatus)}
        </p>
        <p>
          <span className="text-muted-foreground">تاریخ ثبت: </span>
          {record.createdAt ? formatJalaliDate(record.createdAt, { withTime: true }) : '—'}
        </p>
        <p className="md:col-span-2">
          <span className="text-muted-foreground">شرح درخواست: </span>
          {record.reason || '—'}
        </p>
      </div>

      {isPettyCashSettled(record) && (
        <Alert className="border-green-200 bg-green-50/50">
          <AlertTitle>تسویه انجام شده</AlertTitle>
          <AlertDescription className="text-sm">اقلام خرج ثبت و تنخواه بسته شده است.</AlertDescription>
        </Alert>
      )}

      <section className="space-y-2">
        <h4 className="text-sm font-semibold">جزئیات اقلام خرج</h4>
        <PettyCashExpenseLinesTable lines={record.expenseLines ?? []} />
      </section>

      <RequestAttachmentsPanel
        documentsUrls={record.documentsUrls}
        attachments={record.attachments}
      />

      {record.workflowInstanceId ? (
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={`/dashboard/workflow/inbox?instanceId=${record.workflowInstanceId}`}>
            مشاهده در کارتابل گردش‌کار
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

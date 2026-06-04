'use client';

import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import type { PettyCashResponse } from '@/app/dashboard/petty-cash/_types/petty-cash.types';
import { pettyCashSettlementLabel, pettyCashStatusLabel } from '@/app/dashboard/petty-cash/_utils/petty-cash-labels';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { RequestAttachmentsPanel } from '@/app/components/attachments/request-attachments-panel';
import { Form } from '@/app/components/ui/form';
import { WorkflowFinancialApproverFields } from '@/app/dashboard/workflow/inbox/_components/workflow-financial-approver-fields';
import { FinancialApproverAmountDateSchema } from '@/app/dashboard/payment-request/_types/payment-request.schema';
import type { WorkflowApprovePayload } from '@/app/_actions/workflow-runtime-actions';

export type WorkflowPettyCashReviewHandle = {
  buildApprovePayload: () => { ok: true; payload: WorkflowApprovePayload } | { ok: false; error: string };
};

type Props = {
  record: PettyCashResponse;
};

function defaultPaymentDate(record: PettyCashResponse): string {
  if (record.requestedDate?.trim()) return record.requestedDate.trim();
  if (record.createdAt?.trim()) return record.createdAt.slice(0, 10);
  return '';
}

export const WorkflowPettyCashReview = forwardRef<WorkflowPettyCashReviewHandle, Props>(
  function WorkflowPettyCashReview({ record }, ref) {
    const defaults = useMemo(
      () => ({
        amount: record.amount,
        paymentDate: defaultPaymentDate(record),
      }),
      [record],
    );
    const form = useForm({ defaultValues: defaults });

    useImperativeHandle(ref, () => ({
      buildApprovePayload: () => {
        const values = form.getValues();
        const parsed = FinancialApproverAmountDateSchema.safeParse(values);
        if (!parsed.success) {
          return {
            ok: false as const,
            error: parsed.error.issues[0]?.message ?? 'مبلغ و تاریخ پرداخت را تکمیل کنید',
          };
        }
        return {
          ok: true as const,
          payload: {
            amount: parsed.data.amount,
            payment_date: parsed.data.paymentDate,
          },
        };
      },
    }));

    return (
      <div className="space-y-4">
        <Alert className="border-primary/30 bg-primary/5">
          <AlertTitle>درخواست تنخواه</AlertTitle>
          <AlertDescription className="space-y-1 text-sm">
            <p>درخواست‌کننده: {record.requesterName || '—'}</p>
            <p>مبلغ درخواستی: {formatAmount(record.amount, { unit: 'ریال' })}</p>
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
            <span className="text-muted-foreground">تاریخ ثبت: </span>
            {record.createdAt ? formatJalaliDate(record.createdAt) : '—'}
          </p>
        </div>

        <RequestAttachmentsPanel
          documentsUrls={record.documentsUrls}
          attachments={record.attachments}
        />

        <Form {...form}>
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium">تأیید تنخواه</p>
            <p className="text-xs text-muted-foreground">
              مبلغ و تاریخ پرداخت را در صورت نیاز اصلاح کنید.
            </p>
            <WorkflowFinancialApproverFields control={form.control} />
          </div>
        </Form>
      </div>
    );
  },
);

'use client';

import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import type { FinancialDocumentResponse } from '@/app/dashboard/financial-documents/_types/financial-document.types';
import {
  financialDocumentStatusLabel,
  financialDocumentTypeLabel,
} from '@/app/dashboard/financial-documents/_utils/financial-document-labels';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { RequestAttachmentsPanel } from '@/app/components/attachments/request-attachments-panel';
import { Form } from '@/app/components/ui/form';
import { RequiredFieldsHint } from '@/app/components/ui/required-mark';
import { WorkflowFinancialApproverFields } from '@/app/dashboard/workflow/inbox/_components/workflow-financial-approver-fields';
import { FinancialApproverAmountDateSchema } from '@/app/dashboard/payment-request/_types/payment-request.schema';
import type { WorkflowApprovePayload } from '@/app/_actions/workflow-runtime-actions';
import { SepidarRegistrationStatus } from '@/app/dashboard/workflow/_components/sepidar-registration-status';

export type WorkflowFinancialDocumentReviewHandle = {
  buildApprovePayload: () => { ok: true; payload: WorkflowApprovePayload } | { ok: false; error: string };
};

type Props = {
  record: FinancialDocumentResponse;
};

function defaultPaymentDate(record: FinancialDocumentResponse): string {
  if (record.documentDate?.trim()) return record.documentDate.trim();
  if (record.createdAt?.trim()) return record.createdAt.slice(0, 10);
  return '';
}

export const WorkflowFinancialDocumentReview = forwardRef<
  WorkflowFinancialDocumentReviewHandle,
  Props
>(function WorkflowFinancialDocumentReview({ record }, ref) {
  const defaults = useMemo(
    () => ({
      amount: record.amount != null && record.amount > 0 ? record.amount : 0,
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
        <AlertTitle>سند مالی — {financialDocumentTypeLabel(record.documentType)}</AlertTitle>
        <AlertDescription className="space-y-1 text-sm">
          <p>ثبت‌کننده (واحد مالی): {record.requesterName || '—'}</p>
          {record.title && <p>عنوان: {record.title}</p>}
          <p>شرح: {record.description || '—'}</p>
          {record.amount != null && record.amount > 0 && (
            <p>مبلغ ثبت‌شده: {formatAmount(record.amount, { unit: 'ریال' })}</p>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid gap-2 rounded-lg border bg-muted/20 p-3 text-sm md:grid-cols-2">
        <p>
          <span className="text-muted-foreground">وضعیت: </span>
          {financialDocumentStatusLabel(record.status)}
        </p>
        <p>
          <span className="text-muted-foreground">تاریخ: </span>
          {record.createdAt ? formatJalaliDate(record.createdAt) : '—'}
        </p>
        {record.checkNumber && (
          <p>
            <span className="text-muted-foreground">شماره چک: </span>
            {record.checkNumber}
          </p>
        )}
        {record.partyName && (
          <p>
            <span className="text-muted-foreground">طرف سند: </span>
            {record.partyName}
          </p>
        )}
      </div>

      <SepidarRegistrationStatus
        registeredAt={record.sepidarRegisteredAt}
        confirmedAt={record.sepidarConfirmedAt}
      />

      <RequestAttachmentsPanel
        documentsUrls={record.documentsUrls}
        attachments={record.attachments}
      />

      <Form {...form}>
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium">تأیید سند مالی</p>
          <RequiredFieldsHint />
          <p className="text-xs text-muted-foreground">
            مبلغ و تاریخ پرداخت/سررسید را در صورت نیاز اصلاح کنید.
          </p>
          <WorkflowFinancialApproverFields
            control={form.control}
            dateLabel="تاریخ سند / پرداخت"
          />
        </div>
      </Form>
    </div>
  );
});

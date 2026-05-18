'use client';

import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import type { PaymentRequestResponse } from '@/app/dashboard/payment-request/_types/payment-request.types';
import { PaymentRequestType } from '@/app/dashboard/payment-request/_types/payment-request.types';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { PaymentRequestEmployeeFields } from '@/app/dashboard/payment-request/_components/payment-request-employee-fields';
import { PaymentRequestExtendedFields } from '@/app/dashboard/payment-request/_components/payment-request-extended-fields';
import { CompanyBankAccountSelect } from '@/app/dashboard/payment-request/_components/bank-account/company-bank-account-select';
import { PaymentRequestAccountDetailsPanel } from '@/app/dashboard/payment-request/_components/payment-request-account-details-panel';
import { PaymentRequestRequesterInfoCard } from '@/app/dashboard/payment-request/_components/payment-request-requester-info-card';
import { formatPaymentAccountLines } from '@/app/dashboard/payment-request/_utils/payment-request-display.utils';
import {
  paymentResponseToAdvanceApproverValues,
  paymentResponseToEmployeeFormValues,
  paymentResponseToLoanApproverValues,
} from '@/app/dashboard/payment-request/_utils/payment-request-mapper';
import type { WorkflowApprovePayload } from '@/app/_actions/workflow-runtime-actions';
import {
  PaymentRequestAdvanceApproverSchema,
  PaymentRequestLoanApproverSchema,
  PayerCompanyAccountIdSchema,
} from '@/app/dashboard/payment-request/_types/payment-request.schema';

export type WorkflowPaymentRequestReviewHandle = {
  buildApprovePayload: () => { ok: true; payload: WorkflowApprovePayload } | { ok: false; error: string };
};

type Props = {
  record: PaymentRequestResponse;
  needsPayer?: boolean;
  /** نمایش و ارسال حساب مبدأ شرکت (وام/مساعده در مرحله مالی، دستور پرداخت، …) */
  showCompanyPayerSelect?: boolean;
};

const PayerCompanySchema = z.object({
  payerCompanyAccountId: PayerCompanyAccountIdSchema,
});

export const WorkflowPaymentRequestReview = forwardRef<WorkflowPaymentRequestReviewHandle, Props>(
  function WorkflowPaymentRequestReview({ record, needsPayer = false, showCompanyPayerSelect = false }, ref) {
    const employeeDefaults = useMemo(() => paymentResponseToEmployeeFormValues(record), [record]);
    const employeeForm = useForm({ defaultValues: employeeDefaults });

    const isLoan = record.type === PaymentRequestType.LOAN;
    const isAdvance = record.type === PaymentRequestType.ADVANCE;
    const isPaymentOrder = record.type === PaymentRequestType.PAYMENT_ORDER;

    const approverDefaults = useMemo(() => {
      const payerId = record.payerCompanyAccountId ?? 0;
      if (isLoan) return { type: record.type, ...paymentResponseToLoanApproverValues(record), payerCompanyAccountId: payerId };
      if (isAdvance) {
        return { type: record.type, ...paymentResponseToAdvanceApproverValues(record), payerCompanyAccountId: payerId };
      }
      return { type: record.type, payerCompanyAccountId: payerId };
    }, [record, isLoan, isAdvance]);

    const approverForm = useForm({ defaultValues: approverDefaults });

    useImperativeHandle(ref, () => ({
      buildApprovePayload: () => {
        const values = approverForm.getValues();
        const payload: WorkflowApprovePayload = {};

        if (isLoan) {
          const parsed = PaymentRequestLoanApproverSchema.safeParse(values);
          if (!parsed.success) {
            return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'شرایط وام را تکمیل کنید' };
          }
          payload.amount = parsed.data.amount;
          payload.installment_count = parsed.data.loanInstallmentCount;
          payload.first_installment_date = parsed.data.loanFirstInstallmentDate;
        } else if (isAdvance) {
          const parsed = PaymentRequestAdvanceApproverSchema.safeParse(values);
          if (!parsed.success) {
            return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'شرایط مساعده را تکمیل کنید' };
          }
          payload.amount = parsed.data.amount;
          payload.settlement_date = parsed.data.advanceExpectedRepaymentDate;
        }

        const requirePayer = showCompanyPayerSelect || needsPayer || isPaymentOrder;
        if (requirePayer) {
          const payerParsed = PayerCompanySchema.safeParse({
            payerCompanyAccountId: values.payerCompanyAccountId,
          });
          if (!payerParsed.success) {
            return {
              ok: false as const,
              error: payerParsed.error.issues[0]?.message ?? 'حساب مبدأ شرکت را انتخاب کنید',
            };
          }
          payload.payer_company_account_id = payerParsed.data.payerCompanyAccountId;
        }

        return { ok: true as const, payload };
      },
    }));

    const attachmentLinks =
      record.documentsUrls?.length > 0
        ? record.documentsUrls
        : (record.attachments?.map((a) => a.fileUrl).filter(Boolean) as string[]) ?? [];

    const showPayerSelect = showCompanyPayerSelect || needsPayer || isPaymentOrder;
    const showApproverBlock = isLoan || isAdvance || showPayerSelect;
    const cp = record.counterparty;

    return (
      <div className="space-y-4">
        {isPaymentOrder && cp && (
          <Alert>
            <AlertTitle>طرف‌حساب</AlertTitle>
            <AlertDescription className="space-y-1 text-sm">
              <p>
                {cp.name}
                {cp.companyName ? ` — ${cp.companyName}` : ''}
              </p>
            </AlertDescription>
          </Alert>
        )}

        <PaymentRequestRequesterInfoCard record={record} />
        <PaymentRequestAccountDetailsPanel record={record} hidePayerSection={showPayerSelect} />

        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="mb-3 text-sm font-medium">جزئیات درخواست</p>
          <Form {...employeeForm}>
            <PaymentRequestEmployeeFields
              control={employeeForm.control}
              readOnly
              fixedType={record.type}
              loanAdvanceOnly={isLoan || isAdvance}
              receiverBanner={{
                title: 'حساب واریز',
                lines: formatPaymentAccountLines(record.receiver, record.receiverAccountDetail),
              }}
              attachmentLinks={attachmentLinks}
            />
          </Form>
        </div>

        {showApproverBlock && (
          <Form {...approverForm}>
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium">تأیید توسط مسئول</p>
              {(isLoan || isAdvance) && (
                <p className="text-xs text-muted-foreground">
                  مبلغ نهایی و شرایط را مشخص کنید؛ حساب مبدأ شرکت را انتخاب کنید.
                </p>
              )}
              {(isLoan || isAdvance) && (
                <PaymentRequestExtendedFields control={approverForm.control} mode="approver" />
              )}

              {showPayerSelect && (
                <FormField
                  control={approverForm.control}
                  name="payerCompanyAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حساب مبدأ پرداخت (شرکت) *</FormLabel>
                      <FormControl>
                        <CompanyBankAccountSelect
                          value={field.value ?? 0}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        حسابی که مبلغ وام از آن پرداخت می‌شود را انتخاب کنید.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </Form>
        )}
      </div>
    );
  },
);

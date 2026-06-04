'use client';

import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import type { PaymentRequestResponse } from '@/app/dashboard/payment-request/_types/payment-request.types';
import { PaymentRequestType } from '@/app/dashboard/payment-request/_types/payment-request.types';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { PaymentRequestEmployeeFields } from '@/app/dashboard/payment-request/_components/payment-request-employee-fields';
import { PaymentRequestExtendedFields } from '@/app/dashboard/payment-request/_components/payment-request-extended-fields';
import { CompanyBankAccountSelect } from '@/app/dashboard/payment-request/_components/bank-account/company-bank-account-select';
import { PaymentRequestAccountDetailsPanel } from '@/app/dashboard/payment-request/_components/payment-request-account-details-panel';
import { PaymentRequestRequesterInfoCard } from '@/app/dashboard/payment-request/_components/payment-request-requester-info-card';
import { WorkflowFinancialApproverFields } from '@/app/dashboard/workflow/inbox/_components/workflow-financial-approver-fields';
import { formatPaymentAccountLines } from '@/app/dashboard/payment-request/_utils/payment-request-display.utils';
import { RequestAttachmentsPanel } from '@/app/components/attachments/request-attachments-panel';
import {
  paymentResponseToAdvanceApproverValues,
  paymentResponseToEmployeeFormValues,
  paymentResponseToLoanApproverValues,
  paymentResponseToPaymentOrderApproverValues,
} from '@/app/dashboard/payment-request/_utils/payment-request-mapper';
import { PaymentMethod } from '@/app/dashboard/payment-request/_utils/payment-method';
import type { WorkflowApprovePayload } from '@/app/_actions/workflow-runtime-actions';
import {
  FinancialApproverAmountDateSchema,
  PaymentRequestAdvanceApproverSchema,
  PaymentRequestLoanApproverSchema,
  PaymentOrderApproverSchema,
  PayerCompanyAccountIdSchema,
} from '@/app/dashboard/payment-request/_types/payment-request.schema';

export type WorkflowPaymentRequestReviewHandle = {
  buildApprovePayload: () => { ok: true; payload: WorkflowApprovePayload } | { ok: false; error: string };
};

type Props = {
  record: PaymentRequestResponse;
  needsPayer?: boolean;
  /** مرحله مالی — تکمیل اقساط/تسویه */
  needsFinancialTerms?: boolean;
  /** نمایش و ارسال حساب مبدأ شرکت (وام/مساعده در مرحله مالی، دستور پرداخت، …) */
  showCompanyPayerSelect?: boolean;
};

const PayerCompanySchema = z.object({
  payerCompanyAccountId: PayerCompanyAccountIdSchema,
});

export const WorkflowPaymentRequestReview = forwardRef<WorkflowPaymentRequestReviewHandle, Props>(
  function WorkflowPaymentRequestReview(
    { record, needsPayer = false, needsFinancialTerms = false, showCompanyPayerSelect = false },
    ref,
  ) {
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
      if (isPaymentOrder) {
        return {
          type: record.type,
          ...paymentResponseToPaymentOrderApproverValues(record),
          payerCompanyAccountId: payerId,
        };
      }
      return {
        type: record.type,
        amount: record.amount,
        paymentDate: record.paymentDate ?? '',
        payerCompanyAccountId: payerId,
      };
    }, [record, isLoan, isAdvance, isPaymentOrder]);

    const approverForm = useForm({ defaultValues: approverDefaults });

    useImperativeHandle(ref, () => ({
      buildApprovePayload: () => {
        const values = approverForm.getValues();
        const payload: WorkflowApprovePayload = {};

        const baseParsed = FinancialApproverAmountDateSchema.safeParse({
          amount: values.amount,
          paymentDate: values.paymentDate,
        });
        if (!baseParsed.success) {
          return {
            ok: false as const,
            error: baseParsed.error.issues[0]?.message ?? 'مبلغ و تاریخ پرداخت را تکمیل کنید',
          };
        }
        payload.amount = baseParsed.data.amount;
        payload.payment_date = baseParsed.data.paymentDate;

        if (needsFinancialTerms && isLoan) {
          const parsed = PaymentRequestLoanApproverSchema.safeParse(values);
          if (!parsed.success) {
            return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'شرایط وام را تکمیل کنید' };
          }
          payload.installment_count = parsed.data.loanInstallmentCount;
          payload.first_installment_date = parsed.data.loanFirstInstallmentDate;
        } else if (needsFinancialTerms && isAdvance) {
          const parsed = PaymentRequestAdvanceApproverSchema.safeParse(values);
          if (!parsed.success) {
            return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'تاریخ تسویه را وارد کنید' };
          }
          payload.settlement_date = parsed.data.advanceExpectedRepaymentDate;
        }

        if (isPaymentOrder) {
          const methodParsed = PaymentOrderApproverSchema.safeParse({
            paymentMethod: values.paymentMethod,
          });
          if (!methodParsed.success) {
            return {
              ok: false as const,
              error: methodParsed.error.issues[0]?.message ?? 'روش پرداخت را انتخاب کنید',
            };
          }
          payload.payment_method = methodParsed.data.paymentMethod;
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

    const showPayerSelect = showCompanyPayerSelect || needsPayer || isPaymentOrder;
    const showLoanAdvanceTerms = needsFinancialTerms && (isLoan || isAdvance);
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
        <RequestAttachmentsPanel
          documentsUrls={record.documentsUrls}
          attachments={record.attachments}
        />
        <PaymentRequestAccountDetailsPanel record={record} hidePayerSection={showPayerSelect} />

        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="mb-3 text-sm font-medium">جزئیات درخواست (ثبت‌شده)</p>
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
              attachmentLinks={[]}
            />
          </Form>
        </div>

        <Form {...approverForm}>
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium">تأیید توسط مسئول</p>
            <p className="text-xs text-muted-foreground">
              مبلغ و تاریخ پرداخت را در صورت نیاز اصلاح کنید؛ این مقادیر در تأیید شما ثبت می‌شوند.
            </p>
            <WorkflowFinancialApproverFields control={approverForm.control} />

            {showLoanAdvanceTerms && (
              <PaymentRequestExtendedFields control={approverForm.control} mode="approver" />
            )}

            {isPaymentOrder && (
              <FormField
                control={approverForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>روش پرداخت *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب روش پرداخت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PaymentMethod.CHECK}>چک</SelectItem>
                        <SelectItem value={PaymentMethod.TRANSFER}>حواله</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </Form>
      </div>
    );
  },
);

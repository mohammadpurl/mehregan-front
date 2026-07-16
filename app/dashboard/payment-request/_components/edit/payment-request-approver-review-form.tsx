'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { RequiredFieldsHint } from '@/app/components/ui/required-mark';
import { Input } from '@/app/components/ui/input';
import { updatePaymentRequestAction } from '@/app/_actions/payment-request-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import type { PaymentRequestResponse } from '../../_types/payment-request.types';
import { PaymentRequestType } from '../../_types/payment-request.types';
import type { PaymentRequestApproverReviewValues } from '../../_types/payment-request.schema';
import {
  PaymentRequestAdvanceApproverSchema,
  PaymentRequestLoanApproverSchema,
} from '../../_types/payment-request.schema';
import { PaymentRequestExtendedFields } from '../payment-request-extended-fields';
import { PaymentRequestEmployeeFields } from '../payment-request-employee-fields';
import {
  approverReviewToUpdatePayload,
  isAdvanceTermsUnset,
  isLoanTermsUnset,
  isPaymentRequestPayerUnset,
} from '../../_utils/payment-request-form.utils';
import { CompanyBankAccountSelect } from '../bank-account/company-bank-account-select';
import {
  paymentResponseToAdvanceApproverValues,
  paymentResponseToEmployeeFormValues,
  paymentResponseToLoanApproverValues,
} from '../../_utils/payment-request-mapper';

type Props = {
  record: PaymentRequestResponse;
  isFinance: boolean;
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

export function PaymentRequestApproverReviewForm({
  record,
  isFinance,
  formId = 'payment-request-edit-form',
  onSuccess,
  onBusyChange,
}: Props) {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();

  const needsLoan = record.type === PaymentRequestType.LOAN && isLoanTermsUnset(record);
  const needsAdvance = record.type === PaymentRequestType.ADVANCE && isAdvanceTermsUnset(record);
  const needsPayer = isFinance && isPaymentRequestPayerUnset(record);

  const employeeDefaults = useMemo(() => paymentResponseToEmployeeFormValues(record), [record]);

  const defaultValues = useMemo<PaymentRequestApproverReviewValues & { type: PaymentRequestType }>(() => {
    const loan = paymentResponseToLoanApproverValues(record);
    const advance = paymentResponseToAdvanceApproverValues(record);
    return {
      type: record.type,
      payerCompanyAccountId: needsPayer ? 0 : record.payerCompanyAccountId ?? undefined,
      loanInstallmentCount: loan.loanInstallmentCount,
      loanFirstInstallmentDate: loan.loanFirstInstallmentDate,
      advanceExpectedRepaymentDate: advance.advanceExpectedRepaymentDate,
    };
  }, [record, needsPayer]);

  const employeeForm = useForm({ defaultValues: employeeDefaults });
  const form = useForm<PaymentRequestApproverReviewValues & { type: PaymentRequestType }>({
    defaultValues,
  });

  useEffect(() => {
    employeeForm.reset(employeeDefaults);
  }, [employeeDefaults, employeeForm]);

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  useEffect(() => {
    onBusyChange?.(isPending);
  }, [isPending, onBusyChange]);

  const onSubmit = (values: PaymentRequestApproverReviewValues & { type: PaymentRequestType }) => {
    if (needsLoan) {
      const parsed = PaymentRequestLoanApproverSchema.safeParse({
        loanInstallmentCount: values.loanInstallmentCount,
        loanFirstInstallmentDate: values.loanFirstInstallmentDate,
      });
      if (!parsed.success) {
        notifyError(parsed.error.issues[0]?.message ?? 'شرایط وام را تکمیل کنید');
        return;
      }
    }
    if (needsAdvance) {
      const parsed = PaymentRequestAdvanceApproverSchema.safeParse({
        advanceExpectedRepaymentDate: values.advanceExpectedRepaymentDate,
      });
      if (!parsed.success) {
        notifyError(parsed.error.issues[0]?.message ?? 'تاریخ تسویه را وارد کنید');
        return;
      }
    }
    if (needsPayer && (!values.payerCompanyAccountId || values.payerCompanyAccountId < 1)) {
      notifyError('حساب مبدأ شرکت را انتخاب کنید');
      return;
    }

    const patch = approverReviewToUpdatePayload(record, values, { needsLoan, needsAdvance, needsPayer });

    startTransition(async () => {
      const result = await updatePaymentRequestAction(record.id, patch);
      if (result.success) {
        notifySuccess('اطلاعات تأییدکننده ذخیره شد');
        onSuccess?.();
      } else {
        notifyError(result.error || 'ذخیره ناموفق بود');
      }
    });
  };

  const attachmentLinks =
    record.documentsUrls?.length > 0
      ? record.documentsUrls
      : (record.attachments?.map((a) => a.fileUrl).filter(Boolean) as string[]) ?? [];

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">اطلاعات ثبت‌شده توسط درخواست‌کننده</p>
          <PaymentRequestEmployeeFields
            control={employeeForm.control}
            readOnly
            receiverBanner={{
              title: 'حساب واریز',
              lines: [`${record.receiver.name} — ${record.receiver.accountNumber}`],
            }}
            attachmentLinks={attachmentLinks}
          />
        </div>

        {(needsLoan || needsAdvance || needsPayer) && (
          <div className="space-y-3">
            <p className="text-sm font-medium">تکمیل توسط تأییدکننده</p>
            <RequiredFieldsHint />
            {(needsLoan || needsAdvance) && (
              <p className="text-xs text-muted-foreground">
                شرایط وام یا مساعده را قبل از تأیید نهایی مشخص کنید.
              </p>
            )}
            <PaymentRequestExtendedFields control={form.control} mode="approver" />

            {needsPayer && (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">حساب مبدأ پرداخت (شرکت)</p>
                <FormField
                  control={form.control}
                  name="payerCompanyAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>انتخاب حساب</FormLabel>
                      <FormControl>
                        <CompanyBankAccountSelect value={field.value ?? 0} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </form>
    </Form>
  );
}

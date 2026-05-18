'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { updatePaymentRequestAction } from '@/app/_actions/payment-request-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import type { PaymentRequestResponse } from '../../_types/payment-request.types';
import { z } from 'zod';
import { PayerCompanyAccountIdSchema } from '../../_types/payment-request.schema';
import { CompanyBankAccountSelect } from '../bank-account/company-bank-account-select';

const PayerAssignSchema = z.object({
  payerCompanyAccountId: PayerCompanyAccountIdSchema,
});

type PayerAssignValues = z.infer<typeof PayerAssignSchema>;

type Props = {
  record: PaymentRequestResponse;
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

/** تعیین حساب مبدأ شرکت توسط مدیر مالی */
export function PaymentRequestPayerAssignForm({
  record,
  formId = 'payment-request-edit-form',
  onSuccess,
  onBusyChange,
}: Props) {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<PayerAssignValues>({
    resolver: zodResolver(PayerAssignSchema),
    defaultValues: { payerCompanyAccountId: record.payerCompanyAccountId ?? 0 },
  });

  useEffect(() => {
    onBusyChange?.(isPending);
  }, [isPending, onBusyChange]);

  const onSubmit = (values: PayerAssignValues) => {
    startTransition(async () => {
      const result = await updatePaymentRequestAction(record.id, {
        payerCompanyAccountId: values.payerCompanyAccountId,
        type: record.type,
        documents: files.length ? files : undefined,
      });
      if (result.success) {
        notifySuccess('حساب مبدأ ثبت شد');
        if (result.attachmentError) notifyError(`پیوست: ${result.attachmentError}`);
        onSuccess?.();
      } else {
        notifyError(result.error || 'ذخیره ناموفق بود');
      }
    });
  };

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert>
          <AlertTitle>حساب واریز کارمند</AlertTitle>
          <AlertDescription>
            {record.receiver.name} — {record.receiver.accountNumber}
          </AlertDescription>
        </Alert>

        <p className="text-sm text-muted-foreground">پس از تأیید مدیر مستقیم، حساب مبدأ پرداخت شرکت را انتخاب کنید.</p>

        <FormField
          control={form.control}
          name="payerCompanyAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>حساب مبدأ پرداخت (شرکت)</FormLabel>
              <FormControl>
                <CompanyBankAccountSelect value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>پیوست (اختیاری)</FormLabel>
          <Input
            type="file"
            multiple
            className="cursor-pointer"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files) setFiles(Array.from(e.target.files));
            }}
          />
        </div>
      </form>
    </Form>
  );
}

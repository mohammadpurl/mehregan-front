'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/app/components/ui/form';
import { updatePaymentRequestAction } from '@/app/_actions/payment-request-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import type { PaymentRequestResponse } from '../../_types/payment-request.types';
import { PaymentRequestType } from '../../_types/payment-request.types';
import {
  PaymentRequestEmployeeCreateSchema,
  type PaymentRequestEmployeeCreateValues,
} from '../../_types/payment-request.schema';
import { PaymentRequestEmployeeFields } from '../payment-request-employee-fields';
import { employeeFormToUpdatePayload } from '../../_utils/payment-request-form.utils';
import { paymentResponseToEmployeeFormValues } from '../../_utils/payment-request-mapper';

type Props = {
  record: PaymentRequestResponse;
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

export function PaymentRequestEmployeeEditForm({
  record,
  formId = 'payment-request-edit-form',
  onSuccess,
  onBusyChange,
}: Props) {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const [files, setFiles] = useState<File[]>([]);
  const isLoanAdvance =
    record.type === PaymentRequestType.LOAN || record.type === PaymentRequestType.ADVANCE;

  const form = useForm<PaymentRequestEmployeeCreateValues>({
    resolver: zodResolver(PaymentRequestEmployeeCreateSchema),
    defaultValues: paymentResponseToEmployeeFormValues(record),
  });

  useEffect(() => {
    form.reset(paymentResponseToEmployeeFormValues(record));
  }, [record, form]);

  useEffect(() => {
    onBusyChange?.(isPending);
  }, [isPending, onBusyChange]);

  const onSubmit = (values: PaymentRequestEmployeeCreateValues) => {
    startTransition(async () => {
      const result = await updatePaymentRequestAction(record.id, {
        ...employeeFormToUpdatePayload(values, record),
        documents: files.length ? files : undefined,
      });
      if (result.success) {
        notifySuccess('ذخیره شد');
        if (result.attachmentError) notifyError(`پیوست: ${result.attachmentError}`);
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
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <PaymentRequestEmployeeFields
          control={form.control}
          fixedType={isLoanAdvance ? record.type : undefined}
          loanAdvanceOnly={isLoanAdvance}
          receiverBanner={{
            title: 'حساب واریز',
            lines: [`${record.receiver.name} — ${record.receiver.accountNumber}`],
          }}
          attachmentLinks={attachmentLinks}
          onFilesChange={setFiles}
        />
      </form>
    </Form>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { JalaliDateInput } from '@/app/components/ui/jalali-date-input';
import { FormattedNumberInput } from '@/app/components/ui/formatted-number-input';
import { AttachmentFileInput } from '@/app/components/attachments/attachment-file-input';
import { createFinancialDocumentAction } from '@/app/_actions/financial-document-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import { notifyAttachmentUploadFailed } from '@/app/utils/form-notify';
import { todayGregorianIso } from '@/app/utils/jalali-date';
import {
  FinancialDocumentCreateSchema,
  type FinancialDocumentCreateValues,
} from '../_types/financial-document.schema';

type Props = {
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

const defaultValues: FinancialDocumentCreateValues = {
  documentType: 'check',
  title: '',
  description: '',
  amount: 0,
  documentDate: todayGregorianIso(),
  checkNumber: '',
  partyName: '',
};

export function FinancialDocumentNewForm({
  formId = 'financial-document-new-form',
  onSuccess,
  onBusyChange,
}: Props) {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<FinancialDocumentCreateValues>({
    resolver: zodResolver(FinancialDocumentCreateSchema),
    defaultValues,
  });

  const documentType = form.watch('documentType');

  useEffect(() => {
    onBusyChange?.(isPending);
  }, [isPending, onBusyChange]);

  const onSubmit = (values: FinancialDocumentCreateValues) => {
    if (!files.length) {
      notifyError('بارگذاری تصویر سند (مثلاً عکس چک) الزامی است');
      return;
    }
    startTransition(async () => {
      const result = await createFinancialDocumentAction(
        {
          documentType: values.documentType,
          title: values.title,
          description: values.description,
          amount: values.amount,
          documentDate: values.documentDate,
          checkNumber: values.checkNumber,
          partyName: values.partyName,
        },
        files,
      );
      if (result.success) {
        notifySuccess('سند مالی ثبت شد و وارد روال تأیید مالی شد');
        if (result.attachmentError) notifyAttachmentUploadFailed(result.attachmentError);
        onSuccess?.();
      } else {
        notifyError(result.error || 'ثبت ناموفق بود');
      }
    });
  };

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          ثبت سند توسط واحد مالی — پس از بارگذاری، روال تأیید (مدیر مستقیم تا سرپرست مالی / سپیدار) شروع می‌شود.
        </p>

        <FormField
          control={form.control}
          name="documentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع سند</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="check">چک</SelectItem>
                  <SelectItem value="other">سایر</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عنوان (اختیاری)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="مثلاً چک دریافتی از …" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {documentType === 'check' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="checkNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شماره چک</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صادرکننده / طرف سند</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مبلغ (ریال)</FormLabel>
                <FormControl>
                  <FormattedNumberInput value={field.value ?? 0} onChange={field.onChange} onBlur={field.onBlur} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="documentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاریخ سند</FormLabel>
                <FormControl>
                  <JalaliDateInput value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>شرح</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="توضیح درباره ورود سند به مجموعه…" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>تصویر / پیوست سند *</FormLabel>
          <AttachmentFileInput files={files} onFilesChange={setFiles} />
          <p className="text-xs text-muted-foreground">برای چک بدون سابقه در سیستم، عکس چک را بارگذاری کنید.</p>
        </div>
      </form>
    </Form>
  );
}

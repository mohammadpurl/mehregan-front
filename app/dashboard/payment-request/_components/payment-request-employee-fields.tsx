'use client';

import type { Control } from 'react-hook-form';
import { AttachmentFileInput } from '@/app/components/attachments/attachment-file-input';
import { useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { JalaliDateInput } from '@/app/components/ui/jalali-date-input';
import { FormattedNumberInput } from '@/app/components/ui/formatted-number-input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import type { PaymentRequestEmployeeCreateValues } from '../_types/payment-request.schema';
import { PaymentRequestType } from '../_types/payment-request.types';
import { PaymentRequestExtendedFields } from './payment-request-extended-fields';

const TYPE_LABELS: Record<PaymentRequestType, string> = {
  [PaymentRequestType.LOAN]: 'وام',
  [PaymentRequestType.ADVANCE]: 'مساعده',
  [PaymentRequestType.PAYMENT_ORDER]: 'دستور پرداخت',
  [PaymentRequestType.PROCUREMENT]: 'پرداخت خرید',
  [PaymentRequestType.CASH]: 'تنخواه',
  [PaymentRequestType.PAYMENT]: 'پرداخت',
  [PaymentRequestType.OTHER]: 'سایر',
};

type Props = {
  control: Control<PaymentRequestEmployeeCreateValues>;
  readOnly?: boolean;
  /** وام/مساعده: فقط مبلغ، تاریخ، شرح (مطابق API بک‌اند) */
  loanAdvanceOnly?: boolean;
  /** نوع ثابت در ویرایش وام/مساعده */
  fixedType?: PaymentRequestType;
  receiverBanner?: { title: string; lines: string[] };
  attachmentLinks?: string[];
  selectedFiles?: File[];
  onFilesChange?: (files: File[]) => void;
};

/** فیلدهای درخواست‌کننده — ثبت و ویرایش */
export function PaymentRequestEmployeeFields({
  control,
  readOnly = false,
  loanAdvanceOnly = false,
  fixedType,
  receiverBanner,
  attachmentLinks,
  selectedFiles,
  onFilesChange,
}: Props) {
  const watchedType = useWatch({ control, name: 'type' });
  const displayType = fixedType ?? watchedType;
  const isLoanAdvance =
    loanAdvanceOnly ||
    displayType === PaymentRequestType.LOAN ||
    displayType === PaymentRequestType.ADVANCE;

  return (
    <div className="space-y-4">
      {receiverBanner && (
        <Alert>
          <AlertTitle>{receiverBanner.title}</AlertTitle>
          <AlertDescription className="space-y-1">
            {receiverBanner.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {fixedType ? (
        <FormItem>
          <FormLabel>نوع درخواست</FormLabel>
          <p className="text-sm">{TYPE_LABELS[fixedType]}</p>
        </FormItem>
      ) : (
        !isLoanAdvance && (
          <FormField
            control={control}
            name="type"
            render={({ field }) =>
              readOnly ? (
                <FormItem>
                  <FormLabel>نوع درخواست</FormLabel>
                  <p className="text-sm">{TYPE_LABELS[field.value] ?? field.value}</p>
                </FormItem>
              ) : (
                <FormItem>
                  <FormLabel>نوع درخواست</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PaymentRequestType.LOAN}>وام</SelectItem>
                      <SelectItem value={PaymentRequestType.ADVANCE}>مساعده</SelectItem>
                      <SelectItem value={PaymentRequestType.CASH}>تنخواه</SelectItem>
                      <SelectItem value={PaymentRequestType.PAYMENT}>پرداخت</SelectItem>
                      <SelectItem value={PaymentRequestType.OTHER}>سایر</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }
          />
        )
      )}

      {!isLoanAdvance && (
        <PaymentRequestExtendedFields control={control} mode="employee" readOnly={readOnly} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تاریخ</FormLabel>
              <FormControl>
                {readOnly ? (
                  <p className="text-sm">{formatJalaliDate(field.value)}</p>
                ) : (
                  <JalaliDateInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isLoanAdvance ? 'مبلغ درخواستی (ریال)' : 'مبلغ (ریال)'}</FormLabel>
              <FormControl>
                {readOnly ? (
                  <p className="text-sm">{formatAmount(field.value, { unit: 'ریال' })}</p>
                ) : (
                  <FormattedNumberInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>شرح درخواست</FormLabel>
            <FormControl>
              {readOnly ? (
                <p className="whitespace-pre-wrap text-sm">{field.value || '—'}</p>
              ) : (
                <Textarea className="min-h-[88px]" placeholder="دلیل درخواست…" {...field} />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isLoanAdvance && (
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>توضیحات (اختیاری)</FormLabel>
              <FormControl>
                {readOnly ? (
                  <p className="whitespace-pre-wrap text-sm">{field.value?.trim() ? field.value : '—'}</p>
                ) : (
                  <Textarea className="min-h-[64px]" {...field} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {!readOnly && onFilesChange && (
        <div className="space-y-2">
          <FormLabel>پیوست {attachmentLinks?.length ? '(جدید)' : '(اختیاری)'}</FormLabel>
          <AttachmentFileInput files={selectedFiles} onFilesChange={onFilesChange} />
        </div>
      )}

      {attachmentLinks && attachmentLinks.length > 0 && (
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          {attachmentLinks.map((url) => (
            <li key={url}>
              <a href={url} className="text-primary underline" target="_blank" rel="noreferrer">
                {url.split('/').pop()}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

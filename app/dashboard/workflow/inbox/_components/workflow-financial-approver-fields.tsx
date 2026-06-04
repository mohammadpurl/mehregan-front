'use client';

import type { Control, FieldValues, Path } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { JalaliDateInput } from '@/app/components/ui/jalali-date-input';
import { FormattedNumberInput } from '@/app/components/ui/formatted-number-input';

type ApproverAmountDateFields = {
  amount?: number;
  paymentDate?: string;
};

type Props<T extends FieldValues> = {
  control: Control<T>;
  readOnly?: boolean;
  amountLabel?: string;
  dateLabel?: string;
};

/** مبلغ و تاریخ پرداخت — مشترک بین انواع درخواست‌های مالی در workflow */
export function WorkflowFinancialApproverFields<T extends FieldValues>({
  control,
  readOnly = false,
  amountLabel = 'مبلغ تأیید (ریال)',
  dateLabel = 'تاریخ پرداخت',
}: Props<T>) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        control={control as Control<ApproverAmountDateFields & FieldValues>}
        name={'amount' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{amountLabel}</FormLabel>
            <FormControl>
              <FormattedNumberInput
                value={field.value ?? 0}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={readOnly}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control as Control<ApproverAmountDateFields & FieldValues>}
        name={'paymentDate' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dateLabel}</FormLabel>
            <FormControl>
              <JalaliDateInput
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={readOnly}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

'use client';

import type { Control, FieldValues, Path } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { JalaliDateInput } from '@/app/components/ui/jalali-date-input';
import { FormattedNumberInput } from '@/app/components/ui/formatted-number-input';
import { PaymentRequestType } from '../_types/payment-request.types';

type EmployeeFields = {
  type: PaymentRequestType;
  cashExpenseCategory?: string;
};

type ApproverFields = {
  type: PaymentRequestType;
  amount?: number;
  loanInstallmentCount?: number;
  loanFirstInstallmentDate?: string;
  advanceExpectedRepaymentDate?: string;
};

type Props<T extends FieldValues> = {
  control: Control<T>;
  mode: 'employee' | 'approver';
  readOnly?: boolean;
};

/** فیلدهای تکمیلی: کارمند فقط تنخواه؛ تأییدکننده شرایط وام/مساعده */
export function PaymentRequestExtendedFields<T extends FieldValues>({
  control,
  mode,
  readOnly = false,
}: Props<T>) {
  const type = useWatch({ control, name: 'type' as Path<T> }) as PaymentRequestType;

  if (mode === 'employee' && type === PaymentRequestType.CASH) {
    return (
      <div className="space-y-3 rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/40">
        <p className="text-sm font-medium">جزئیات تنخواه</p>
        <FormField
          control={control}
          name={'cashExpenseCategory' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>شرح نوع هزینه</FormLabel>
              <FormControl>
                <Input disabled={readOnly} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  if (mode === 'approver' && type === PaymentRequestType.LOAN) {
    return (
      <div className="space-y-3 rounded-lg border border-sky-200/80 bg-sky-50/40 p-4 dark:border-sky-900/40">
        <p className="text-sm font-medium text-sky-950 dark:text-sky-100">شرایط وام (مرحله مالی)</p>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name={'loanInstallmentCount' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>تعداد اقساط</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={360}
                    disabled={readOnly}
                    value={field.value === undefined || field.value === null ? '' : String(field.value)}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={'loanFirstInstallmentDate' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاریخ شروع قسط اول</FormLabel>
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
      </div>
    );
  }

  if (mode === 'approver' && type === PaymentRequestType.ADVANCE) {
    return (
      <div className="space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40">
        <p className="text-sm font-medium">تاریخ تسویه مساعده (مرحله مالی)</p>
        <FormField
          control={control}
          name={'advanceExpectedRepaymentDate' as Path<T>}
          render={({ field }) => (
            <FormItem className="max-w-md">
              <FormLabel>تاریخ تسویه</FormLabel>
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

  return null;
}

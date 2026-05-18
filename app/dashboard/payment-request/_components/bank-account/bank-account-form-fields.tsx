'use client';

import type { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { Switch } from '@/app/components/ui/switch';
import type { BankAccountFormValues } from '../../_types/bank-account.schema';

type Props = {
  control: Control<BankAccountFormValues>;
  showDefault?: boolean;
};

export function BankAccountFormFields({ control, showDefault = true }: Props) {
  return (
    <>
      <FormField
        control={control}
        name="label"
        render={({ field }) => (
          <FormItem>
            <FormLabel>عنوان حساب</FormLabel>
            <FormControl>
              <Input {...field} placeholder="مثلاً حساب عملیاتی اصلی" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="bankName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>نام بانک</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>شماره حساب</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="shebaNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>شبا</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="cardNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>شماره کارت</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {showDefault && (
        <FormField
          control={control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel>حساب پیش‌فرض</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </>
  );
}

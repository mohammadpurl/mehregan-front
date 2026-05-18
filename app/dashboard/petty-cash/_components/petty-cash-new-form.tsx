'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { createPettyCashAction, getPettyCashEligibilityAction } from '@/app/_actions/petty-cash-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import { PettyCashCreateSchema, type PettyCashCreateValues } from '../_types/petty-cash.schema';
import type { PettyCashEligibility } from '../_types/petty-cash.types';
import Link from 'next/link';

type Props = {
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

export function PettyCashNewForm({ formId = 'petty-cash-new-form', onSuccess, onBusyChange }: Props) {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const [eligibility, setEligibility] = useState<PettyCashEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);

  const form = useForm<PettyCashCreateValues>({
    resolver: zodResolver(PettyCashCreateSchema),
    defaultValues: { amount: 0, reason: '', description: '' },
  });

  useEffect(() => {
    void getPettyCashEligibilityAction().then((r) => {
      if (r.success && r.data) setEligibility(r.data);
      setEligibilityLoading(false);
    });
  }, []);

  useEffect(() => {
    onBusyChange?.(isPending || eligibilityLoading);
  }, [isPending, eligibilityLoading, onBusyChange]);

  const blocked = eligibility != null && !eligibility.canCreate;

  const onSubmit = (values: PettyCashCreateValues) => {
    if (blocked) {
      notifyError(eligibility?.message || eligibility?.reason || 'امکان ثبت تنخواه جدید وجود ندارد');
      return;
    }
    startTransition(async () => {
      const result = await createPettyCashAction({
        amount: values.amount,
        reason: values.reason,
        description: values.description,
      });
      if (result.success) {
        notifySuccess('درخواست تنخواه ثبت شد و برای تأیید ارسال شد');
        onSuccess?.();
      } else {
        notifyError(result.error || 'ثبت ناموفق بود');
      }
    });
  };

  return (
    <div className="space-y-4">
      {eligibilityLoading && <p className="text-sm text-muted-foreground">در حال بررسی امکان ثبت…</p>}

      {blocked && (
        <Alert variant="destructive">
          <AlertTitle>ثبت تنخواه جدید مجاز نیست</AlertTitle>
          <AlertDescription className="space-y-2 text-sm">
            <p>{eligibility?.message || eligibility?.reason || 'تنخواه قبلی هنوز تأیید نشده یا خرج آن ثبت نشده است.'}</p>
            {eligibility?.blockingPettyCashId != null && (
              <p>
                <Link
                  href={`/dashboard/petty-cash?pettyCashId=${eligibility.blockingPettyCashId}`}
                  className="underline"
                >
                  مشاهده تنخواه قبلی
                </Link>
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مبلغ تنخواه (ریال) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    disabled={blocked}
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>شرح درخواست *</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[80px]" disabled={blocked} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>توضیحات تکمیلی</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[60px]" disabled={blocked} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}

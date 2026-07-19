'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { FormattedNumberInput } from '@/app/components/ui/formatted-number-input';
import { Textarea } from '@/app/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { createPettyCashAction, getPettyCashEligibilityAction } from '@/app/_actions/petty-cash-actions';
import { getProfileAction } from '@/app/_actions/profile-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import { PettyCashCreateSchema, type PettyCashCreateValues } from '../_types/petty-cash.schema';
import type { PettyCashEligibility } from '../_types/petty-cash.types';
import { profileToReceiverAccount } from '@/app/dashboard/payment-request/_utils/payment-request-form.utils';
import { RequesterDestinationAccountCard } from '@/app/dashboard/payment-request/_components/requester-destination-account-card';
import { RequestTitleField } from '@/app/components/forms/request-title-field';
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
  const [destinationPreview, setDestinationPreview] = useState<
    | { ok: true; name: string; accountNumber: string }
    | { ok: false; error: string }
    | null
  >(null);

  const form = useForm<PettyCashCreateValues>({
    resolver: zodResolver(PettyCashCreateSchema),
    defaultValues: { title: '', amount: 0, reason: '', description: '' },
  });

  useEffect(() => {
    void getPettyCashEligibilityAction().then((r) => {
      if (r.success && r.data) setEligibility(r.data);
      setEligibilityLoading(false);
    });
  }, []);

  useEffect(() => {
    void getProfileAction().then((r) => {
      if (!r.success || !r.data) {
        setDestinationPreview({ ok: false, error: 'پروفایل بارگذاری نشد' });
        return;
      }
      const receiver = profileToReceiverAccount(r.data);
      if (!receiver.ok) {
        setDestinationPreview({ ok: false, error: receiver.error });
        return;
      }
      setDestinationPreview({
        ok: true,
        name: receiver.receiver.name,
        accountNumber: receiver.receiver.accountNumber,
      });
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
        title: values.title,
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

      {destinationPreview?.ok === false ? (
        <Alert variant="destructive">
          <AlertTitle>حساب مقصد در پروفایل تکمیل نیست</AlertTitle>
          <AlertDescription className="space-y-2 text-sm">
            <p>{destinationPreview.error}</p>
            <p>حساب مقصد تنخواه همان حساب خود شماست و باید در پروفایل ثبت شود.</p>
            <Link href="/dashboard/profile" className="font-medium underline">
              رفتن به پروفایل من
            </Link>
          </AlertDescription>
        </Alert>
      ) : destinationPreview?.ok ? (
        <RequesterDestinationAccountCard
          requesterName={destinationPreview.name}
          requesterInfo={{
            displayName: destinationPreview.name,
            shebaNumber: destinationPreview.accountNumber.toUpperCase().startsWith('IR')
              ? destinationPreview.accountNumber
              : undefined,
            cardNumber: destinationPreview.accountNumber.toUpperCase().startsWith('IR')
              ? undefined
              : destinationPreview.accountNumber,
          }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">در حال بارگذاری حساب مقصد از پروفایل…</p>
      )}

      <Form {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <RequestTitleField refType="petty_cash" field={field} disabled={blocked || isPending} />
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مبلغ تنخواه (ریال) *</FormLabel>
                <FormControl>
                  <FormattedNumberInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={blocked}
                    min={1}
                    placeholder="مثلاً ۱٬۰۰۰٬۰۰۰"
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

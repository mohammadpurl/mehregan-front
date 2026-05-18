'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { JalaliDateInput } from '@/app/components/ui/jalali-date-input';
import { FormattedNumberInput } from '@/app/components/ui/formatted-number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { createPaymentOrderAction } from '@/app/_actions/payment-request-actions';
import { getCounterpartiesAction } from '@/app/_actions/counterparty-actions';
import type { Counterparty } from '../../_types/counterparty.types';
import type { CounterpartyBankAccount } from '../../_types/bank-account.types';
import { paymentOrderCreateSchema, type PaymentOrderCreateValues } from '../../_types/counterparty.schema';
import { canSetPayerAccountRole } from '../../_utils/payment-request-roles';
import { useFormAction } from '@/app/hooks/use-form-action';
import { useSessionStore } from '@/app/_store/auth-store';
import { WorkflowSameAssigneeAlert } from '@/app/dashboard/workflow/_components/workflow-same-assignee-alert';
import { useWorkflowAssigneesPreviewWarning } from '@/app/dashboard/workflow/_hooks/use-workflow-assignees-preview-warning';
import { CompanyBankAccountSelect } from '../bank-account/company-bank-account-select';
import { CounterpartyBankAccountSelect } from '../bank-account/counterparty-bank-account-select';
import { BankAccountDetailAlert } from '../bank-account/bank-account-detail-alert';
import { todayGregorianIso } from '@/app/utils/jalali-date';

type Props = {
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

const defaultValues: PaymentOrderCreateValues = {
  counterpartyId: 0,
  counterpartyBankAccountId: 0,
  payerCompanyAccountId: 0,
  paymentDate: todayGregorianIso(),
  reason: '',
  amount: 0,
};

export function PaymentRequestPaymentOrderForm({
  formId = 'payment-request-payment-order-form',
  onSuccess,
  onBusyChange,
}: Props) {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const session = useSessionStore((s) => s.session);
  const canSetPayerAccount = canSetPayerAccountRole(session?.roles);
  const sameAssigneeWarning = useWorkflowAssigneesPreviewWarning('payment_request');
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loadingCp, setLoadingCp] = useState(true);
  const [cpBankAccounts, setCpBankAccounts] = useState<CounterpartyBankAccount[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<PaymentOrderCreateValues>({
    resolver: zodResolver(paymentOrderCreateSchema(canSetPayerAccount)),
    defaultValues,
  });

  const selectedId = form.watch('counterpartyId');
  const selectedBankId = form.watch('counterpartyBankAccountId');
  const selectedBank = useMemo(
    () => cpBankAccounts.find((a) => a.id === selectedBankId) ?? null,
    [cpBankAccounts, selectedBankId],
  );

  useEffect(() => {
    void (async () => {
      setLoadingCp(true);
      const res = await getCounterpartiesAction({ pageSize: 200, activeOnly: true });
      if (res.success && res.data) setCounterparties(res.data.items);
      setLoadingCp(false);
    })();
  }, []);

  useEffect(() => {
    form.setValue('counterpartyBankAccountId', 0);
    setCpBankAccounts([]);
  }, [selectedId, form]);

  useEffect(() => {
    onBusyChange?.(isPending || loadingCp);
  }, [isPending, loadingCp, onBusyChange]);

  const onSubmit = (values: PaymentOrderCreateValues) => {
    startTransition(async () => {
      const result = await createPaymentOrderAction(values, files.length ? files : undefined);
      if (result.success) {
        notifySuccess('دستور پرداخت ثبت شد');
        if (result.attachmentError) notifyError(`پیوست: ${result.attachmentError}`);
        onSuccess?.();
      } else {
        notifyError(result.error || 'ثبت ناموفق بود');
      }
    });
  };

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <WorkflowSameAssigneeAlert show={sameAssigneeWarning} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            طرف‌حساب و حساب واریز را انتخاب کنید؛ حساب مبدأ از حساب‌های تعریف‌شده شرکت است.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/counterparties">طرف‌حساب‌ها</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/company-bank-accounts">حساب‌های شرکت</Link>
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="counterpartyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>طرف حساب</FormLabel>
              <Select
                disabled={loadingCp}
                value={field.value > 0 ? String(field.value) : ''}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCp ? 'در حال بارگذاری…' : 'انتخاب طرف حساب'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {counterparties.map((cp) => (
                    <SelectItem key={cp.id} value={String(cp.id)}>
                      {cp.name}
                      {cp.companyName ? ` — ${cp.companyName}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="counterpartyBankAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>حساب واریز (طرف‌حساب)</FormLabel>
              <FormControl>
                <CounterpartyBankAccountSelect
                  counterpartyId={selectedId}
                  value={field.value}
                  onChange={field.onChange}
                  onAccountsLoaded={setCpBankAccounts}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <BankAccountDetailAlert title="جزئیات حساب واریز" account={selectedBank} />

        {canSetPayerAccount ? (
          <FormField
            control={form.control}
            name="payerCompanyAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>حساب مبدأ پرداخت (شرکت)</FormLabel>
                <FormControl>
                  <CompanyBankAccountSelect value={field.value ?? 0} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            حساب مبدأ پرداخت توسط مدیر مالی یا مدیر عامل در مرحله تأیید انتخاب می‌شود.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مبلغ (ریال)</FormLabel>
                <FormControl>
                  <FormattedNumberInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاریخ</FormLabel>
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
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>شرح / دلیل</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
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
            onChange={(e) => {
              if (e.target.files) setFiles(Array.from(e.target.files));
            }}
          />
        </div>
      </form>
    </Form>
  );
}

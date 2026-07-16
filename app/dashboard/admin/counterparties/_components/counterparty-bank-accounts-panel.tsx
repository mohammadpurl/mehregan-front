'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, Plus } from 'lucide-react';
import {
  createCounterpartyBankAccountAction,
  getCounterpartyBankAccountsAction,
} from '@/app/_actions/counterparty-actions';
import type { CounterpartyBankAccount } from '@/app/dashboard/payment-request/_types/bank-account.types';
import {
  BankAccountFormSchema,
  type BankAccountFormValues,
} from '@/app/dashboard/payment-request/_types/bank-account.schema';
import { BankAccountFormFields } from '@/app/dashboard/payment-request/_components/bank-account/bank-account-form-fields';
import { formatBankAccountLabel } from '@/app/dashboard/payment-request/_utils/bank-account-display';
import { useFormAction } from '@/app/hooks/use-form-action';

const defaultValues: BankAccountFormValues = {
  label: '',
  bankName: '',
  accountNumber: '',
  shebaNumber: '',
  cardNumber: '',
  isDefault: false,
};

type Props = {
  counterpartyId: number;
};

export function CounterpartyBankAccountsPanel({ counterpartyId }: Props) {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const [accounts, setAccounts] = useState<CounterpartyBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [, startLoadTransition] = useTransition();

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(BankAccountFormSchema),
    defaultValues,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getCounterpartyBankAccountsAction(counterpartyId);
    if (res.success) setAccounts(res.data);
    else notifyError(res.error || 'خطا در دریافت حساب‌ها');
    setLoading(false);
  }, [counterpartyId, notifyError]);

  const triggerLoad = useCallback(() => {
    startLoadTransition(() => void load());
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(t);
  }, [triggerLoad]);

  const onSubmit = (values: BankAccountFormValues) => {
    startTransition(async () => {
      const res = await createCounterpartyBankAccountAction(counterpartyId, values);
      if (res.success) {
        notifySuccess('حساب طرف‌حساب ثبت شد');
        form.reset(defaultValues);
        setShowForm(false);
        triggerLoad();
      } else {
        notifyError(res.error || 'ذخیره ناموفق بود');
      }
    });
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">حساب‌های بانکی این طرف‌حساب</p>
        <Button type="button" size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="ml-1 h-4 w-4" />
          حساب جدید
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">هنوز حسابی ثبت نشده است.</p>
      ) : (
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm">
              <span>{formatBankAccountLabel(a)}</span>
              {a.isDefault && <Badge variant="secondary">پیش‌فرض</Badge>}
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <Form {...form}>
          <div className="space-y-4 border-t pt-4">
            <BankAccountFormFields control={form.control} />
            <div className="flex flex-row-reverse gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isPending && <Loader2 className="ml-1 h-4 w-4 animate-spin" />}
                ذخیره حساب
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
                انصراف
              </Button>
            </div>
          </div>
        </Form>
      )}
    </div>
  );
}

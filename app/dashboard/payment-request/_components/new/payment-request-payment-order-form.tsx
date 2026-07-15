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
import {
  PaymentOrderKind,
  paymentOrderCreateSchema,
  type PaymentOrderCreateValues,
} from '../../_types/counterparty.schema';
import { canSetPayerAccountRole } from '../../_utils/payment-request-roles';
import { useFormAction } from '@/app/hooks/use-form-action';
import { useSessionStore } from '@/app/_store/auth-store';
import { WorkflowSameAssigneeAlert } from '@/app/dashboard/workflow/_components/workflow-same-assignee-alert';
import { useWorkflowAssigneesPreviewWarning } from '@/app/dashboard/workflow/_hooks/use-workflow-assignees-preview-warning';
import { AttachmentFileInput } from '@/app/components/attachments/attachment-file-input';
import { notifyAttachmentUploadFailed } from '@/app/utils/form-notify';
import { CompanyBankAccountSelect } from '../bank-account/company-bank-account-select';
import { CounterpartyBankAccountSelect } from '../bank-account/counterparty-bank-account-select';
import { bankAccountPayoutNumber } from '../../_utils/bank-account-display';
import { todayGregorianIso } from '@/app/utils/jalali-date';
import { PaymentMethod } from '../../_utils/payment-method';

type Props = {
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

const CP_NONE = '__none__';

const defaultValues: PaymentOrderCreateValues = {
  paymentOrderKind: PaymentOrderKind.INDIVIDUAL,
  counterpartyId: 0,
  counterpartyBankAccountId: 0,
  receiverName: '',
  receiverAccountNumber: '',
  payerCompanyAccountId: 0,
  paymentDate: todayGregorianIso(),
  reason: '',
  amount: 0,
  paymentMethod: PaymentMethod.TRANSFER,
};

export function PaymentRequestPaymentOrderForm({
  formId = 'payment-request-payment-order-form',
  onSuccess,
  onBusyChange,
}: Props) {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const session = useSessionStore((s) => s.session);
  const canSetPayerAccount = canSetPayerAccountRole(session?.roles);
  const sameAssigneeWarning = useWorkflowAssigneesPreviewWarning('payment_order');
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loadingCp, setLoadingCp] = useState(true);
  const [cpBankAccounts, setCpBankAccounts] = useState<CounterpartyBankAccount[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);

  const form = useForm<PaymentOrderCreateValues>({
    resolver: zodResolver(paymentOrderCreateSchema(canSetPayerAccount)),
    defaultValues,
  });

  const orderKind = form.watch('paymentOrderKind');
  const isIndividual = orderKind === PaymentOrderKind.INDIVIDUAL;
  const isCollective = !isIndividual;
  const selectedId = form.watch('counterpartyId') ?? 0;
  const selectedBankId = form.watch('counterpartyBankAccountId') ?? 0;
  const selectedCp = useMemo(
    () => counterparties.find((c) => c.id === selectedId) ?? null,
    [counterparties, selectedId],
  );
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
    if (isCollective) {
      form.setValue('amount', 0);
      form.setValue('paymentDate', '');
      form.setValue('counterpartyId', 0);
      form.setValue('counterpartyBankAccountId', 0);
      form.setValue('receiverName', '');
      form.setValue('receiverAccountNumber', '');
      setCpBankAccounts([]);
      form.clearErrors(['amount', 'paymentDate', 'receiverName', 'receiverAccountNumber']);
    } else if (!form.getValues('paymentDate')?.trim()) {
      form.setValue('paymentDate', todayGregorianIso());
    }
  }, [isCollective, form]);

  /** با تغییر طرف‌حساب از لیست: نام را پر کنید و شماره حساب را برای ورود مجدد ریست کنید */
  useEffect(() => {
    if (!isIndividual) return;
    form.setValue('counterpartyBankAccountId', 0);
    setCpBankAccounts([]);
    if (selectedCp) {
      form.setValue('receiverName', selectedCp.name);
      form.setValue('receiverAccountNumber', '');
      form.clearErrors('receiverName');
    }
  }, [selectedId, isIndividual, selectedCp, form]);

  /** با انتخاب حساب بانکی از لیست: شماره حساب را پر کنید */
  useEffect(() => {
    if (!isIndividual || !selectedBank) return;
    const num = bankAccountPayoutNumber(selectedBank);
    if (num) {
      form.setValue('receiverAccountNumber', num);
      form.clearErrors('receiverAccountNumber');
    }
  }, [selectedBank, isIndividual, form]);

  useEffect(() => {
    onBusyChange?.(isPending || loadingCp);
  }, [isPending, loadingCp, onBusyChange]);

  const onSubmit = (values: PaymentOrderCreateValues) => {
    if (isCollective && files.length === 0) {
      setFilesError('برای دستور پرداخت جمعی بارگذاری حداقل یک پیوست الزامی است');
      return;
    }
    setFilesError(null);

    startTransition(async () => {
      const result = await createPaymentOrderAction(values, files.length ? files : undefined);
      if (result.success) {
        notifySuccess('دستور پرداخت ثبت شد');
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
        <WorkflowSameAssigneeAlert show={sameAssigneeWarning} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            انفرادی: نام/اشتراک آب و شماره حساب مقصد را وارد کنید (یا از لیست پر کنید). جمعی:{' '}
            <strong>پیوست الزامی</strong> است.
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
          name="paymentOrderKind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع دستور پرداخت</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نوع" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={PaymentOrderKind.INDIVIDUAL}>انفرادی</SelectItem>
                  <SelectItem value={PaymentOrderKind.COLLECTIVE}>جمعی (بدون طرف‌حساب واحد)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isIndividual ? (
          <>
            <FormField
              control={form.control}
              name="counterpartyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>طرف حساب از لیست (اختیاری)</FormLabel>
                  <Select
                    disabled={loadingCp}
                    value={field.value != null && field.value > 0 ? String(field.value) : CP_NONE}
                    onValueChange={(v) => field.onChange(v === CP_NONE ? 0 : Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={loadingCp ? 'در حال بارگذاری…' : 'بدون انتخاب — ورود دستی'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CP_NONE}>بدون انتخاب — ورود دستی</SelectItem>
                      {counterparties.map((cp) => (
                        <SelectItem key={cp.id} value={String(cp.id)}>
                          {cp.name}
                          {cp.companyName ? ` — ${cp.companyName}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    اگر از لیست انتخاب کنید، نام و شماره حساب خودکار پر می‌شوند؛ در غیر این صورت دستی وارد کنید.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedId > 0 ? (
              <FormField
                control={form.control}
                name="counterpartyBankAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حساب بانکی از لیست طرف‌حساب (اختیاری)</FormLabel>
                    <FormControl>
                      <CounterpartyBankAccountSelect
                        counterpartyId={selectedId}
                        value={field.value ?? 0}
                        onChange={field.onChange}
                        onAccountsLoaded={setCpBankAccounts}
                        allowNone
                        autoSelectDefault
                        noneLabel="بدون انتخاب از لیست — ورود دستی شماره حساب"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="receiverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام یا شماره اشتراک آب</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="نام طرف‌حساب یا شماره اشتراک آب"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره حساب</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="شماره حساب / شبا مقصد"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        ) : (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            در دستور پرداخت جمعی طرف‌حساب، حساب مقصد، مبلغ و تاریخ در زمان ثبت مشخص نمی‌شود. فایل
            پیوست (مثلاً لیست پرداخت‌ها) الزامی است.
          </p>
        )}

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

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>روش پرداخت</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب روش پرداخت" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={PaymentMethod.CHECK}>چک</SelectItem>
                  <SelectItem value={PaymentMethod.TRANSFER}>حواله</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مبلغ (ریال)</FormLabel>
                <FormControl>
                  <FormattedNumberInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={isCollective}
                  />
                </FormControl>
                {isCollective ? (
                  <p className="text-xs text-muted-foreground">در دستور جمعی مبلغ از پیوست استخراج می‌شود.</p>
                ) : null}
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
                  <JalaliDateInput value={field.value} onChange={field.onChange} disabled={isCollective} />
                </FormControl>
                {isCollective ? (
                  <p className="text-xs text-muted-foreground">در دستور جمعی تاریخ در زمان ثبت لازم نیست.</p>
                ) : null}
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
              <FormLabel>شرح / توضیحات درخواست‌کننده</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="دلیل درخواست…" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>
            پیوست
            {isCollective ? <span className="text-destructive"> *</span> : null}
            {!isCollective ? ' (اختیاری)' : ''}
          </FormLabel>
          <AttachmentFileInput
            files={files}
            onFilesChange={(next) => {
              setFiles(next);
              if (next.length > 0) setFilesError(null);
            }}
          />
          {filesError ? <p className="text-sm text-destructive">{filesError}</p> : null}
        </div>
      </form>
    </Form>
  );
}

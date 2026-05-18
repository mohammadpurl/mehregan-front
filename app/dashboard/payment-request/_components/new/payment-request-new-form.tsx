'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Form } from '@/app/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { createPaymentRequestAction } from '@/app/_actions/payment-request-actions';
import { getProfileAction } from '@/app/_actions/profile-actions';
import type { ProfileDto } from '@/app/_types/profile.types';
import { useFormAction } from '@/app/hooks/use-form-action';
import {
  PaymentRequestEmployeeCreateSchema,
  type PaymentRequestEmployeeCreateValues,
} from '../../_types/payment-request.schema';
import { PaymentRequestType } from '../../_types/payment-request.types';
import { PaymentRequestEmployeeFields } from '../payment-request-employee-fields';
import { PaymentRequestPaymentOrderForm } from './payment-request-payment-order-form';
import { employeeFormToCreatePayload, profileToReceiverAccount } from '../../_utils/payment-request-form.utils';
import { useSessionStore } from '@/app/_store/auth-store';
import { getRequesterIdFromClientSession } from '../../_utils/payment-request-session';
import { WorkflowSameAssigneeAlert } from '@/app/dashboard/workflow/_components/workflow-same-assignee-alert';
import { useWorkflowAssigneesPreviewWarning } from '@/app/dashboard/workflow/_hooks/use-workflow-assignees-preview-warning';
import { todayGregorianIso } from '@/app/utils/jalali-date';

type Props = {
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

type CreateKind = 'loan' | 'advance' | 'payment_order';

const employeeDefaults: PaymentRequestEmployeeCreateValues = {
  type: PaymentRequestType.LOAN,
  paymentDate: todayGregorianIso(),
  reason: '',
  description: '',
  amount: 0,
  cashExpenseCategory: '',
};

/** فرم ثبت درخواست مالی — وام/مساعده یا دستور پرداخت */
export function PaymentRequestNewForm({ formId = 'payment-request-new-form', onSuccess, onBusyChange }: Props) {
  const [kind, setKind] = useState<CreateKind>('loan');
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const session = useSessionStore((s) => s.session);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [orderBusy, setOrderBusy] = useState(false);

  const form = useForm<PaymentRequestEmployeeCreateValues>({
    resolver: zodResolver(PaymentRequestEmployeeCreateSchema),
    defaultValues: employeeDefaults,
  });

  const watchedType = useWatch({ control: form.control, name: 'type' });

  useEffect(() => {
    void (async () => {
      setProfileLoading(true);
      const res = await getProfileAction();
      if (res.success && res.data) setProfile(res.data);
      setProfileLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (kind === 'loan') form.setValue('type', PaymentRequestType.LOAN);
    if (kind === 'advance') form.setValue('type', PaymentRequestType.ADVANCE);
  }, [kind, form]);

  useEffect(() => {
    onBusyChange?.(kind === 'payment_order' ? orderBusy : isPending || profileLoading);
  }, [isPending, profileLoading, orderBusy, kind, onBusyChange]);

  const receiverPreview = profile ? profileToReceiverAccount(profile) : null;
  const sameAssigneeWarning = useWorkflowAssigneesPreviewWarning('payment_request', profile?.id ?? null);

  const onSubmitEmployee = async (values: PaymentRequestEmployeeCreateValues) => {
    if (!profile) {
      notifyError('اطلاعات پروفایل بارگذاری نشد');
      return;
    }
    const requesterId = getRequesterIdFromClientSession(session);
    const requesterName = session?.fullName ?? session?.userName ?? '';

    const payload = employeeFormToCreatePayload(
      values,
      profile,
      requesterId,
      requesterName,
      files.length ? files : undefined,
    );
    if (!payload.ok) {
      notifyError(payload.error);
      return;
    }

    startTransition(async () => {
      const result = await createPaymentRequestAction(payload.data);
      if (result.success) {
        notifySuccess('درخواست مالی ثبت شد');
        if (result.attachmentError) notifyError(`پیوست: ${result.attachmentError}`);
        onSuccess?.();
      } else {
        notifyError(result.error || 'ثبت ناموفق بود');
      }
    });
  };

  if (kind === 'payment_order') {
    return (
      <PaymentRequestPaymentOrderForm formId={formId} onSuccess={onSuccess} onBusyChange={setOrderBusy} />
    );
  }

  return (
    <div className="space-y-4">
      <WorkflowSameAssigneeAlert show={sameAssigneeWarning} />
      <div className="space-y-2">
        <Label>نوع درخواست</Label>
        <Select value={kind} onValueChange={(v) => setKind(v as CreateKind)}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="loan">وام</SelectItem>
            <SelectItem value="advance">مساعده</SelectItem>
            <SelectItem value="payment_order">دستور پرداخت</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Form {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmitEmployee)} className="space-y-5">
          {profileLoading ? (
            <p className="text-sm text-muted-foreground">در حال بارگذاری پروفایل…</p>
          ) : receiverPreview && !receiverPreview.ok ? (
            <Alert variant="destructive">
              <AlertTitle>حساب واریز در پروفایل تکمیل نیست</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{receiverPreview.error}</p>
                <Link href="/dashboard/profile" className="text-sm font-medium underline">
                  رفتن به پروفایل من
                </Link>
              </AlertDescription>
            </Alert>
          ) : (
            <PaymentRequestEmployeeFields
              control={form.control}
              loanAdvanceOnly
              fixedType={kind === 'loan' ? PaymentRequestType.LOAN : PaymentRequestType.ADVANCE}
              receiverBanner={
                receiverPreview?.ok
                  ? {
                      title: 'حساب واریز (از پروفایل شما)',
                      lines: [
                        `صاحب حساب: ${receiverPreview.receiver.name}`,
                        `شماره واریز: ${receiverPreview.receiver.accountNumber}`,
                      ],
                    }
                  : undefined
              }
              onFilesChange={setFiles}
            />
          )}
        </form>
      </Form>
    </div>
  );
}

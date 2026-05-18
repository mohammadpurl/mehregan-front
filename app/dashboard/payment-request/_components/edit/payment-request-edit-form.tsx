'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { useSessionStore } from '@/app/_store/auth-store';
import { getPaymentRequestAction } from '@/app/_actions/payment-request-actions';
import type { PaymentRequestResponse } from '../../_types/payment-request.types';
import { canEmployeeEditOwn } from '../../_utils/payment-request-form.utils';
import { isPaymentRequestOwner } from '../../_utils/payment-request-session';
import { PaymentRequestAccountDetailsPanel } from '../payment-request-account-details-panel';
import { PaymentRequestEmployeeEditForm } from './payment-request-employee-edit-form';

type Props = {
  record: PaymentRequestResponse;
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

/**
 * ویرایش درخواست — فقط برای درخواست‌کننده (همان فیلدهای ثبت).
 * تأیید و شرایط وام در کارتابل workflow انجام می‌شود.
 */
export function PaymentRequestEditForm(props: Props) {
  const { record } = props;
  const session = useSessionStore((s) => s.session);
  const isOwner = isPaymentRequestOwner(record, session);
  const canEdit = canEmployeeEditOwn({ status: record.status, isOwner, fromOwnList: true });
  const [detail, setDetail] = useState<PaymentRequestResponse>(record);

  useEffect(() => {
    setDetail(record);
    if (!record.id) return;
    void getPaymentRequestAction(record.id).then((r) => {
      if (r.success && r.data) setDetail(r.data);
    });
  }, [record]);

  if (canEdit) {
    return <PaymentRequestEmployeeEditForm {...props} record={detail} />;
  }

  return (
    <div className="space-y-4">
      <PaymentRequestAccountDetailsPanel record={detail} />
      <Alert>
        <AlertTitle>قابل ویرایش نیست</AlertTitle>
        <AlertDescription>
          {record.status !== 'pending'
            ? `درخواست در وضعیت «${record.status}» است.`
            : 'فقط درخواست‌کننده می‌تواند قبل از تأیید مدیر، درخواست را ویرایش کند. برای تأیید از کارتابل استفاده کنید.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}

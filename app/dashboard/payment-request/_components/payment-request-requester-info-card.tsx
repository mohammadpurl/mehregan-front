'use client';

import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import type { PaymentRequestResponse } from '../_types/payment-request.types';
import { PaymentRequestType } from '../_types/payment-request.types';
import { formatDepositAccountLines, formatPaymentAccountLines } from '../_utils/payment-request-display.utils';

type Props = {
  record: PaymentRequestResponse;
};

export function PaymentRequestRequesterInfoCard({ record }: Props) {
  const info = record.requesterInfo;
  const displayName =
    info?.displayName ||
    (record.requesterName && record.requesterName !== '—' ? record.requesterName : null) ||
    'نامشخص';

  const isPaymentOrder = record.type === PaymentRequestType.PAYMENT_ORDER;
  const receiverLines = isPaymentOrder
    ? formatDepositAccountLines(record.receiver, record.receiverAccountDetail)
    : formatPaymentAccountLines(record.receiver, record.receiverAccountDetail);
  const partyName =
    record.counterparty?.name?.trim() ||
    (isPaymentOrder &&
    record.receiver?.name &&
    record.receiver.name !== record.receiver.accountNumber
      ? record.receiver.name.trim()
      : '') ||
    '';

  return (
    <Alert className="border-primary/30 bg-primary/5">
      <AlertTitle>درخواست‌کننده: {displayName}</AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        {info?.username && <p>نام کاربری: {info.username}</p>}
        {info?.email && <p>ایمیل: {info.email}</p>}
        {info?.phone && <p>موبایل: {info.phone}</p>}
        {info?.departmentName && <p>واحد سازمانی: {info.departmentName}</p>}
        {info?.managerName && <p>مدیر مستقیم: {info.managerName}</p>}
        {isPaymentOrder && partyName ? (
          <div className="rounded-md border bg-background/80 p-2">
            <p className="mb-1 font-medium">طرف حساب / نام یا اشتراک</p>
            <p className="text-muted-foreground">{partyName}</p>
          </div>
        ) : null}
        <div className="rounded-md border bg-background/80 p-2">
          <p className="mb-1 font-medium">حساب واریز (مقصد)</p>
          {receiverLines.map((line) => (
            <p key={line} className="text-muted-foreground">
              {line}
            </p>
          ))}
        </div>
        {record.requesterId ? (
          <p className="text-xs text-muted-foreground">شناسه کاربر: {record.requesterId}</p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

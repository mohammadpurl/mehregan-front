'use client';

import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import type { PaymentRequestResponse } from '../_types/payment-request.types';
import { PaymentRequestType } from '../_types/payment-request.types';
import { BankAccountDetailAlert } from './bank-account/bank-account-detail-alert';
import {
  formatDepositAccountLines,
  formatPaymentAccountLines,
  isPlaceholderPaymentAccount,
} from '../_utils/payment-request-display.utils';
import { isPaymentRequestPayerUnset } from '../_utils/payment-request-mapper';
import { paymentMethodLabel } from '../_utils/payment-method';

type Props = {
  record: PaymentRequestResponse;
  hidePayerSection?: boolean;
};

export function PaymentRequestAccountDetailsPanel({ record, hidePayerSection = false }: Props) {
  const isPaymentOrder = record.type === PaymentRequestType.PAYMENT_ORDER;
  const receiverLines = isPaymentOrder
    ? formatDepositAccountLines(record.receiver, record.receiverAccountDetail)
    : formatPaymentAccountLines(record.receiver, record.receiverAccountDetail);
  const payerUnset = isPaymentRequestPayerUnset(record);
  const partyName =
    record.counterparty?.name?.trim() ||
    (isPaymentOrder && record.receiver?.name && record.receiver.name !== record.receiver.accountNumber
      ? record.receiver.name.trim()
      : '') ||
    record.receiverAccountDetail?.label?.trim() ||
    '';

  return (
    <div className="space-y-3">
      {isPaymentOrder ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="mb-1 text-sm font-medium">روش پرداخت</p>
          <p className="text-sm text-muted-foreground">{paymentMethodLabel(record.paymentMethod)}</p>
        </div>
      ) : null}

      {isPaymentOrder && partyName ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="mb-1 text-sm font-medium">طرف حساب / نام یا اشتراک</p>
          <p className="text-sm font-medium">{partyName}</p>
          {record.counterparty?.companyName ? (
            <p className="text-xs text-muted-foreground">{record.counterparty.companyName}</p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border bg-muted/20 p-3">
        <p className="mb-2 text-sm font-medium">حساب واریز (مقصد)</p>
        {record.receiverAccountDetail ? (
          <BankAccountDetailAlert
            title=""
            account={record.receiverAccountDetail}
            depositOnly={isPaymentOrder}
          />
        ) : !isPlaceholderPaymentAccount(record.receiver) ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            {receiverLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </div>

      {!hidePayerSection ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="mb-2 text-sm font-medium">حساب مبدأ پرداخت (شرکت)</p>
          {payerUnset ? (
            <Alert variant="default" className="border-amber-200/80 bg-amber-50/50">
              <AlertTitle className="text-sm">هنوز تعیین نشده</AlertTitle>
              <AlertDescription className="text-xs">
                در مرحله تأیید مالی، حساب شرکت برای پرداخت انتخاب می‌شود.
              </AlertDescription>
            </Alert>
          ) : record.payerAccountDetail ? (
            <BankAccountDetailAlert title="" account={record.payerAccountDetail} />
          ) : (
            <div className="space-y-1 text-sm text-muted-foreground">
              {formatPaymentAccountLines(record.payer, record.payerAccountDetail).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

'use client';

import type { PaymentAccount, PaymentRequestRequesterInfo } from '../_types/payment-request.types';
import type { BankAccountDetail } from '../_types/bank-account.types';
import {
  REQUESTER_DESTINATION_ACCOUNT_TITLE,
  formatRequesterDestinationAccountLines,
} from '../_utils/payment-request-display.utils';

type Props = {
  receiver?: PaymentAccount | null;
  receiverAccountDetail?: BankAccountDetail | null;
  requesterInfo?: PaymentRequestRequesterInfo | null;
  requesterName?: string | null;
  className?: string;
  compact?: boolean;
};

/** نمایش برجسته حساب مقصد = حساب خود درخواست‌کننده (وام / مساعده / تنخواه) */
export function RequesterDestinationAccountCard({
  receiver,
  receiverAccountDetail,
  requesterInfo,
  requesterName,
  className,
  compact,
}: Props) {
  const lines = formatRequesterDestinationAccountLines({
    receiver,
    receiverAccountDetail,
    requesterInfo,
    requesterName,
  });

  return (
    <div
      className={
        className ??
        'rounded-lg border-2 border-teal-300/70 bg-teal-50/60 p-3 dark:border-teal-800 dark:bg-teal-950/40'
      }
    >
      <p className={`mb-1 font-semibold text-teal-900 dark:text-teal-100 ${compact ? 'text-xs' : 'text-sm'}`}>
        {REQUESTER_DESTINATION_ACCOUNT_TITLE}
      </p>
      <p className="mb-2 text-xs text-teal-800/80 dark:text-teal-200/80">
        مبلغ به همین حساب واریز می‌شود — در همه مراحل تأیید قابل مشاهده است.
      </p>
      <div className={`space-y-1 ${compact ? 'text-xs' : 'text-sm'} text-foreground`}>
        {lines.map((line) => (
          <p key={line} className="font-medium tabular-nums">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

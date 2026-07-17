'use client';

import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import type { BankAccountDetail } from '../../_types/bank-account.types';
import { bankAccountDepositLines, bankAccountDetailLines } from '../../_utils/bank-account-display';

type Props = {
  title: string;
  account: BankAccountDetail | null | undefined;
  /** اگر true فقط شماره حساب/شبا/کارت — بدون label نام/اشتراک */
  depositOnly?: boolean;
};

export function BankAccountDetailAlert({ title, account, depositOnly = false }: Props) {
  if (!account) return null;
  const lines = depositOnly
    ? bankAccountDepositLines(account)
    : bankAccountDetailLines(account, { includeLabel: false });
  const showLabel = !depositOnly && Boolean(account.label?.trim());
  if (!lines.length && !showLabel) return null;
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-1 text-sm">
        {showLabel ? <p className="font-medium">{account.label!.trim()}</p> : null}
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </AlertDescription>
    </Alert>
  );
}

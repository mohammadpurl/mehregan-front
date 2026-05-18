'use client';

import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import type { BankAccountDetail } from '../../_types/bank-account.types';
import { bankAccountDetailLines } from '../../_utils/bank-account-display';

type Props = {
  title: string;
  account: BankAccountDetail | null | undefined;
};

export function BankAccountDetailAlert({ title, account }: Props) {
  if (!account) return null;
  const lines = bankAccountDetailLines(account);
  if (!lines.length && !account.label) return null;
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-1 text-sm">
        {account.label?.trim() && <p className="font-medium">{account.label.trim()}</p>}
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </AlertDescription>
    </Alert>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { getCounterpartyBankAccountsAction } from '@/app/_actions/counterparty-actions';
import type { CounterpartyBankAccount } from '../../_types/bank-account.types';
import { formatBankAccountLabel } from '../../_utils/bank-account-display';

type Props = {
  counterpartyId: number;
  value: number;
  onChange: (id: number) => void;
  onAccountsLoaded?: (accounts: CounterpartyBankAccount[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function CounterpartyBankAccountSelect({
  counterpartyId,
  value,
  onChange,
  onAccountsLoaded,
  disabled,
  placeholder = 'انتخاب حساب واریز طرف‌حساب',
}: Props) {
  const [accounts, setAccounts] = useState<CounterpartyBankAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!counterpartyId || counterpartyId < 1) {
      setAccounts([]);
      onAccountsLoaded?.([]);
      return;
    }
    void (async () => {
      setLoading(true);
      const res = await getCounterpartyBankAccountsAction(counterpartyId);
      if (res.success) {
        setAccounts(res.data);
        onAccountsLoaded?.(res.data);
        if (!value || value < 1) {
          const def = res.data.find((a) => a.isDefault) ?? res.data[0];
          if (def) onChange(def.id);
        }
      } else {
        setAccounts([]);
        onAccountsLoaded?.([]);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when counterparty changes
  }, [counterpartyId]);

  return (
    <Select
      disabled={disabled || loading || !counterpartyId || accounts.length === 0}
      value={value > 0 ? String(value) : ''}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={
            !counterpartyId
              ? 'ابتدا طرف‌حساب را انتخاب کنید'
              : loading
                ? 'در حال بارگذاری…'
                : accounts.length === 0
                  ? 'حسابی برای این طرف تعریف نشده'
                  : placeholder
          }
        />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((a) => (
          <SelectItem key={a.id} value={String(a.id)}>
            {formatBankAccountLabel(a)}
            {a.isDefault ? ' (پیش‌فرض)' : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

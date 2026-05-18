'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { getCompanyBankAccountsAction } from '@/app/_actions/company-bank-account-actions';
import type { CompanyBankAccount } from '../../_types/bank-account.types';
import { formatBankAccountLabel } from '../../_utils/bank-account-display';

type Props = {
  value: number;
  onChange: (id: number) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function CompanyBankAccountSelect({
  value,
  onChange,
  disabled,
  placeholder = 'انتخاب حساب مبدأ شرکت',
}: Props) {
  const [accounts, setAccounts] = useState<CompanyBankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await getCompanyBankAccountsAction();
      if (res.success) {
        setAccounts(res.data);
        if (!value || value < 1) {
          const def = res.data.find((a) => a.isDefault) ?? res.data[0];
          if (def) onChange(def.id);
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preselect default once on mount
  }, []);

  return (
    <Select
      disabled={disabled || loading || accounts.length === 0}
      value={value > 0 ? String(value) : ''}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={
            loading ? 'در حال بارگذاری…' : accounts.length === 0 ? 'حسابی تعریف نشده' : placeholder
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

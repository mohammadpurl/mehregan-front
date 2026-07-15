import type { BankAccountDetail } from '../_types/bank-account.types';

/** شماره واریز از جزئیات حساب بانکی */
export function bankAccountPayoutNumber(account: BankAccountDetail): string {
  return (
    account.accountNumber?.trim() ||
    account.shebaNumber?.trim() ||
    account.cardNumber?.trim() ||
    ''
  );
}

export function formatBankAccountLabel(account: BankAccountDetail & { id?: number }): string {
  const label = account.label?.trim();
  const bank = account.bankName?.trim();
  const parts: string[] = [];
  if (label) parts.push(label);
  if (bank) parts.push(bank);
  const num =
    account.accountNumber?.trim() ||
    account.shebaNumber?.trim() ||
    account.cardNumber?.trim();
  if (num) parts.push(num);
  if (parts.length) return parts.join(' — ');
  return account.id != null ? `حساب #${account.id}` : 'حساب';
}

export function bankAccountDetailLines(account: BankAccountDetail): string[] {
  const lines: string[] = [];
  if (account.bankName?.trim()) lines.push(`بانک: ${account.bankName.trim()}`);
  if (account.accountNumber?.trim()) lines.push(`حساب: ${account.accountNumber.trim()}`);
  if (account.shebaNumber?.trim()) lines.push(`شبا: ${account.shebaNumber.trim()}`);
  if (account.cardNumber?.trim()) lines.push(`کارت: ${account.cardNumber.trim()}`);
  return lines;
}

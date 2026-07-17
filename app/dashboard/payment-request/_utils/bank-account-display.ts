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

export function bankAccountDetailLines(
  account: BankAccountDetail,
  options?: { includeLabel?: boolean },
): string[] {
  const lines: string[] = [];
  // در حساب واریز فقط شناسه‌های بانکی؛ label (نام/اشتراک) جدا نمایش داده می‌شود
  if (options?.includeLabel && account.label?.trim()) {
    lines.push(account.label.trim());
  }
  if (account.bankName?.trim()) lines.push(`بانک: ${account.bankName.trim()}`);
  if (account.accountNumber?.trim()) lines.push(`حساب: ${account.accountNumber.trim()}`);
  if (account.shebaNumber?.trim()) lines.push(`شبا: ${account.shebaNumber.trim()}`);
  if (account.cardNumber?.trim()) lines.push(`کارت: ${account.cardNumber.trim()}`);
  return lines;
}

/** فقط شماره مقصد واریز (بدون نام/اشتراک) */
export function bankAccountDepositLines(account: BankAccountDetail): string[] {
  return bankAccountDetailLines(account, { includeLabel: false });
}

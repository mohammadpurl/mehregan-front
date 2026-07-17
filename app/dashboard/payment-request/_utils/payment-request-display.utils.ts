import type { BankAccountDetail } from '../_types/bank-account.types';
import type { PaymentAccount, PaymentRequestRequesterInfo } from '../_types/payment-request.types';
import { bankAccountDepositLines, bankAccountDetailLines } from './bank-account-display';
import {
  PAYMENT_PAYER_PENDING_ACCOUNT,
  PAYMENT_PAYER_PENDING_NAME,
} from '../_types/payment-request.types';

export function isPlaceholderPaymentAccount(account: PaymentAccount): boolean {
  const name = account.name.trim();
  const num = account.accountNumber.trim();
  return (
    !name ||
    !num ||
    name === '—' ||
    num === '—' ||
    name === PAYMENT_PAYER_PENDING_NAME ||
    num === PAYMENT_PAYER_PENDING_ACCOUNT ||
    (name === num && name.length < 3)
  );
}

/** خطوط نمایش حساب مبدأ/مقصد — برای مبدأ می‌توان label داشت؛ برای مقصد واریز فقط شماره */
export function formatPaymentAccountLines(
  account: PaymentAccount,
  detail?: BankAccountDetail | null,
  options?: { depositOnly?: boolean },
): string[] {
  if (detail) {
    const lines = options?.depositOnly
      ? bankAccountDepositLines(detail)
      : bankAccountDetailLines(detail, { includeLabel: true });
    if (lines.length) return lines;
  }
  if (isPlaceholderPaymentAccount(account)) {
    return ['در پروفایل کاربر یا درخواست ثبت نشده'];
  }
  const lines: string[] = [];
  const name = account.name.trim();
  const num = account.accountNumber.trim();
  if (!options?.depositOnly && name && name !== num && name !== '—') {
    lines.push(name);
  }
  if (num && num !== '—') {
    lines.push(options?.depositOnly ? num : `شماره: ${num}`);
  }
  return lines.length ? lines : ['—'];
}

/** فقط شماره حساب مقصد واریز */
export function formatDepositAccountLines(
  account: PaymentAccount,
  detail?: BankAccountDetail | null,
): string[] {
  return formatPaymentAccountLines(account, detail, { depositOnly: true });
}

export function formatRequesterSummary(info: PaymentRequestRequesterInfo | null | undefined): string {
  if (!info) return '—';
  const parts = [info.displayName];
  if (info.username) parts.push(`(${info.username})`);
  if (info.departmentName) parts.push(`— ${info.departmentName}`);
  return parts.join(' ');
}

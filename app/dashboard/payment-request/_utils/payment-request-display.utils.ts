import type { BankAccountDetail } from '../_types/bank-account.types';
import type {
  PaymentAccount,
  PaymentRequestRequesterInfo,
} from '../_types/payment-request.types';
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

/**
 * حساب مقصد واریز برای وام / مساعده / تنخواه = حساب خود درخواست‌کننده.
 * اولویت: جزئیات حساب درخواست → receiver → شبا/کارت پروفایل (requesterInfo).
 */
export function formatRequesterDestinationAccountLines(input: {
  receiver?: PaymentAccount | null;
  receiverAccountDetail?: BankAccountDetail | null;
  requesterInfo?: PaymentRequestRequesterInfo | null;
  requesterName?: string | null;
}): string[] {
  const detail = input.receiverAccountDetail;
  const receiver = input.receiver ?? { name: '', accountNumber: '' };
  const info = input.requesterInfo;

  const lines: string[] = [];
  const owner =
    detail?.label?.trim() ||
    info?.displayName?.trim() ||
    (input.requesterName && input.requesterName !== '—' ? input.requesterName.trim() : '') ||
    (receiver.name &&
    !isPlaceholderPaymentAccount(receiver) &&
    receiver.name !== receiver.accountNumber
      ? receiver.name.trim()
      : '');

  if (owner) lines.push(`صاحب حساب: ${owner}`);

  const sheba =
    detail?.shebaNumber?.trim() ||
    info?.shebaNumber?.trim() ||
    (receiver.accountNumber?.toUpperCase().startsWith('IR')
      ? receiver.accountNumber.trim()
      : '');
  const card =
    detail?.cardNumber?.trim() ||
    info?.cardNumber?.trim() ||
    (!sheba && receiver.accountNumber && !isPlaceholderPaymentAccount(receiver)
      ? receiver.accountNumber.trim()
      : '');
  const accountNo = detail?.accountNumber?.trim() || '';

  if (sheba) lines.push(`شبا: ${sheba}`);
  if (card) lines.push(`کارت: ${card}`);
  if (accountNo && accountNo !== sheba && accountNo !== card) {
    lines.push(`شماره حساب: ${accountNo}`);
  }

  if (lines.length > (owner ? 1 : 0)) return lines;

  const fallback = formatPaymentAccountLines(receiver, detail);
  if (fallback.length && fallback[0] !== 'در پروفایل کاربر یا درخواست ثبت نشده') {
    return owner ? [`صاحب حساب: ${owner}`, ...fallback] : fallback;
  }

  return ['حساب مقصد در پروفایل درخواست‌کننده ثبت نشده است'];
}

/** عنوان ثابت برای نمایش در همه مراحل تأیید */
export const REQUESTER_DESTINATION_ACCOUNT_TITLE =
  'حساب مقصد (حساب خود درخواست‌کننده)';

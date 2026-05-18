import { paymentTypeLabel } from '@/app/dashboard/payment-request/_utils/payment-type-labels';
import type { PaymentRequestResponse } from '@/app/dashboard/payment-request/_types/payment-request.types';
import type { PettyCashResponse } from '@/app/dashboard/petty-cash/_types/petty-cash.types';
import { pettyCashSettlementLabel, pettyCashStatusLabel } from '@/app/dashboard/petty-cash/_utils/petty-cash-labels';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { formatAmount } from '@/app/utils/number-format';
import {
  formatPaymentAccountLines,
  formatRequesterSummary,
} from '@/app/dashboard/payment-request/_utils/payment-request-display.utils';

export type ResolvedWorkflowForm = {
  refType: WorkflowBusinessRefType;
  refId: number;
  label: string;
  summary: Record<string, string>;
  raw: unknown;
};

const REF_LABELS: Record<WorkflowBusinessRefType, string> = {
  workflow_form: 'فرم گردش‌کار',
  payment_request: 'درخواست پرداخت',
  petty_cash: 'تنخواه',
  warehouse_form: 'فرم انبار',
  request: 'درخواست خرید/انبار',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'در انتظار تأیید',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  paid: 'پرداخت شده',
};

/** ساخت خلاصه درخواست مالی برای نمایش در کارتابل (بدون server action) */
export function buildPaymentRequestResolved(
  refType: WorkflowBusinessRefType,
  refId: number,
  data: PaymentRequestResponse,
): ResolvedWorkflowForm {
  const summary: Record<string, string> = {
    نوع: paymentTypeLabel(data.type),
    مبلغ: formatAmount(data.amount, { unit: 'ریال' }),
    'درخواست‌کننده': formatRequesterSummary(data.requesterInfo) || data.requesterName || '—',
    دلیل: data.reason || '—',
    وضعیت: PAYMENT_STATUS_LABEL[data.status] ?? data.status,
    'تاریخ پرداخت': formatJalaliDate(data.paymentDate),
    'حساب واریز': formatPaymentAccountLines(data.receiver, data.receiverAccountDetail).join(' — '),
  };
  if (data.requesterInfo?.departmentName) {
    summary['واحد سازمانی'] = data.requesterInfo.departmentName;
  }
  if (data.requesterInfo?.username) {
    summary['نام کاربری'] = data.requesterInfo.username;
  }
  if (data.counterparty?.name) {
    summary['طرف‌حساب'] = data.counterparty.name;
  }
  if (data.receiverAccountDetail) {
    const r = data.receiverAccountDetail;
    const recv =
      [r.label, r.bankName, r.accountNumber || r.shebaNumber || r.cardNumber].filter(Boolean).join(' — ') ||
      `${data.receiver.name} — ${data.receiver.accountNumber}`;
    summary['حساب واریز'] = recv;
  }
  if (data.payerAccountDetail) {
    const p = data.payerAccountDetail;
    summary['حساب مبدأ'] =
      [p.label, p.bankName, p.accountNumber || p.shebaNumber || p.cardNumber].filter(Boolean).join(' — ') ||
      `${data.payer.name} — ${data.payer.accountNumber}`;
  } else if (data.payer?.accountNumber && data.payer.accountNumber !== '0000000000000') {
    summary['حساب مبدأ'] = `${data.payer.name} — ${data.payer.accountNumber}`;
  }
  if (data.installmentCount != null) {
    summary['تعداد اقساط'] = String(data.installmentCount);
  }
  if (data.firstInstallmentDate) {
    summary['شروع قسط اول'] = formatJalaliDate(data.firstInstallmentDate);
  }
  if (data.settlementDate) {
    summary['تاریخ تسویه'] = formatJalaliDate(data.settlementDate);
  }
  return {
    refType,
    refId,
    label: REF_LABELS[refType],
    summary,
    raw: data,
  };
}

export function buildPettyCashResolved(
  refType: WorkflowBusinessRefType,
  refId: number,
  data: PettyCashResponse,
): ResolvedWorkflowForm {
  return {
    refType,
    refId,
    label: REF_LABELS[refType],
    summary: {
      مبلغ: formatAmount(data.amount, { unit: 'ریال' }),
      شرح: data.reason || '—',
      وضعیت: pettyCashStatusLabel(data.status),
      تسویه: pettyCashSettlementLabel(data.settlementStatus),
      'درخواست‌کننده': data.requesterName || '—',
      تاریخ: data.createdAt ? formatJalaliDate(data.createdAt) : '—',
    },
    raw: data,
  };
}

export { REF_LABELS };

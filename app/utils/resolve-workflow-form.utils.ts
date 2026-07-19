import { paymentTypeLabel } from '@/app/dashboard/payment-request/_utils/payment-type-labels';
import type { PaymentRequestResponse } from '@/app/dashboard/payment-request/_types/payment-request.types';
import type { PettyCashResponse } from '@/app/dashboard/petty-cash/_types/petty-cash.types';
import type { MissionRequestResponse } from '@/app/dashboard/mission-requests/_types/mission-request.types';
import { missionStatusLabel } from '@/app/dashboard/mission-requests/_utils/mission-request-labels';
import { pettyCashSettlementLabel, pettyCashStatusLabel } from '@/app/dashboard/petty-cash/_utils/petty-cash-labels';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { formatAmount } from '@/app/utils/number-format';
import {
  REQUESTER_DESTINATION_ACCOUNT_TITLE,
  formatDepositAccountLines,
  formatPaymentAccountLines,
  formatRequesterDestinationAccountLines,
  formatRequesterSummary,
} from '@/app/dashboard/payment-request/_utils/payment-request-display.utils';
import { PaymentRequestType } from '@/app/dashboard/payment-request/_types/payment-request.types';

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
  payment_order: 'دستور پرداخت',
  financial_document: 'سند مالی',
  petty_cash: 'تنخواه',
  petty_cash_settlement: 'تأیید خرج تنخواه',
  mission_request: 'درخواست ماموریت',
  mission_report: 'تأیید گزارش ماموریت',
  warehouse_form: 'فرم انبار',
  request: 'درخواست خرید',
  purchase_request: 'درخواست خرید کالا',
  procurement_proforma: 'پیش‌فاکتور خرید',
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
  const isOrder = data.type === PaymentRequestType.PAYMENT_ORDER || refType === 'payment_order';
  const isRequesterDestination =
    data.type === PaymentRequestType.LOAN ||
    data.type === PaymentRequestType.ADVANCE ||
    data.type === PaymentRequestType.CASH;
  const depositLines = isOrder
    ? formatDepositAccountLines(data.receiver, data.receiverAccountDetail)
    : isRequesterDestination
      ? formatRequesterDestinationAccountLines({
          receiver: data.receiver,
          receiverAccountDetail: data.receiverAccountDetail,
          requesterInfo: data.requesterInfo,
          requesterName: data.requesterName,
        })
      : formatPaymentAccountLines(data.receiver, data.receiverAccountDetail);
  const partyLabel =
    data.counterparty?.name?.trim() ||
    (isOrder && data.receiver?.name && data.receiver.name !== data.receiver.accountNumber
      ? data.receiver.name.trim()
      : '') ||
    '';

  const orderKind = data.paymentOrderKind;
  const summary: Record<string, string> = {
    نوع: paymentTypeLabel(data.type),
    ...(orderKind
      ? {
          'نوع دستور': orderKind === 'collective' ? 'جمعی' : 'انفرادی',
        }
      : {}),
    مبلغ: formatAmount(data.amount, { unit: 'ریال' }),
    'درخواست‌کننده': formatRequesterSummary(data.requesterInfo) || data.requesterName || '—',
    دلیل: data.reason || '—',
    وضعیت: PAYMENT_STATUS_LABEL[data.status] ?? data.status,
    'تاریخ پرداخت': formatJalaliDate(data.paymentDate),
    [isRequesterDestination ? REQUESTER_DESTINATION_ACCOUNT_TITLE : 'حساب واریز']:
      depositLines.join(' — '),
  };
  if (data.requesterInfo?.departmentName) {
    summary['واحد سازمانی'] = data.requesterInfo.departmentName;
  }
  if (data.requesterInfo?.username) {
    summary['نام کاربری'] = data.requesterInfo.username;
  }
  if (partyLabel) {
    summary['طرف‌حساب'] = partyLabel;
  } else if (orderKind === 'collective') {
    summary['طرف‌حساب'] = '— (پرداخت جمعی)';
  }
  if (data.paymentMarkedAt) {
    summary['ثبت در سپیدار (کارشناس)'] = formatJalaliDate(data.paymentMarkedAt);
  }
  if (data.sepidarConfirmedAt) {
    summary['تأیید ثبت سپیدار (سرپرست)'] = formatJalaliDate(data.sepidarConfirmedAt);
  }
  if (isRequesterDestination) {
    summary[REQUESTER_DESTINATION_ACCOUNT_TITLE] = depositLines.join(' — ') || '—';
  } else if (data.receiverAccountDetail && !isOrder) {
    const r = data.receiverAccountDetail;
    const recv =
      [r.label, r.bankName, r.accountNumber || r.shebaNumber || r.cardNumber].filter(Boolean).join(' — ') ||
      `${data.receiver.name} — ${data.receiver.accountNumber}`;
    summary['حساب واریز'] = recv;
  } else if (isOrder) {
    summary['حساب واریز'] = depositLines.join(' — ') || '—';
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
  const destinationLines = formatRequesterDestinationAccountLines({
    requesterInfo: data.requesterInfo,
    requesterName: data.requesterName,
  });
  return {
    refType,
    refId,
    label: REF_LABELS[refType],
    summary: {
      مبلغ: formatAmount(data.amount, { unit: 'ریال' }),
      شرح: data.reason || '—',
      وضعیت: pettyCashStatusLabel(data.status),
      تسویه: pettyCashSettlementLabel(data.settlementStatus),
      'درخواست‌کننده': data.requesterName || data.requesterInfo?.displayName || '—',
      [REQUESTER_DESTINATION_ACCOUNT_TITLE]: destinationLines.join(' — '),
      تاریخ: data.createdAt ? formatJalaliDate(data.createdAt) : '—',
      ...(data.sepidarRegisteredAt
        ? { 'ثبت در سپیدار (کارشناس)': formatJalaliDate(data.sepidarRegisteredAt) }
        : {}),
      ...(data.sepidarConfirmedAt
        ? { 'تأیید ثبت سپیدار (سرپرست)': formatJalaliDate(data.sepidarConfirmedAt) }
        : {}),
    },
    raw: data,
  };
}

export function buildMissionRequestResolved(
  refType: WorkflowBusinessRefType,
  refId: number,
  data: MissionRequestResponse,
): ResolvedWorkflowForm {
  return {
    refType,
    refId,
    label: REF_LABELS[refType],
    summary: {
      'محل ماموریت': data.destination,
      'وسیله نقلیه': data.vehicle,
      دلیل: data.reason || '—',
      وضعیت: missionStatusLabel(data.status),
      'درخواست‌کننده': data.requesterName || '—',
      تاریخ: data.createdAt ? formatJalaliDate(data.createdAt) : '—',
      ...(data.reportText ? { 'گزارش ماموریت': data.reportText } : {}),
      ...(data.reportedAt
        ? { 'تاریخ ثبت گزارش': formatJalaliDate(data.reportedAt) }
        : {}),
    },
    raw: data,
  };
}

export { REF_LABELS };

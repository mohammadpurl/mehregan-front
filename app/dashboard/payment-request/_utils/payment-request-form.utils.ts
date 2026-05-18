import type { ProfileDto } from '@/app/_types/profile.types';
import { profileDisplayName, profilePayoutAccountNumber } from '@/app/utils/profile-bank';
import type { PaymentRequestFormData, PaymentRequestResponse } from '../_types/payment-request.types';
import {
  PAYMENT_PAYER_PENDING_ACCOUNT,
  PAYMENT_PAYER_PENDING_NAME,
  PaymentRequestType,
} from '../_types/payment-request.types';
import type {
  PaymentRequestApproverReviewValues,
  PaymentRequestEmployeeCreateValues,
} from '../_types/payment-request.schema';
import {
  employeeValuesToLoanAdvanceBody,
  isAdvanceTermsUnset,
  isLoanTermsUnset,
  isPaymentRequestPayerUnset,
  isPayerUnset,
} from './payment-request-mapper';

export function profileToReceiverAccount(profile: ProfileDto): { ok: true; receiver: { name: string; accountNumber: string } } | { ok: false; error: string } {
  const holder = profileDisplayName(profile);
  const number = profilePayoutAccountNumber(profile);
  if (!holder || holder.length < 2) {
    return { ok: false, error: 'در پروفایل، نام و نام خانوادگی را تکمیل کنید.' };
  }
  if (number.length < 10) {
    return { ok: false, error: 'در پروفایل، حداقل یکی از «شماره شبا» یا «شماره کارت» را وارد کنید.' };
  }
  return { ok: true, receiver: { name: holder, accountNumber: number } };
}

export function employeeFormToCreatePayload(
  values: PaymentRequestEmployeeCreateValues,
  profile: ProfileDto,
  requesterId: string,
  requesterName?: string,
  documents?: File[],
): { ok: true; data: PaymentRequestFormData } | { ok: false; error: string } {
  const receiverResult = profileToReceiverAccount(profile);
  if (!receiverResult.ok) return receiverResult;

  const isCash = values.type === PaymentRequestType.CASH;

  return {
    ok: true,
    data: {
      type: values.type,
      payer: { name: PAYMENT_PAYER_PENDING_NAME, accountNumber: PAYMENT_PAYER_PENDING_ACCOUNT },
      receiver: receiverResult.receiver,
      paymentDate: values.paymentDate,
      reason: values.reason,
      description: values.description?.trim() || undefined,
      amount: values.amount,
      cashExpenseCategory: isCash ? values.cashExpenseCategory : undefined,
      documents,
      requesterId,
      requesterName,
    },
  };
}

export function employeeFormToUpdatePayload(
  values: PaymentRequestEmployeeCreateValues,
  record: PaymentRequestResponse,
): Partial<PaymentRequestFormData> {
  if (record.type === PaymentRequestType.LOAN || record.type === PaymentRequestType.ADVANCE) {
    const body = employeeValuesToLoanAdvanceBody(values);
    return {
      type: record.type,
      amount: body.amount,
      paymentDate: body.payment_date ?? '',
      reason: body.reason ?? '',
    };
  }

  const isCash = values.type === PaymentRequestType.CASH;
  return {
    type: values.type,
    paymentDate: values.paymentDate,
    reason: values.reason,
    description: values.description?.trim() || undefined,
    amount: values.amount,
    cashExpenseCategory: isCash ? values.cashExpenseCategory : undefined,
  };
}

export function approverReviewToUpdatePayload(
  record: PaymentRequestResponse,
  values: PaymentRequestApproverReviewValues,
  options: {
    needsLoan: boolean;
    needsAdvance: boolean;
    needsPayer: boolean;
  },
): Partial<PaymentRequestFormData> {
  const patch: Partial<PaymentRequestFormData> = {
    type: record.type,
    reason: record.reason,
  };
  if (options.needsPayer && values.payerCompanyAccountId) {
    patch.payerCompanyAccountId = values.payerCompanyAccountId;
  } else if (options.needsPayer && values.payer) {
    patch.payer = values.payer;
  }
  if (options.needsLoan) {
    patch.loanInstallmentCount = values.loanInstallmentCount;
    patch.loanFirstInstallmentDate = values.loanFirstInstallmentDate;
  }
  if (options.needsAdvance) {
    patch.advanceExpectedRepaymentDate = values.advanceExpectedRepaymentDate;
  }
  return patch;
}

export function canAssignPayer(params: {
  isFinance: boolean;
  status: string;
  payerUnset: boolean;
}): boolean {
  return params.isFinance && params.status === 'pending' && params.payerUnset;
}

export function canEmployeeEditOwn(params: {
  status: string;
  isOwner: boolean;
  /** لیست درخواست‌ها فقط رکوردهای خود کاربر را برمی‌گرداند */
  fromOwnList?: boolean;
}): boolean {
  if (params.status !== 'pending') return false;
  if (params.fromOwnList) return true;
  return params.isOwner;
}

export function needsApproverReview(params: {
  isApprover: boolean;
  isFinance: boolean;
  /** مرحلهٔ جاری workflow نقش مالی است (حتی اگر نقش session متفاوت باشد) */
  isFinanceStep?: boolean;
  status: string;
  record: PaymentRequestResponse;
  payerUnset: boolean;
}): boolean {
  if (!params.isApprover || params.status !== 'pending') return false;
  const financeCtx = params.isFinance || params.isFinanceStep;
  if (params.record.type === PaymentRequestType.LOAN && isLoanTermsUnset(params.record)) return true;
  if (params.record.type === PaymentRequestType.ADVANCE && isAdvanceTermsUnset(params.record)) return true;
  if (params.record.type === PaymentRequestType.PAYMENT_ORDER && financeCtx && params.payerUnset) return true;
  if (financeCtx && params.payerUnset) return true;
  return false;
}

export { isPayerUnset, isPaymentRequestPayerUnset, isLoanTermsUnset, isAdvanceTermsUnset };

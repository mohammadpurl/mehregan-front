/**
 * Types for payment requests (درخواست‌های مالی) — فقط این ماژول
 */

import type { Counterparty } from './counterparty.types';
import type { BankAccountDetail } from './bank-account.types';

export enum PaymentRequestType {
  LOAN = 'loan',
  ADVANCE = 'advance',
  /** دستور پرداخت به طرف‌حساب */
  PAYMENT_ORDER = 'payment_order',
  /** پرداخت ناشی از درخواست خرید (تدارکات) */
  PROCUREMENT = 'procurement',
  CASH = 'cash',
  /** @deprecated — از payment_order استفاده کنید */
  PAYMENT = 'payment',
  OTHER = 'other',
}

export type { Counterparty } from './counterparty.types';

export interface PaymentAccount {
  name: string;
  accountNumber: string;
}

/** اطلاع تکمیلی درخواست‌کننده برای نمایش تأییدکننده */
export interface PaymentRequestRequesterInfo {
  displayName: string;
  username?: string;
  email?: string;
  phone?: string;
  departmentName?: string;
  managerName?: string;
  shebaNumber?: string;
  cardNumber?: string;
}

export interface PaymentAttachment {
  id?: string | number;
  fileName?: string;
  fileUrl?: string;
}

export interface PaymentRequestFormData {
  id?: string;
  type: PaymentRequestType;
  payer: PaymentAccount;
  receiver: PaymentAccount;
  payerCompanyAccountId?: number | null;
  receiverCounterpartyAccountId?: number | null;
  paymentDate: string;
  reason: string;
  description?: string;
  amount: number;
  documents?: File[];
  documentsUrls?: string[];
  requesterId: string;
  requesterName?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt?: string;
  updatedAt?: string;
  loanInstallmentCount?: number;
  loanFirstInstallmentDate?: string;
  advanceExpectedRepaymentDate?: string;
  cashExpenseCategory?: string;
}

export type PaymentMethodType = 'check' | 'transfer';

export type PaymentOrderKindType = 'individual' | 'collective';

export interface PaymentRequestResponse {
  id: string;
  paymentMethod?: PaymentMethodType | null;
  paymentOrderKind?: PaymentOrderKindType | null;
  paymentMarkedAt?: string | null;
  counterpartyId?: number | null;
  counterparty?: Counterparty | null;
  payerCompanyAccountId?: number | null;
  receiverCounterpartyAccountId?: number | null;
  payerAccountDetail?: BankAccountDetail | null;
  receiverAccountDetail?: BankAccountDetail | null;
  type: PaymentRequestType;
  payer: PaymentAccount;
  receiver: PaymentAccount;
  paymentDate: string;
  reason: string;
  description?: string;
  amount: number;
  documentsUrls: string[];
  attachments?: PaymentAttachment[];
  attachmentCount?: number;
  requesterId: string;
  requesterName: string;
  requesterInfo?: PaymentRequestRequesterInfo | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  workflowInstanceId?: string | number | null;
  /** ستون‌های بک‌اند — فقط تأییدکننده در workflow پر می‌کند */
  installmentCount?: number | null;
  firstInstallmentDate?: string | null;
  settlementDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequestListResponse {
  items: PaymentRequestResponse[];
  total: number;
  page: number;
  pageSize: number;
}

/** حساب مبدأ قبل از تعیین توسط مدیر مالی */
export const PAYMENT_PAYER_PENDING_NAME = 'تعیین نشده';
export const PAYMENT_PAYER_PENDING_ACCOUNT = '0000000000000';

import type { BankAccountDetail } from '../_types/bank-account.types';
import type { Counterparty } from '../_types/counterparty.types';
import type { PaymentAccount, PaymentAttachment, PaymentRequestFormData, PaymentRequestResponse } from '../_types/payment-request.types';
import { formatBankAccountLabel } from './bank-account-display';
import {
  PaymentRequestType,
  PAYMENT_PAYER_PENDING_ACCOUNT,
  PAYMENT_PAYER_PENDING_NAME,
} from '../_types/payment-request.types';
import type { PaymentRequestEmployeeCreateValues } from '../_types/payment-request.schema';
import { formatJalaliDateForStorage } from '@/app/utils/jalali-date';

const META_BLOCK = '\n\n--- جزئیات فرم (سیستمی) ---\n';

/** فشرده‌سازی حساب برای APIهایی با فیلد تک‌رشته‌ای محدود (مثل Backend2). */
export function formatAccountField(account: PaymentAccount): string {
  const name = account.name.trim();
  const num = account.accountNumber.trim();
  const s = `${name} | ${num}`;
  return s.length <= 100 ? s : s.slice(0, 97) + '...';
}

function parseAccountField(value: unknown): PaymentAccount | null {
  if (value && typeof value === 'object' && 'name' in value && 'accountNumber' in value) {
    const o = value as PaymentAccount;
    return { name: String(o.name ?? ''), accountNumber: String(o.accountNumber ?? '') };
  }
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return { name: '—', accountNumber: '—' };
  const sep = raw.indexOf(' | ');
  if (sep === -1) return { name: raw, accountNumber: raw };
  return {
    name: raw.slice(0, sep).trim() || '—',
    accountNumber: raw.slice(sep + 3).trim() || '—',
  };
}

export type ExtendedPaymentFields = {
  loanInstallmentCount?: number | null;
  loanFirstInstallmentDate?: string | null;
  advanceExpectedRepaymentDate?: string | null;
  cashExpenseCategory?: string | null;
};

/** رشتهٔ متای سیستمی (بعد از پارس از API معمولاً در description قرار می‌گیرد). */
export function parseExtendedMetaFromDescription(meta: string): ExtendedPaymentFields {
  const ext: ExtendedPaymentFields = {};
  const text = meta?.trim() ?? '';
  if (!text) return ext;

  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.startsWith('تعداد اقساط:')) {
      const n = Number(t.slice('تعداد اقساط:'.length).trim());
      if (Number.isFinite(n)) ext.loanInstallmentCount = n;
    } else if (t.startsWith('تاریخ سررسید اولین قسط:')) {
      ext.loanFirstInstallmentDate = t.slice('تاریخ سررسید اولین قسط:'.length).trim();
    } else if (t.startsWith('تاریخ پیش‌بینی تسویه مساعده:')) {
      ext.advanceExpectedRepaymentDate = t.slice('تاریخ پیش‌بینی تسویه مساعده:'.length).trim();
    } else if (t.startsWith('شرح نوع هزینه / مصرف تنخواه:')) {
      ext.cashExpenseCategory = t.slice('شرح نوع هزینه / مصرف تنخواه:'.length).trim();
    }
  }
  return ext;
}

function parseBankAccountDetail(value: unknown): BankAccountDetail | null {
  if (!value || typeof value !== 'object') return null;
  const r = value as Record<string, unknown>;
  return {
    label: (r.label as string | null | undefined) ?? null,
    bankName: (r.bankName ?? r.bank_name) as string | null | undefined,
    accountNumber: (r.accountNumber ?? r.account_number) as string | null | undefined,
    shebaNumber: (r.shebaNumber ?? r.sheba_number) as string | null | undefined,
    cardNumber: (r.cardNumber ?? r.card_number) as string | null | undefined,
  };
}

export function accountDetailToPaymentAccount(detail: BankAccountDetail | null | undefined): PaymentAccount {
  if (!detail) return { name: '—', accountNumber: '—' };
  const label = formatBankAccountLabel(detail);
  const num =
    detail.accountNumber?.trim() ||
    detail.shebaNumber?.trim() ||
    detail.cardNumber?.trim() ||
    '—';
  return { name: label, accountNumber: num };
}

export function isPayerUnset(
  payer: PaymentAccount,
  payerCompanyAccountId?: number | null,
): boolean {
  if (payerCompanyAccountId != null && payerCompanyAccountId > 0) return false;
  const name = payer.name.trim();
  const num = payer.accountNumber.trim();
  return (
    name === PAYMENT_PAYER_PENDING_NAME ||
    num === PAYMENT_PAYER_PENDING_ACCOUNT ||
    name === '—' ||
    num === '—' ||
    !name ||
    !num
  );
}

export function isPaymentRequestPayerUnset(record: PaymentRequestResponse): boolean {
  return isPayerUnset(record.payer, record.payerCompanyAccountId);
}

function loanTermsFromRecord(record: PaymentRequestResponse) {
  if (record.installmentCount != null || record.firstInstallmentDate) {
    return {
      loanInstallmentCount: record.installmentCount ?? undefined,
      loanFirstInstallmentDate: record.firstInstallmentDate ?? '',
    };
  }
  return parseExtendedMetaFromDescription(record.description ?? '');
}

function advanceTermsFromRecord(record: PaymentRequestResponse) {
  if (record.settlementDate) {
    return { advanceExpectedRepaymentDate: record.settlementDate };
  }
  return parseExtendedMetaFromDescription(record.description ?? '');
}

export function isLoanTermsUnset(record: PaymentRequestResponse): boolean {
  if (record.type !== PaymentRequestType.LOAN) return false;
  const ext = loanTermsFromRecord(record);
  return (
    ext.loanInstallmentCount == null ||
    !Number.isFinite(ext.loanInstallmentCount) ||
    ext.loanInstallmentCount < 1 ||
    !String(ext.loanFirstInstallmentDate ?? '').trim()
  );
}

export function isAdvanceTermsUnset(record: PaymentRequestResponse): boolean {
  if (record.type !== PaymentRequestType.ADVANCE) return false;
  const ext = advanceTermsFromRecord(record);
  return !String(ext.advanceExpectedRepaymentDate ?? '').trim();
}

export function paymentResponseToEmployeeFormValues(r: PaymentRequestResponse): PaymentRequestEmployeeCreateValues {
  const ext = parseExtendedMetaFromDescription(r.description ?? '');
  return {
    type: r.type,
    paymentDate: r.paymentDate,
    reason: r.reason,
    description: '',
    amount: r.amount,
    cashExpenseCategory: ext.cashExpenseCategory ?? '',
  };
}

export function paymentResponseToLoanApproverValues(r: PaymentRequestResponse) {
  const ext = loanTermsFromRecord(r);
  return {
    amount: r.amount,
    paymentDate: r.paymentDate ?? '',
    loanInstallmentCount: ext.loanInstallmentCount ?? undefined,
    loanFirstInstallmentDate: ext.loanFirstInstallmentDate ?? '',
  };
}

export function paymentResponseToAdvanceApproverValues(r: PaymentRequestResponse) {
  const ext = advanceTermsFromRecord(r);
  return {
    amount: r.amount,
    paymentDate: r.paymentDate ?? '',
    advanceExpectedRepaymentDate: ext.advanceExpectedRepaymentDate ?? '',
  };
}

export function paymentResponseToPaymentOrderApproverValues(r: PaymentRequestResponse) {
  return {
    amount: r.amount,
    paymentDate: r.paymentDate ?? '',
    paymentMethod: r.paymentMethod ?? 'transfer',
  };
}

export function mergeReasonWithExtendedMeta(baseReason: string, type: PaymentRequestType, ext: ExtendedPaymentFields): string {
  let meta = '';
  switch (type) {
    case PaymentRequestType.LOAN:
      if (ext.loanInstallmentCount != null && Number.isFinite(ext.loanInstallmentCount)) {
        meta += `تعداد اقساط: ${ext.loanInstallmentCount}\n`;
      }
      if (ext.loanFirstInstallmentDate?.trim()) {
        meta += `تاریخ سررسید اولین قسط: ${formatJalaliDateForStorage(ext.loanFirstInstallmentDate)}\n`;
      }
      break;
    case PaymentRequestType.ADVANCE:
      if (ext.advanceExpectedRepaymentDate?.trim()) {
        meta += `تاریخ پیش‌بینی تسویه مساعده: ${formatJalaliDateForStorage(ext.advanceExpectedRepaymentDate)}\n`;
      }
      break;
    case PaymentRequestType.CASH:
      if (ext.cashExpenseCategory?.trim()) {
        meta += `شرح نوع هزینه / مصرف تنخواه: ${ext.cashExpenseCategory.trim()}\n`;
      }
      break;
    default:
      break;
  }
  if (!meta) return baseReason.trim();
  return `${baseReason.trim()}${META_BLOCK}${meta}`.trim();
}

/** بدنهٔ درخواست برای POST `/payment-requests` (سازگار با Backend2). */
export type PaymentRequestCreateBody = {
  payment_type: string;
  amount: number;
  payer_account: string;
  receiver_account: string;
  payment_date: string | null;
  reason: string | null;
};

export type PaymentRequestPatchBody = Partial<PaymentRequestCreateBody> & {
  payer_company_account_id?: number;
  payment_method?: string;
};

/** POST `/payment-requests/loan` و `/advance` */
export type LoanAdvanceRequestBody = {
  amount: number;
  payment_date: string | null;
  reason: string | null;
  /** کاربر درخواست‌دهنده — برای workflow و submitter_manager */
  requester_id?: number;
};

/** POST `/payment-requests/payment-order` */
export type PaymentOrderRequestBody = {
  payment_order_kind: string;
  counterparty_id?: number;
  counterparty_bank_account_id?: number;
  receiver_name?: string;
  receiver_account_number?: string;
  payer_company_account_id?: number;
  payment_method: string;
  amount: number;
  payment_date: string | null;
  reason: string | null;
};

export function paymentOrderValuesToBody(values: {
  paymentOrderKind: string;
  counterpartyId?: number;
  counterpartyBankAccountId?: number;
  receiverName?: string;
  receiverAccountNumber?: string;
  payerCompanyAccountId?: number;
  paymentMethod: string;
  amount: number;
  paymentDate: string;
  reason: string;
}): PaymentOrderRequestBody {
  const kind = values.paymentOrderKind || 'individual';
  const isCollective = kind === 'collective';
  const body: PaymentOrderRequestBody = {
    payment_order_kind: kind,
    payment_method: values.paymentMethod,
    amount: isCollective ? 0 : values.amount,
    payment_date: isCollective ? null : values.paymentDate?.trim() ? values.paymentDate.trim() : null,
    reason: values.reason?.trim() ? values.reason.trim() : null,
  };
  if (kind === 'individual') {
    const receiverName = values.receiverName?.trim();
    const receiverAccountNumber = values.receiverAccountNumber?.trim();
    if (receiverName) body.receiver_name = receiverName;
    if (receiverAccountNumber) body.receiver_account_number = receiverAccountNumber;
    if (values.counterpartyId != null && values.counterpartyId > 0) {
      body.counterparty_id = values.counterpartyId;
    }
    if (values.counterpartyBankAccountId != null && values.counterpartyBankAccountId > 0) {
      body.counterparty_bank_account_id = values.counterpartyBankAccountId;
    }
  }
  if (values.payerCompanyAccountId != null && values.payerCompanyAccountId > 0) {
    body.payer_company_account_id = values.payerCompanyAccountId;
  }
  return body;
}

export function employeeValuesToLoanAdvanceBody(
  values: Pick<PaymentRequestEmployeeCreateValues, 'amount' | 'paymentDate' | 'reason'>,
  requesterId?: number,
): LoanAdvanceRequestBody {
  const body: LoanAdvanceRequestBody = {
    amount: values.amount,
    payment_date: values.paymentDate?.trim() ? values.paymentDate.trim() : null,
    reason: values.reason?.trim() ? values.reason.trim() : null,
  };
  if (requesterId != null && Number.isFinite(requesterId) && requesterId > 0) {
    body.requester_id = requesterId;
  }
  return body;
}

export function partialFormDataToPatch(data: Partial<PaymentRequestFormData>): PaymentRequestPatchBody {
  const patch: PaymentRequestPatchBody = {};
  if (data.type !== undefined) patch.payment_type = data.type;
  if (data.amount !== undefined) patch.amount = data.amount;
  if (data.paymentMethod) patch.payment_method = data.paymentMethod;
  if (data.payerCompanyAccountId != null && data.payerCompanyAccountId > 0) {
    patch.payer_company_account_id = data.payerCompanyAccountId;
  } else if (data.payer) {
    patch.payer_account = formatAccountField(data.payer);
  }
  if (data.receiver) patch.receiver_account = formatAccountField(data.receiver);
  if (data.paymentDate !== undefined) {
    patch.payment_date = data.paymentDate?.trim() ? data.paymentDate.trim() : null;
  }
  if (data.reason !== undefined) {
    const merged = mergeReasonWithExtendedMeta(String(data.reason), data.type ?? PaymentRequestType.PAYMENT, {
      loanInstallmentCount: data.loanInstallmentCount,
      loanFirstInstallmentDate: data.loanFirstInstallmentDate,
      advanceExpectedRepaymentDate: data.advanceExpectedRepaymentDate,
      cashExpenseCategory: data.cashExpenseCategory,
    });
    patch.reason = merged.trim() ? merged : null;
  }
  return patch;
}

export function formDataToCreateBody(
  data: PaymentRequestFormData,
  extended: ExtendedPaymentFields,
): PaymentRequestCreateBody {
  const reasonMerged = mergeReasonWithExtendedMeta(data.reason ?? '', data.type, extended);
  return {
    payment_type: data.type,
    amount: data.amount,
    payer_account: formatAccountField(data.payer),
    receiver_account: formatAccountField(data.receiver),
    payment_date: data.paymentDate?.trim() ? data.paymentDate.trim() : null,
    reason: reasonMerged.trim() ? reasonMerged : null,
  };
}

/** نرمال‌سازی پاسخ API (صفحات لیست و جزئیات). */
export function normalizePaymentRequestFromApi(raw: unknown): PaymentRequestResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = r.id != null ? String(r.id) : '';

  const typeRaw =
    typeof r.paymentType === 'string'
      ? r.paymentType
      : typeof r.payment_type === 'string'
        ? r.payment_type
        : typeof r.type === 'string'
          ? r.type
          : 'payment';
  const type = normalizePaymentRequestType(typeRaw);

  const amount = coerceNumber(r.amount);
  const paymentDateRaw = r.paymentDate ?? r.payment_date;
  const paymentDate =
    typeof paymentDateRaw === 'string' && paymentDateRaw
      ? paymentDateRaw.includes('T')
        ? paymentDateRaw.split('T')[0]
        : paymentDateRaw
      : new Date().toISOString().split('T')[0];

  const payerCompanyAccountIdRaw = r.payerCompanyAccountId ?? r.payer_company_account_id;
  const payerCompanyAccountId =
    payerCompanyAccountIdRaw != null && Number.isFinite(Number(payerCompanyAccountIdRaw))
      ? Number(payerCompanyAccountIdRaw)
      : null;

  const receiverCounterpartyAccountIdRaw =
    r.receiverCounterpartyAccountId ?? r.receiver_counterparty_account_id;
  const receiverCounterpartyAccountId =
    receiverCounterpartyAccountIdRaw != null && Number.isFinite(Number(receiverCounterpartyAccountIdRaw))
      ? Number(receiverCounterpartyAccountIdRaw)
      : null;

  const nestedRequester = parseNestedRequesterUser(
    r.requester ?? r.submitter ?? r.created_by_user ?? r.createdByUser ?? r.user ?? r.employee,
  );

  const requesterId =
    coerceString(r.requesterId ?? r.requester_id) ||
    nestedRequester?.id ||
    coerceString(r.submitter_id ?? r.submitterId ?? r.user_id ?? r.userId ?? r.created_by) ||
    '';

  const requesterName =
    coerceString(r.requesterName ?? r.requester_name) ||
    nestedRequester?.name ||
    '—';

  const payerAccountDetail = parseBankAccountDetail(r.payerAccountDetail ?? r.payer_account_detail);
  let receiverAccountDetail = parseBankAccountDetail(
    r.receiverAccountDetail ?? r.receiver_account_detail,
  );

  const freeReceiverName = coerceString(r.receiver_name ?? r.receiverName);
  const freeReceiverAcct = coerceString(r.receiver_account_number ?? r.receiverAccountNumber);
  const freeReceiverSheba = coerceString(r.receiver_sheba ?? r.receiverSheba);
  const freeReceiverCard = coerceString(r.receiver_card ?? r.receiverCard);
  const freeDestNumber = freeReceiverAcct || freeReceiverSheba || freeReceiverCard;

  const counterpartyIdRaw = r.counterpartyId ?? r.counterparty_id;
  const counterpartyId =
    counterpartyIdRaw != null && Number.isFinite(Number(counterpartyIdRaw))
      ? Number(counterpartyIdRaw)
      : null;
  const counterparty = normalizeCounterpartyFromApi(r.counterparty);

  const payer =
    payerAccountDetail != null
      ? accountDetailToPaymentAccount(payerAccountDetail)
      : (parseAccountField(r.payer ?? r.payer_account) ?? { name: '—', accountNumber: '—' });

  const detailPayout =
    receiverAccountDetail != null
      ? receiverAccountDetail.accountNumber?.trim() ||
        receiverAccountDetail.shebaNumber?.trim() ||
        receiverAccountDetail.cardNumber?.trim() ||
        ''
      : '';

  let receiver: PaymentAccount | null = null;

  // دستور پرداخت: مقصد = نام/اشتراک + شماره حساب (دستی یا طرف‌حساب).
  // هرگز از receiver_account قدیمی / حساب ثبت‌کننده استفاده نکن.
  if (type === PaymentRequestType.PAYMENT_ORDER) {
    if (freeDestNumber) {
      const holder = freeReceiverName || counterparty?.name?.trim() || '—';
      receiver = { name: holder, accountNumber: freeDestNumber };
      // اگر جزئیات ساختاریافته با همان مقصد هست نگه دار؛ وگرنه از ورود دستی بساز
      const detailMatchesFree =
        Boolean(detailPayout) &&
        detailPayout.replace(/\s/g, '').toLowerCase() ===
          freeDestNumber.replace(/\s/g, '').toLowerCase();
      if (!detailMatchesFree) {
        receiverAccountDetail = {
          label: holder !== '—' ? holder : null,
          bankName: null,
          accountNumber: freeReceiverAcct || null,
          shebaNumber:
            freeReceiverSheba ||
            (freeDestNumber.toUpperCase().startsWith('IR') ? freeDestNumber : null),
          cardNumber: freeReceiverCard || null,
        };
      } else if (receiverAccountDetail) {
        receiver = accountDetailToPaymentAccount(receiverAccountDetail);
      }
    } else if (detailPayout && receiverAccountDetail) {
      receiver = accountDetailToPaymentAccount(receiverAccountDetail);
    } else {
      receiver = { name: '—', accountNumber: '—' };
    }
  } else {
    receiver =
      receiverAccountDetail != null
        ? accountDetailToPaymentAccount(receiverAccountDetail)
        : (parseAccountField(r.receiver ?? r.receiver_account) ?? null);

    if (!receiver || (receiver.name === '—' && receiver.accountNumber === '—')) {
      const num = freeDestNumber;
      const holder = freeReceiverName || nestedRequester?.name || requesterName;
      if (num && holder && holder !== '—') {
        receiver = { name: holder, accountNumber: num };
      } else {
        receiver = receiver ?? { name: '—', accountNumber: '—' };
      }
    }
  }

  const reason = coerceString(r.reason);
  let description = coerceString(r.description);
  let displayReason = reason;
  const idx = reason.indexOf('--- جزئیات فرم (سیستمی) ---');
  if (idx !== -1) {
    displayReason = reason.slice(0, idx).trim();
    const metaPart = reason.slice(idx).replace(/^--- جزئیات فرم \(سیستمی\) ---\s*/m, '').trim();
    if (metaPart && !description) description = metaPart;
  }

  const status = normalizeStatus(r.status);

  const createdAt = coerceIso(r.createdAt ?? r.created_at);
  const updatedAt = coerceIso(r.updatedAt ?? r.updated_at);
  const attachments = parseAttachments(r.attachments);
  const documentsUrlsFromAttachments = attachments
    .map((a) => a.fileUrl)
    .filter((u): u is string => Boolean(u?.trim()));
  const documentsUrls = Array.isArray(r.documentsUrls)
    ? (r.documentsUrls as unknown[]).map(String)
    : Array.isArray(r.documents_urls)
      ? (r.documents_urls as unknown[]).map(String)
      : documentsUrlsFromAttachments;

  const workflowRaw = r.workflowInstanceId ?? r.workflow_instance_id;
  const workflowInstanceId =
    workflowRaw === null || workflowRaw === undefined ? null : (workflowRaw as string | number);
  const attachmentCount =
    typeof r.attachmentCount === 'number'
      ? r.attachmentCount
      : typeof r.attachment_count === 'number'
        ? r.attachment_count
        : attachments.length;

  const installmentRaw = r.installmentCount ?? r.installment_count;
  const installmentCount =
    installmentRaw != null && Number.isFinite(Number(installmentRaw)) ? Number(installmentRaw) : null;

  const firstInstallmentRaw = r.firstInstallmentDate ?? r.first_installment_date;
  const firstInstallmentDate =
    typeof firstInstallmentRaw === 'string' && firstInstallmentRaw
      ? firstInstallmentRaw.includes('T')
        ? firstInstallmentRaw.split('T')[0]
        : firstInstallmentRaw
      : null;

  const settlementRaw = r.settlementDate ?? r.settlement_date;
  const settlementDate =
    typeof settlementRaw === 'string' && settlementRaw
      ? settlementRaw.includes('T')
        ? settlementRaw.split('T')[0]
        : settlementRaw
      : null;

  const paymentMethodRaw = r.paymentMethod ?? r.payment_method;
  const paymentMethod =
    typeof paymentMethodRaw === 'string' && paymentMethodRaw.trim()
      ? (paymentMethodRaw.trim().toLowerCase() as PaymentRequestResponse['paymentMethod'])
      : null;

  const paymentOrderKindRaw = r.paymentOrderKind ?? r.payment_order_kind;
  const paymentOrderKind =
    typeof paymentOrderKindRaw === 'string' && paymentOrderKindRaw.trim()
      ? (paymentOrderKindRaw.trim().toLowerCase() as PaymentRequestResponse['paymentOrderKind'])
      : null;

  const paymentMarkedAtRaw = r.paymentMarkedAt ?? r.payment_marked_at;
  const paymentMarkedAt =
    typeof paymentMarkedAtRaw === 'string' && paymentMarkedAtRaw ? paymentMarkedAtRaw : null;
  const sepidarConfirmedAtRaw = r.sepidarConfirmedAt ?? r.sepidar_confirmed_at;
  const sepidarConfirmedAt =
    typeof sepidarConfirmedAtRaw === 'string' && sepidarConfirmedAtRaw
      ? sepidarConfirmedAtRaw
      : null;
  const sepidarConfirmedByRaw = r.sepidarConfirmedBy ?? r.sepidar_confirmed_by;
  const sepidarConfirmedBy =
    sepidarConfirmedByRaw != null && Number.isFinite(Number(sepidarConfirmedByRaw))
      ? Number(sepidarConfirmedByRaw)
      : null;

  return {
    id,
    paymentMethod,
    paymentOrderKind,
    paymentMarkedAt,
    sepidarConfirmedAt,
    sepidarConfirmedBy,
    counterpartyId,
    counterparty,
    payerCompanyAccountId,
    receiverCounterpartyAccountId,
    payerAccountDetail,
    receiverAccountDetail,
    type,
    payer,
    receiver,
    paymentDate,
    reason: displayReason || reason,
    description,
    amount: Number.isFinite(amount) ? amount : 0,
    documentsUrls,
    attachments,
    attachmentCount,
    requesterId,
    requesterName,
    status,
    workflowInstanceId,
    installmentCount,
    firstInstallmentDate,
    settlementDate,
    createdAt,
    updatedAt,
  };
}

function parseAttachments(raw: unknown): PaymentAttachment[] {
  if (!Array.isArray(raw)) return [];
  const out: PaymentAttachment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const fileUrl = coerceString(
      o.fileUrl ?? o.file_url ?? o.download_url ?? o.downloadUrl ?? o.url,
    );
    const fileName = coerceString(o.fileName ?? o.file_name ?? o.name);
    if (!fileUrl && !fileName && o.id == null) continue;
    out.push({
      id: o.id != null ? String(o.id) : undefined,
      fileName: fileName || undefined,
      fileUrl: fileUrl || undefined,
    });
  }
  return out;
}

function parseNestedRequesterUser(raw: unknown): { id: string; name: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const idRaw = o.id ?? o.user_id ?? o.userId;
  const id = idRaw != null ? String(idRaw).trim() : '';
  const first = coerceString(o.first_name ?? o.firstName);
  const last = coerceString(o.last_name ?? o.lastName);
  const name =
    coerceString(o.full_name ?? o.fullName ?? o.name) ||
    [first, last].filter(Boolean).join(' ').trim() ||
    coerceString(o.username);
  if (!id && !name) return null;
  return { id, name };
}

function coerceString(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function coerceNumber(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function coerceIso(v: unknown): string {
  const s = coerceString(v);
  if (!s) return new Date().toISOString();
  return s;
}

function normalizeCounterpartyFromApi(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  const partyType = String(r.partyType ?? r.party_type ?? 'company').toLowerCase();
  const bankAccountsRaw = r.bankAccounts ?? r.bank_accounts;
  const bankAccounts = Array.isArray(bankAccountsRaw)
    ? bankAccountsRaw
        .map((row) => {
          if (!row || typeof row !== 'object') return null;
          const b = row as Record<string, unknown>;
          const bid = Number(b.id);
          if (!Number.isFinite(bid)) return null;
          return {
            id: bid,
            label: (b.label as string | null | undefined) ?? null,
            bankName: (b.bankName ?? b.bank_name) as string | null | undefined,
            accountNumber: (b.accountNumber ?? b.account_number) as string | null | undefined,
            shebaNumber: (b.shebaNumber ?? b.sheba_number) as string | null | undefined,
            cardNumber: (b.cardNumber ?? b.card_number) as string | null | undefined,
            isDefault: Boolean(b.isDefault ?? b.is_default ?? false),
          };
        })
        .filter(Boolean)
    : undefined;

  return {
    id,
    name: String(r.name ?? ''),
    partyType: partyType === 'person' ? ('person' as const) : ('company' as const),
    companyName: (r.companyName ?? r.company_name) as string | null | undefined,
    accountNumber: (r.accountNumber ?? r.account_number) as string | null | undefined,
    shebaNumber: (r.shebaNumber ?? r.sheba_number) as string | null | undefined,
    cardNumber: (r.cardNumber ?? r.card_number) as string | null | undefined,
    bankAccounts: bankAccounts as Counterparty['bankAccounts'],
    notes: (r.notes as string | null | undefined) ?? null,
    isActive: Boolean(r.isActive ?? r.is_active ?? true),
  };
}

function normalizePaymentRequestType(t: string): PaymentRequestType {
  const lower = t.toLowerCase();
  switch (lower) {
    case 'loan':
      return PaymentRequestType.LOAN;
    case 'advance':
      return PaymentRequestType.ADVANCE;
    case 'payment_order':
      return PaymentRequestType.PAYMENT_ORDER;
    case 'cash':
      return PaymentRequestType.CASH;
    case 'payment':
      return PaymentRequestType.PAYMENT;
    case 'other':
      return PaymentRequestType.OTHER;
    default:
      return PaymentRequestType.PAYMENT_ORDER;
  }
}

function normalizeStatus(v: unknown): 'pending' | 'approved' | 'rejected' | 'paid' {
  const s = coerceString(v).toLowerCase();
  if (s === 'approved' || s === 'accepted') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'paid') return 'paid';
  return 'pending';
}
'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  patchDataWithAuth,
  readDataWithAuth,
} from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import type {
  CompanyBankAccount,
  CompanyBankAccountListResponse,
} from '@/app/dashboard/payment-request/_types/bank-account.types';
import type { BankAccountFormValues } from '@/app/dashboard/payment-request/_types/bank-account.schema';

function normalizeCompanyBankAccount(raw: unknown): CompanyBankAccount | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    label: String(r.label ?? ''),
    bankName: String(r.bankName ?? r.bank_name ?? ''),
    accountNumber: (r.accountNumber ?? r.account_number) as string | null | undefined,
    shebaNumber: (r.shebaNumber ?? r.sheba_number) as string | null | undefined,
    cardNumber: (r.cardNumber ?? r.card_number) as string | null | undefined,
    isDefault: Boolean(r.isDefault ?? r.is_default ?? false),
  };
}

function formToBody(values: BankAccountFormValues) {
  return {
    label: values.label.trim(),
    bankName: values.bankName.trim(),
    accountNumber: values.accountNumber?.trim() || null,
    shebaNumber: values.shebaNumber?.trim() || null,
    cardNumber: values.cardNumber?.trim() || null,
    isDefault: values.isDefault,
  };
}

export async function getCompanyBankAccountsAction() {
  try {
    const data = await readDataWithAuth<CompanyBankAccountListResponse | CompanyBankAccount[]>(
      '/company-bank-accounts/',
    );
    const rows = Array.isArray(data) ? data : (data.items ?? []);
    const items = rows.map((row) => normalizeCompanyBankAccount(row)).filter(Boolean) as CompanyBankAccount[];
    return { success: true as const, data: items };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت حساب‌های بانکی شرکت'),
    };
  }
}

export async function createCompanyBankAccountAction(values: BankAccountFormValues) {
  try {
    const data = await createDataWithAuth<ReturnType<typeof formToBody>, unknown>(
      '/company-bank-accounts/',
      formToBody(values),
    );
    const row = normalizeCompanyBankAccount(data);
    if (!row) return { success: false as const, error: 'پاسخ نامعتبر' };
    return { success: true as const, data: row };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در ایجاد حساب بانکی'),
    };
  }
}

export async function updateCompanyBankAccountAction(id: number, values: BankAccountFormValues) {
  try {
    const data = await patchDataWithAuth<ReturnType<typeof formToBody>, unknown>(
      `/company-bank-accounts/${id}`,
      formToBody(values),
    );
    const row = normalizeCompanyBankAccount(data);
    if (!row) return { success: false as const, error: 'پاسخ نامعتبر' };
    return { success: true as const, data: row };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در به‌روزرسانی حساب بانکی'),
    };
  }
}

export async function deleteCompanyBankAccountAction(id: number) {
  try {
    await deleteDataWithAuth(`/company-bank-accounts/${id}`);
    return { success: true as const };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در حذف حساب بانکی'),
    };
  }
}

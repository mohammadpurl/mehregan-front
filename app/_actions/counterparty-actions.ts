'use server';

import { createDataWithAuth, deleteDataWithAuth, patchDataWithAuth, readDataWithAuth } from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import type { Counterparty, CounterpartyListResponse } from '@/app/dashboard/payment-request/_types/counterparty.types';
import type { CounterpartyFormValues } from '@/app/dashboard/payment-request/_types/counterparty.schema';
import type { CounterpartyBankAccount } from '@/app/dashboard/payment-request/_types/bank-account.types';
import type { BankAccountFormValues } from '@/app/dashboard/payment-request/_types/bank-account.schema';

function normalizeCounterpartyBankAccount(raw: unknown): CounterpartyBankAccount | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  const counterpartyIdRaw = r.counterpartyId ?? r.counterparty_id;
  return {
    id,
    counterpartyId:
      counterpartyIdRaw != null && Number.isFinite(Number(counterpartyIdRaw))
        ? Number(counterpartyIdRaw)
        : undefined,
    label: (r.label as string | null | undefined) ?? null,
    bankName: (r.bankName ?? r.bank_name) as string | null | undefined,
    accountNumber: (r.accountNumber ?? r.account_number) as string | null | undefined,
    shebaNumber: (r.shebaNumber ?? r.sheba_number) as string | null | undefined,
    cardNumber: (r.cardNumber ?? r.card_number) as string | null | undefined,
    isDefault: Boolean(r.isDefault ?? r.is_default ?? false),
  };
}

function normalizeCounterparty(raw: unknown): Counterparty | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  const partyType = String(r.partyType ?? r.party_type ?? 'company').toLowerCase();
  const bankAccountsRaw = r.bankAccounts ?? r.bank_accounts;
  const bankAccounts = Array.isArray(bankAccountsRaw)
    ? (bankAccountsRaw.map((row) => normalizeCounterpartyBankAccount(row)).filter(Boolean) as CounterpartyBankAccount[])
    : undefined;

  return {
    id,
    name: String(r.name ?? ''),
    partyType: partyType === 'person' ? 'person' : 'company',
    companyName: (r.companyName ?? r.company_name) as string | null | undefined,
    accountNumber: (r.accountNumber ?? r.account_number) as string | null | undefined,
    shebaNumber: (r.shebaNumber ?? r.sheba_number) as string | null | undefined,
    cardNumber: (r.cardNumber ?? r.card_number) as string | null | undefined,
    bankAccounts,
    notes: (r.notes as string | null | undefined) ?? null,
    isActive: Boolean(r.isActive ?? r.is_active ?? true),
    createdAt: r.createdAt != null ? String(r.createdAt) : r.created_at != null ? String(r.created_at) : undefined,
    updatedAt: r.updatedAt != null ? String(r.updatedAt) : r.updated_at != null ? String(r.updated_at) : undefined,
  };
}

function bankAccountFormToBody(values: BankAccountFormValues) {
  return {
    label: values.label.trim(),
    bankName: values.bankName.trim(),
    accountNumber: values.accountNumber?.trim() || null,
    shebaNumber: values.shebaNumber?.trim() || null,
    cardNumber: values.cardNumber?.trim() || null,
    isDefault: values.isDefault,
  };
}

function formToBody(values: CounterpartyFormValues) {
  return {
    name: values.name.trim(),
    partyType: values.partyType,
    companyName: values.companyName?.trim() || null,
    notes: values.notes?.trim() || null,
    isActive: values.isActive,
  };
}

export async function getCounterpartiesAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 200;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.search) query.set('search', params.search);
  if (params?.activeOnly !== false) query.set('activeOnly', 'true');

  try {
    const data = await readDataWithAuth<CounterpartyListResponse>(`/counterparties?${query.toString()}`);
    const items = (data.items ?? []).map((row) => normalizeCounterparty(row)).filter(Boolean) as Counterparty[];
    return { success: true as const, data: { ...data, items } };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت طرف‌حساب‌ها') };
  }
}

export async function getCounterpartyAction(id: number) {
  try {
    const data = await readDataWithAuth<unknown>(`/counterparties/${id}`);
    const row = normalizeCounterparty(data);
    if (!row) return { success: false as const, error: 'طرف حساب نامعتبر' };
    return { success: true as const, data: row };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت طرف حساب') };
  }
}

export async function createCounterpartyAction(values: CounterpartyFormValues) {
  try {
    const data = await createDataWithAuth<ReturnType<typeof formToBody>, unknown>('/counterparties', formToBody(values));
    const row = normalizeCounterparty(data);
    if (!row) return { success: false as const, error: 'پاسخ نامعتبر' };
    return { success: true as const, data: row };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در ایجاد طرف حساب') };
  }
}

export async function updateCounterpartyAction(id: number, values: CounterpartyFormValues) {
  try {
    const data = await patchDataWithAuth<ReturnType<typeof formToBody>, unknown>(`/counterparties/${id}`, formToBody(values));
    const row = normalizeCounterparty(data);
    if (!row) return { success: false as const, error: 'پاسخ نامعتبر' };
    return { success: true as const, data: row };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در به‌روزرسانی') };
  }
}

export async function deleteCounterpartyAction(id: number) {
  try {
    await deleteDataWithAuth(`/counterparties/${id}`);
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در حذف') };
  }
}

export async function getCounterpartyBankAccountsAction(counterpartyId: number) {
  try {
    const data = await readDataWithAuth<unknown[]>(
      `/counterparties/${counterpartyId}/bank-accounts`,
    );
    const items = (Array.isArray(data) ? data : [])
      .map((row) => normalizeCounterpartyBankAccount(row))
      .filter(Boolean) as CounterpartyBankAccount[];
    return { success: true as const, data: items };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت حساب‌های طرف‌حساب'),
    };
  }
}

export async function createCounterpartyBankAccountAction(
  counterpartyId: number,
  values: BankAccountFormValues,
) {
  try {
    const data = await createDataWithAuth<ReturnType<typeof bankAccountFormToBody>, unknown>(
      `/counterparties/${counterpartyId}/bank-accounts`,
      bankAccountFormToBody(values),
    );
    const row = normalizeCounterpartyBankAccount(data);
    if (!row) return { success: false as const, error: 'پاسخ نامعتبر' };
    return { success: true as const, data: row };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در ایجاد حساب'),
    };
  }
}

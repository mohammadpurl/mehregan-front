'use server';

import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  uploadDataWithAuth,
} from '@/app/core/http-service/http-service';
import type {
  PettyCashCreateInput,
  PettyCashEligibility,
  PettyCashExpenseLineInput,
  PettyCashResponse,
} from '@/app/dashboard/petty-cash/_types/petty-cash.types';
import {
  expenseLinesToBody,
  normalizePettyCashFromApi,
  pettyCashCreateToBody,
} from '@/app/dashboard/petty-cash/_utils/petty-cash-mapper';

export async function getPettyCashEligibilityAction() {
  try {
    const data = await readDataWithAuth<Record<string, unknown>>('/petty-cash/eligibility');
    const canCreate = Boolean(data.can_create ?? data.canCreate ?? true);
    return {
      success: true as const,
      data: {
        canCreate,
        message: String(data.message ?? data.reason ?? ''),
        reason: String(data.reason ?? data.message ?? ''),
        blockingPettyCashId: (data.blocking_petty_cash_id ?? data.blockingPettyCashId ?? null) as number | null,
      } satisfies PettyCashEligibility,
    };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در بررسی امکان ثبت تنخواه') };
  }
}

export async function createPettyCashAction(input: PettyCashCreateInput) {
  try {
    const body = pettyCashCreateToBody(input);
    const response = await createDataWithAuth<typeof body, unknown>('/petty-cash/', body);
    const normalized = normalizePettyCashFromApi(response);
    if (!normalized) return { success: false as const, error: 'پاسخ سرور نامعتبر بود' };
    return { success: true as const, data: normalized };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'ثبت درخواست تنخواه ناموفق بود') };
  }
}

export async function getPettyCashListAction(params?: { page?: number; pageSize?: number }) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  try {
    const response = await readDataWithAuth<{ items?: unknown[]; total: number }>(`/petty-cash/?${query}`);
    const items = (response?.items ?? []).map(normalizePettyCashFromApi).filter(Boolean) as PettyCashResponse[];
    return { success: true as const, data: { items, total: response?.total ?? items.length } };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت لیست تنخواه') };
  }
}

export async function getPettyCashByIdAction(id: string | number) {
  try {
    const response = await readDataWithAuth<unknown>(`/petty-cash/${id}`);
    const normalized = normalizePettyCashFromApi(response);
    if (!normalized) return { success: false as const, error: 'درخواست یافت نشد' };
    return { success: true as const, data: normalized };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت جزئیات تنخواه') };
  }
}

export async function getPettyCashByWorkflowInstanceAction(instanceId: number) {
  try {
    const response = await readDataWithAuth<unknown>(`/petty-cash/by-workflow-instance/${instanceId}`);
    const normalized = normalizePettyCashFromApi(response);
    if (!normalized) {
      return { success: false as const, error: 'تنخواه برای این نمونه workflow یافت نشد' };
    }
    return { success: true as const, data: normalized };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'تنخواه برای این نمونه workflow یافت نشد'),
    };
  }
}

export async function submitPettyCashExpensesAction(id: string | number, lines: PettyCashExpenseLineInput[]) {
  try {
    const body = expenseLinesToBody(lines);
    const response = await createDataWithAuth<typeof body, unknown>(`/petty-cash/${id}/expenses`, body);
    const normalized = normalizePettyCashFromApi(response);
    return { success: true as const, data: normalized ?? undefined };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'ثبت اقلام هزینه ناموفق بود') };
  }
}

export async function importPettyCashExpensesExcelAction(id: string | number, file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await uploadDataWithAuth<unknown>(`/petty-cash/${id}/expenses/import-excel`, formData);
    const normalized = normalizePettyCashFromApi(response);
    return { success: true as const, data: normalized ?? undefined };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'بارگذاری اکسل ناموفق بود') };
  }
}

export async function deletePettyCashAction(id: string | number) {
  try {
    await deleteDataWithAuth(`/petty-cash/${id}`);
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'حذف درخواست تنخواه ناموفق بود') };
  }
}

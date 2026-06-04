'use server';

import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  uploadDataWithAuth,
} from '@/app/core/http-service/http-service';
import type {
  FinancialDocumentCreateInput,
  FinancialDocumentResponse,
} from '@/app/dashboard/financial-documents/_types/financial-document.types';
import {
  financialDocumentCreateToBody,
  normalizeFinancialDocumentFromApi,
} from '@/app/dashboard/financial-documents/_utils/financial-document-mapper';
import { validateAttachmentFiles } from '@/app/utils/validate-attachment';

export type FinancialDocumentListScope = 'mine' | 'team' | 'all' | 'approver' | 'participated';

const attachmentsUrl = (id: number) => `/financial-documents/${id}/attachments`;

async function tryUploadAttachments(
  documentId: number,
  files: File[] | undefined,
): Promise<string | undefined> {
  if (!files?.length) return undefined;
  const err = validateAttachmentFiles(files);
  if (err) return err;
  try {
    for (const f of files) {
      const formData = new FormData();
      formData.append('file', f);
      await uploadDataWithAuth<unknown>(attachmentsUrl(documentId), formData);
    }
    return undefined;
  } catch (e: unknown) {
    return extractActionErrorMessage(e, 'آپلود تصویر/پیوست ناموفق بود');
  }
}

export async function createFinancialDocumentAction(
  input: FinancialDocumentCreateInput,
  files?: File[],
) {
  if (!files?.length) {
    return { success: false as const, error: 'بارگذاری تصویر سند (مثلاً عکس چک) الزامی است' };
  }
  try {
    const body = financialDocumentCreateToBody(input);
    const response = await createDataWithAuth<typeof body, unknown>('/financial-documents/', body);
    const normalized = normalizeFinancialDocumentFromApi(response);
    if (!normalized) return { success: false as const, error: 'پاسخ سرور نامعتبر بود' };
    const attachmentError = await tryUploadAttachments(normalized.id, files);
    return { success: true as const, data: normalized, attachmentError: attachmentError ?? undefined };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'ثبت سند مالی ناموفق بود'),
    };
  }
}

export async function getFinancialDocumentListCapabilitiesAction() {
  try {
    const data = await readDataWithAuth<{ scopes: FinancialDocumentListScope[] }>(
      '/financial-documents/list-capabilities',
    );
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت محدوده لیست'),
    };
  }
}

export async function getFinancialDocumentListAction(params?: {
  page?: number;
  pageSize?: number;
  scope?: FinancialDocumentListScope;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (params?.scope) query.set('scope', params.scope);
  try {
    const response = await readDataWithAuth<{ items?: unknown[]; total: number }>(
      `/financial-documents/?${query}`,
    );
    const items = (response?.items ?? [])
      .map(normalizeFinancialDocumentFromApi)
      .filter(Boolean) as FinancialDocumentResponse[];
    return { success: true as const, data: { items, total: response?.total ?? items.length } };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت لیست اسناد مالی'),
    };
  }
}

export async function getFinancialDocumentByIdAction(id: number | string) {
  try {
    const response = await readDataWithAuth<unknown>(`/financial-documents/${id}`);
    const normalized = normalizeFinancialDocumentFromApi(response);
    if (!normalized) return { success: false as const, error: 'سند نامعتبر بود' };
    return { success: true as const, data: normalized };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'دریافت سند مالی ناموفق بود'),
    };
  }
}

export async function getFinancialDocumentByWorkflowInstanceAction(instanceId: number | string) {
  try {
    const response = await readDataWithAuth<unknown>(
      `/financial-documents/by-workflow-instance/${instanceId}`,
    );
    const normalized = normalizeFinancialDocumentFromApi(response);
    if (!normalized) return { success: false as const, error: 'سند نامعتبر بود' };
    return { success: true as const, data: normalized };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'سند مالی برای این گردش‌کار یافت نشد'),
    };
  }
}

export async function deleteFinancialDocumentAction(id: number) {
  try {
    await deleteDataWithAuth(`/financial-documents/${id}`);
    return { success: true as const };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'حذف سند ناموفق بود'),
    };
  }
}

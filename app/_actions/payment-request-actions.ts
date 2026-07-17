'use server';

import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import { getProfileAction } from '@/app/_actions/profile-actions';
import { createDataWithAuth, readDataWithAuth, patchDataWithAuth, deleteDataWithAuth, uploadDataWithAuth } from '@/app/core/http-service/http-service';
import { getRequesterFromSession } from '@/app/utils/requester-from-session';
import type { PaymentRequestFormData, PaymentRequestResponse } from '@/app/dashboard/payment-request/_types/payment-request.types';
import { PaymentRequestType } from '@/app/dashboard/payment-request/_types/payment-request.types';
import {
  employeeValuesToLoanAdvanceBody,
  formDataToCreateBody,
  normalizePaymentRequestFromApi,
  partialFormDataToPatch,
  paymentOrderValuesToBody,
  type LoanAdvanceRequestBody,
  type PaymentOrderRequestBody,
  type PaymentRequestCreateBody,
} from '@/app/dashboard/payment-request/_utils/payment-request-mapper';
import type { PaymentOrderCreateValues } from '@/app/dashboard/payment-request/_types/counterparty.schema';
import { enrichPaymentRequestForApprover } from '@/app/dashboard/payment-request/_utils/enrich-payment-request-for-approver';
import { validateAttachmentFiles } from '@/app/utils/validate-attachment';

const log = (level: 'info' | 'error' | 'warn', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[PAYMENT-REQUEST-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

/** بک‌اند: POST multipart با فیلد `file` — یک فایل در هر درخواست */
const paymentRequestAttachmentsUrl = (id: string) => `/payment-requests/${id}/attachments`;

async function tryUploadPaymentAttachments(paymentRequestId: string, files: File[] | undefined): Promise<string | undefined> {
  if (!files?.length) return undefined;
  const err = validateAttachmentFiles(files);
  if (err) return err;
  try {
    for (const f of files) {
      const formData = new FormData();
      formData.append('file', f);
      await uploadDataWithAuth<unknown>(paymentRequestAttachmentsUrl(paymentRequestId), formData);
    }
    return undefined;
  } catch (e: unknown) {
    const ex = e as { response?: { status?: number } };
    const fallback =
      ex?.response?.status === 404
        ? 'مسیر آپلود پیوست روی سرور یافت نشد.'
        : 'آپلود پیوست ناموفق بود. فرمت یا حجم فایل را بررسی کنید.';
    const msg = extractActionErrorMessage(e, fallback);
    log('warn', 'tryUploadPaymentAttachments failed', { paymentRequestId, msg });
    return msg;
  }
}

/**
 * آپلود پیوست برای درخواست موجود (مثلاً از صفحه ویرایش).
 */
export async function uploadPaymentRequestAttachmentsAction(paymentRequestId: string, files: File[]) {
  const msg = await tryUploadPaymentAttachments(paymentRequestId, files);
  if (msg) return { success: false as const, error: msg };
  return { success: true as const };
}

async function resolveNumericRequesterId(requesterId: string): Promise<number | undefined> {
  const n = Number(requesterId);
  if (Number.isFinite(n) && n > 0) return n;
  const profile = await getProfileAction();
  if (profile.success && profile.data?.id && profile.data.id > 0) {
    return profile.data.id;
  }
  return undefined;
}

export async function createPaymentRequestAction(data: PaymentRequestFormData) {
  const startTime = Date.now();
  log('info', 'createPaymentRequestAction started', { type: data.type, amount: data.amount });

  try {
    const req = await getRequesterFromSession();
    const {
      documents: _files,
      loanInstallmentCount,
      loanFirstInstallmentDate,
      advanceExpectedRepaymentDate,
      cashExpenseCategory,
      ...rest
    } = data;

    const core: PaymentRequestFormData = {
      ...rest,
      requesterId: data.requesterId?.trim() ? data.requesterId : req.requesterId,
      requesterName: data.requesterName?.trim() ? data.requesterName : req.requesterName || undefined,
    };

    let response: unknown;

    if (core.type === PaymentRequestType.LOAN || core.type === PaymentRequestType.ADVANCE) {
      const requesterIdNum = await resolveNumericRequesterId(core.requesterId);
      const laBody: LoanAdvanceRequestBody = employeeValuesToLoanAdvanceBody(
        {
          amount: core.amount,
          paymentDate: core.paymentDate,
          reason: core.reason,
        },
        requesterIdNum,
      );
      const path = core.type === PaymentRequestType.LOAN ? '/payment-requests/loan' : '/payment-requests/advance';
      response = await createDataWithAuth<LoanAdvanceRequestBody, unknown>(path, laBody);
    } else if (core.type === PaymentRequestType.PAYMENT_ORDER) {
      return { success: false as const, error: 'برای دستور پرداخت از createPaymentOrderAction استفاده کنید' };
    } else {
      const body: PaymentRequestCreateBody = formDataToCreateBody(core, {
        loanInstallmentCount,
        loanFirstInstallmentDate,
        advanceExpectedRepaymentDate,
        cashExpenseCategory,
      });
      response = await createDataWithAuth<PaymentRequestCreateBody, unknown>('/payment-requests', body);
    }

    const normalized = normalizePaymentRequestFromApi(response);
    if (!normalized) {
      return { success: false as const, error: 'پاسخ نامعتبر از سرور دریافت شد' };
    }

    const attachmentError = await tryUploadPaymentAttachments(normalized.id, _files);

    const duration = Date.now() - startTime;
    log('info', 'createPaymentRequestAction completed successfully', {
      duration: `${duration}ms`,
      id: normalized.id,
    });

    return { success: true as const, data: normalized, attachmentError: attachmentError ?? undefined };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const message = extractActionErrorMessage(err, 'خطا در ایجاد درخواست پرداخت');
    log('error', 'createPaymentRequestAction failed', {
      duration: `${duration}ms`,
      error: message,
    });

    return {
      success: false as const,
      error: message,
    };
  }
}

export async function createPaymentOrderAction(values: PaymentOrderCreateValues, files?: File[]) {
  try {
    if (values.paymentOrderKind === 'collective' && !files?.length) {
      return {
        success: false as const,
        error: 'برای دستور پرداخت جمعی بارگذاری حداقل یک پیوست الزامی است',
      };
    }
    const body: PaymentOrderRequestBody = paymentOrderValuesToBody(values);
    const response = await createDataWithAuth<PaymentOrderRequestBody, unknown>(
      '/payment-requests/payment-order',
      body,
    );
    const normalized = normalizePaymentRequestFromApi(response);
    if (!normalized) {
      return { success: false as const, error: 'پاسخ نامعتبر از سرور دریافت شد' };
    }
    const attachmentError = await tryUploadPaymentAttachments(normalized.id, files);
    return { success: true as const, data: normalized, attachmentError: attachmentError ?? undefined };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در ثبت دستور پرداخت'),
    };
  }
}

export async function getPaymentRequestByWorkflowInstanceAction(instanceId: string | number) {
  try {
    const response = await readDataWithAuth<unknown>(`/payment-requests/by-workflow-instance/${instanceId}`);
    const normalized = normalizePaymentRequestFromApi(response);
    if (!normalized) return { success: false as const, error: 'درخواست پرداخت نامعتبر بود' };
    const enriched = await enrichPaymentRequestForApprover(normalized);
    return { success: true as const, data: enriched };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(
        err,
        'درخواست مالی برای این نمونه workflow یافت نشد (GET /payment-requests/by-workflow-instance/{id})',
      ),
    };
  }
}

export async function getPaymentRequestAction(id: string) {
  const startTime = Date.now();
  log('info', 'getPaymentRequestAction started', { id });
  
  try {
    const response = await readDataWithAuth<unknown>(`/payment-requests/${id}`);

    const normalized = normalizePaymentRequestFromApi(response);
    if (!normalized) {
      return { success: false as const, error: 'درخواست پرداخت نامعتبر بود' };
    }

    const enriched = await enrichPaymentRequestForApprover(normalized);

    const duration = Date.now() - startTime;
    log('info', 'getPaymentRequestAction completed successfully', {
      duration: `${duration}ms`,
    });

    return { success: true as const, data: enriched };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    log('error', 'getPaymentRequestAction failed', {
      duration: `${duration}ms`,
      error: extractActionErrorMessage(err, 'خطا در دریافت درخواست پرداخت'),
    });

    return {
      success: false,
      error: extractActionErrorMessage(err, 'خطا در دریافت درخواست پرداخت'),
    };
  }
}
export async function getPaymentRequestsAction(page: number = 1, pageSize: number = 10) {
  const startTime = Date.now();
  log('info', 'getPaymentRequestsAction started', { page, pageSize });
  
  try {
    const response = await readDataWithAuth<{ items?: unknown[]; total: number; page?: number; pageSize?: number }>(
      `/payment-requests?page=${page}&pageSize=${pageSize}`,
    );

    const items = (response?.items ?? []).map((row) => normalizePaymentRequestFromApi(row)).filter(Boolean) as PaymentRequestResponse[];

    const duration = Date.now() - startTime;
    log('info', 'getPaymentRequestsAction completed successfully', {
      duration: `${duration}ms`,
      total: response.total,
    });

    return { success: true as const, data: { ...response, items } };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    log('error', 'getPaymentRequestsAction failed', {
      duration: `${duration}ms`,
      error: extractActionErrorMessage(err, 'خطا در دریافت لیست درخواست‌های پرداخت'),
    });

    return {
      success: false,
      error: extractActionErrorMessage(err, 'خطا در دریافت لیست درخواست‌های پرداخت'),
    };
  }
}
export async function getPaymentRequestsQueryAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  id?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** mine (default) | team | all | approver | participated */
  scope?: 'mine' | 'team' | 'all' | 'approver' | 'participated';
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  query.set('sortBy', params?.sortBy ?? 'created_at');
  query.set('sortOrder', params?.sortOrder ?? 'desc');
  if (params?.search) query.set('search', params.search);
  if (params?.id) query.set('id', params.id);
  if (params?.status) query.set('status', params.status);
  if (params?.type) {
    query.set('filterBy', 'payment_type');
    query.set('filterValue', params.type);
  }
  if (params?.scope && params.scope !== 'mine') query.set('scope', params.scope);

  const url = `/payment-requests?${query.toString()}`;
  const startTime = Date.now();
  log('info', 'getPaymentRequestsQueryAction started', { url, params });
  try {
    const response = await readDataWithAuth<{ items?: unknown[]; total: number; page?: number; pageSize?: number }>(url);
    const duration = Date.now() - startTime;
    const items = (response?.items ?? []).map((row) => normalizePaymentRequestFromApi(row)).filter(Boolean) as PaymentRequestResponse[];
    log('info', 'getPaymentRequestsQueryAction completed successfully', {
      duration: `${duration}ms`,
      total: response.total,
    });
    return { success: true as const, data: { ...response, items } };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    log('error', 'getPaymentRequestsQueryAction failed', {
      duration: `${duration}ms`,
      error: extractActionErrorMessage(err, 'خطا در دریافت لیست درخواست‌های پرداخت'),
      url,
    });
    return {
      success: false,
      error: extractActionErrorMessage(err, 'خطا در دریافت لیست درخواست‌های پرداخت'),
    };
  }
}

export type PaymentRequestListScope =
  | 'mine'
  | 'team'
  | 'all'
  | 'approver'
  | 'participated';

export async function getPaymentRequestListCapabilitiesAction() {
  try {
    const data = await readDataWithAuth<{ scopes?: string[] }>('/payment-requests/list-capabilities');
    const scopes = Array.isArray(data?.scopes) ? data.scopes : ['mine', 'approver', 'participated'];
    return { success: true as const, data: { scopes: scopes as PaymentRequestListScope[] } };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت دسترسی‌های لیست'),
    };
  }
}

export async function updatePaymentRequestAction(id: string, data: Partial<PaymentRequestFormData>) {
  const startTime = Date.now();
  log('info', 'updatePaymentRequestAction started', { id });

  try {
    const { documents: newFiles, type, ...rest } = data;
    const isLoanAdvance = type === PaymentRequestType.LOAN || type === PaymentRequestType.ADVANCE;
    const patch = isLoanAdvance
      ? employeeValuesToLoanAdvanceBody({
          amount: rest.amount ?? 0,
          paymentDate: rest.paymentDate ?? '',
          reason: rest.reason ?? '',
        })
      : partialFormDataToPatch({ ...rest, type });
    const hasPatch = Object.keys(patch).length > 0;

    let normalized: PaymentRequestResponse | null = null;

    if (hasPatch) {
      const response = await patchDataWithAuth<typeof patch, unknown>(`/payment-requests/${id}`, patch);
      normalized = normalizePaymentRequestFromApi(response);
      if (!normalized) {
        return { success: false as const, error: 'پاسخ نامعتبر از سرور' };
      }
    } else if (newFiles?.length) {
      const response = await readDataWithAuth<unknown>(`/payment-requests/${id}`);
      normalized = normalizePaymentRequestFromApi(response);
      if (!normalized) {
        return { success: false as const, error: 'درخواست یافت نشد' };
      }
    } else {
      return { success: false as const, error: 'هیچ فیلدی برای به‌روزرسانی ارسال نشد' };
    }

    const attachmentError = await tryUploadPaymentAttachments(id, newFiles);

    const duration = Date.now() - startTime;
    log('info', 'updatePaymentRequestAction completed successfully', {
      duration: `${duration}ms`,
    });

    return { success: true as const, data: normalized, attachmentError: attachmentError ?? undefined };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const message = extractActionErrorMessage(err, 'خطا در به‌روزرسانی درخواست پرداخت');
    log('error', 'updatePaymentRequestAction failed', {
      duration: `${duration}ms`,
      error: message,
    });

    return {
      success: false,
      error: message,
    };
  }
}

export async function deletePaymentRequestAction(id: string) {
  const startTime = Date.now();
  log('info', 'deletePaymentRequestAction started', { id });
  
  try {
    await deleteDataWithAuth(`/payment-requests/${id}`);
    
    const duration = Date.now() - startTime;
    log('info', 'deletePaymentRequestAction completed successfully', {
      duration: `${duration}ms`,
    });
    
    return { success: true };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    log('error', 'deletePaymentRequestAction failed', {
      duration: `${duration}ms`,
      error: extractActionErrorMessage(err, 'خطا در حذف درخواست پرداخت'),
    });

    return {
      success: false,
      error: extractActionErrorMessage(err, 'خطا در حذف درخواست پرداخت'),
    };
  }
}

'use server';

import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
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

const log = (level: 'info' | 'error' | 'warn', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[PAYMENT-REQUEST-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

/** قرارداد فرضی بک‌اند: POST multipart با کلید تکراری `files`. در صورت تفاوت مسیر/نام فیلد، همین‌جا اصلاح شود. */
const paymentRequestAttachmentsUrl = (id: string) => `/payment-requests/${id}/attachments/`;

const ATTACHMENT_MAX_BYTES = 15 * 1024 * 1024;

function validateAttachmentFiles(files: File[]): string | null {
  for (const f of files) {
    if (f.size > ATTACHMENT_MAX_BYTES) {
      return `فایل «${f.name}» بزرگ‌تر از حد مجاز (${ATTACHMENT_MAX_BYTES / 1024 / 1024} مگابایت) است.`;
    }
  }
  return null;
}

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
    const ex = e as { message?: string; response?: { status?: number; data?: { message?: string } } };
    const msg =
      ex?.response?.data?.message ||
      ex?.message ||
      (ex?.response?.status === 404 ? 'مسیر آپلود پیوست روی سرور تعریف نشده (404).' : 'آپلود پیوست ناموفق بود.');
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
      const laBody: LoanAdvanceRequestBody = employeeValuesToLoanAdvanceBody({
        amount: core.amount,
        paymentDate: core.paymentDate,
        reason: core.reason,
      });
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
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'createPaymentRequestAction failed', {
      duration: `${duration}ms`,
      error: error?.message || error?.response?.data?.message,
    });

    return {
      success: false as const,
      error: error?.response?.data?.message || error?.message || 'خطا در ایجاد درخواست پرداخت',
    };
  }
}

export async function createPaymentOrderAction(values: PaymentOrderCreateValues, files?: File[]) {
  try {
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
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    return {
      success: false as const,
      error: error?.response?.data?.message || error?.message || 'خطا در ثبت دستور پرداخت',
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
    const error = err as { message?: string };
    log('error', 'getPaymentRequestAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
    });

    return { success: false, error: error?.message || 'خطا در دریافت درخواست پرداخت' };
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
    const error = err as { message?: string };
    log('error', 'getPaymentRequestsAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
    });

    return { success: false, error: error?.message || 'خطا در دریافت لیست درخواست‌های پرداخت' };
  }
}
export async function getPaymentRequestsQueryAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  id?: string;
  status?: string;
  type?: string;
  /** mine (default) | approver | participated */
  scope?: 'approver' | 'participated';
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.search) query.set('search', params.search);
  if (params?.id) query.set('id', params.id);
  if (params?.status) query.set('status', params.status);
  if (params?.type) query.set('type', params.type);
  if (params?.scope) query.set('scope', params.scope);

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
    const error = err as { message?: string };
    log('error', 'getPaymentRequestsQueryAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
      url,
    });
    return { success: false, error: error?.message || 'خطا در دریافت لیست درخواست‌های پرداخت' };
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
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'updatePaymentRequestAction failed', {
      duration: `${duration}ms`,
      error: error?.message || error?.response?.data?.message,
    });

    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در به‌روزرسانی درخواست پرداخت',
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
    const error = err as { message?: string };
    log('error', 'deletePaymentRequestAction failed', {
      duration: `${duration}ms`,
      error: error?.message,
    });
    
    return { success: false, error: error?.message || 'خطا در حذف درخواست پرداخت' };
  }
}

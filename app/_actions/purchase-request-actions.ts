'use server';

import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import {
  attachmentProxyDownloadPath,
  extractAttachmentId,
  parseAttachmentsFromApi,
} from '@/app/utils/attachment-display.utils';
import {
  createDataWithAuth,
  deleteDataWithAuth,
  patchDataWithAuth,
  readDataWithAuth,
  uploadDataWithAuth,
} from '@/app/core/http-service/http-service';
import type {
  CreatePurchaseRequestPayload,
  PaginatedPurchaseRequests,
  PurchaseProforma,
  PurchaseRequest,
} from '@/app/_types/purchase-request.types';

function mapPurchaseRequest(raw: Record<string, unknown>): PurchaseRequest {
  const items = Array.isArray(raw.items)
    ? (raw.items as Record<string, unknown>[]).map((li) => ({
        id: li.id as number | undefined,
        itemId: (li.item_id ?? li.itemId) as number | null | undefined,
        itemName: String(li.item_name ?? li.itemName ?? ''),
        quantity: Number(li.quantity ?? 0),
        description: (li.description as string | null) ?? null,
      }))
    : [];
  return {
    id: Number(raw.id),
    type: String(raw.type ?? 'purchase'),
    status: String(raw.status ?? ''),
    requesterId: Number(raw.requester_id ?? raw.requesterId ?? 0),
    requesterName: (raw.requester_name ?? raw.requesterName) as string | null | undefined,
    reason: (raw.reason as string | null) ?? null,
    items,
    workflowInstanceId: (raw.workflow_instance_id ?? raw.workflowInstanceId) as number | null | undefined,
    workflowProgress: mapWorkflowProgress(raw.workflow_progress ?? raw.workflowProgress),
    paymentRequestId: (raw.payment_request_id ?? raw.paymentRequestId) as number | null | undefined,
    purchaseOrderId: (raw.purchase_order_id ?? raw.purchaseOrderId) as number | null | undefined,
    payment: mapPaymentSummary(raw.payment),
    purchaseOrder: mapPurchaseOrderSummary(raw.purchase_order ?? raw.purchaseOrder),
    createdAt: (raw.created_at ?? raw.createdAt) as string | null | undefined,
    attachments: parseAttachmentsFromApi(raw.attachments).map((a) => ({
      id: typeof a.id === 'number' ? a.id : undefined,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
    })),
    invoices: parseAttachmentsFromApi(raw.invoices).map((a) => ({
      id: typeof a.id === 'number' ? a.id : undefined,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      downloadUrl:
        typeof a.id === 'number' ? attachmentProxyDownloadPath(a.id) : a.fileUrl,
    })),
    approvedPaymentMethod: (raw.approved_payment_method ?? raw.approvedPaymentMethod) as
      | string
      | null
      | undefined,
    approvedPaymentComment: (raw.approved_payment_comment ?? raw.approvedPaymentComment) as
      | string
      | null
      | undefined,
    invoicePaidAt: (raw.invoice_paid_at ?? raw.invoicePaidAt) as string | null | undefined,
  };
}

function mapPaymentSummary(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  return {
    id: Number(p.id),
    amount: Number(p.amount ?? 0),
    status: String(p.status ?? ''),
    paymentType: (p.payment_type ?? p.paymentType) as string | null | undefined,
    workflowInstanceId: (p.workflow_instance_id ?? p.workflowInstanceId) as number | null | undefined,
  };
}

function mapPurchaseOrderSummary(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;
  const po = raw as Record<string, unknown>;
  return {
    id: Number(po.id),
    orderNo: (po.order_no ?? po.orderNo) as string | null | undefined,
    status: (po.status as string | null) ?? null,
  };
}

function mapWorkflowProgress(raw: unknown) {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((phase) => {
    const p = phase as Record<string, unknown>;
    const stepsRaw = Array.isArray(p.steps) ? p.steps : [];
    return {
      phase: String(p.phase ?? '') as 'phase1' | 'phase2',
      instanceId: Number(p.instance_id ?? p.instanceId ?? 0),
      instanceStatus: String(p.instance_status ?? p.instanceStatus ?? ''),
      steps: stepsRaw
        .map((s) => {
          const step = s as Record<string, unknown>;
          return {
            order: Number(step.order ?? 0),
            label: String(step.label ?? ''),
            status: String(step.status ?? ''),
            role: (step.role as string | null) ?? null,
            assignedUserName: (step.assigned_user_name ?? step.assignedUserName) as
              | string
              | null
              | undefined,
          };
        })
        .sort((a, b) => a.order - b.order),
    };
  });
}

function mapProformaDownloadUrl(raw: Record<string, unknown>): string | undefined {
  const backendUrl = String(raw.download_url ?? raw.downloadUrl ?? '').trim();
  const attachmentId = extractAttachmentId(backendUrl);
  if (attachmentId) return attachmentProxyDownloadPath(attachmentId);
  return backendUrl || undefined;
}

function mapProforma(raw: Record<string, unknown>): PurchaseProforma {
  return {
    id: Number(raw.id),
    requestId: Number(raw.request_id ?? raw.requestId),
    supplierId: Number(raw.supplier_id ?? raw.supplierId),
    supplierName: (raw.supplier_name ?? raw.supplierName) as string | null | undefined,
    amount: Number(raw.amount ?? 0),
    notes: (raw.notes as string | null) ?? null,
    status: String(raw.status ?? ''),
    uploadedBy: Number(raw.uploaded_by ?? raw.uploadedBy ?? 0),
    createdAt: (raw.created_at ?? raw.createdAt) as string | null | undefined,
    fileName: (raw.file_name ?? raw.fileName) as string | null | undefined,
    downloadUrl: mapProformaDownloadUrl(raw),
  };
}

export type PurchaseWarehouseCatalogItem = {
  itemId: number;
  itemName: string;
  sku?: string | null;
  unit?: string | null;
  warehouseId?: number | null;
  warehouseName?: string | null;
  onHand: number;
  hasStockRecord?: boolean;
};

export async function getPurchaseWarehouseCatalogAction(params?: {
  warehouseId?: number;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.warehouseId != null) {
    query.set('warehouseId', String(params.warehouseId));
  }
  if (params?.search?.trim()) {
    query.set('search', params.search.trim());
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  try {
    const data = await readDataWithAuth<{
      warehouses?: { id: number; name: string }[];
      items?: Record<string, unknown>[];
      meta?: Record<string, unknown>;
    }>(`/requests/purchase/warehouse-catalog${suffix}`);
    const warehouses = Array.isArray(data?.warehouses) ? data.warehouses : [];
    const items: PurchaseWarehouseCatalogItem[] = (data?.items ?? []).map((row) => ({
      itemId: Number(row.item_id ?? row.itemId),
      itemName: String(row.item_name ?? row.itemName ?? ''),
      sku: (row.sku as string | null) ?? null,
      unit: (row.unit as string | null) ?? null,
      warehouseId: (row.warehouse_id ?? row.warehouseId) as number | null | undefined,
      warehouseName: (row.warehouse_name ?? row.warehouseName) as string | null | undefined,
      onHand: Number(row.on_hand ?? row.onHand ?? 0),
      hasStockRecord: Boolean(row.has_stock_record ?? row.hasStockRecord),
    }));
    return {
      success: true as const,
      data: {
        warehouses,
        items,
        meta: data?.meta as Record<string, unknown> | undefined,
      },
    };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت لیست کالاهای انبار'),
    };
  }
}

export async function createPurchaseRequestAction(payload: CreatePurchaseRequestPayload) {
  try {
    const body = {
      reason: payload.reason,
      lines: payload.lines.map((l) => ({
        item_id: l.itemId,
        item_name: l.itemName,
        quantity: l.quantity,
        description: l.description || undefined,
      })),
    };
    const data = await createDataWithAuth<typeof body, Record<string, unknown>>('/requests/purchase', body);
    return { success: true as const, data: mapPurchaseRequest(data) };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { detail?: string; message?: string } } };
    return {
      success: false as const,
      error:
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'خطا در ثبت درخواست خرید',
    };
  }
}

export type PurchaseRequestListScope = 'mine' | 'all' | 'approver' | 'participated';

export async function getPurchaseRequestListCapabilitiesAction() {
  try {
    const data = await readDataWithAuth<{ scopes?: string[] }>('/requests/purchase/list-capabilities');
    const scopes = Array.isArray(data?.scopes) ? data.scopes : ['mine', 'approver', 'participated'];
    return { success: true as const, data: { scopes: scopes as PurchaseRequestListScope[] } };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { success: false as const, error: error?.message || 'خطا در دریافت محدوده‌های لیست' };
  }
}

export async function getPurchaseRequestsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  filterBy?: string;
  filterValue?: string;
  scope?: PurchaseRequestListScope;
}) {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 10));
  if (params?.search) query.set('search', params.search);
  if (params?.filterBy) query.set('filterBy', params.filterBy);
  if (params?.filterValue) query.set('filterValue', params.filterValue);
  if (params?.scope && params.scope !== 'mine') query.set('scope', params.scope);
  try {
    const data = await readDataWithAuth<PaginatedPurchaseRequests & { items: Record<string, unknown>[] }>(
      `/requests/purchase?${query.toString()}`,
    );
    return {
      success: true as const,
      data: {
        ...data,
        items: (data.items ?? []).map((row) => mapPurchaseRequest(row)),
      },
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { success: false as const, error: error?.message || 'خطا در دریافت لیست' };
  }
}

export async function updatePurchaseRequestAction(
  id: string | number,
  payload: CreatePurchaseRequestPayload,
) {
  try {
    const body = {
      reason: payload.reason,
      lines: payload.lines.map((l) => ({
        item_id: l.itemId,
        item_name: l.itemName,
        quantity: l.quantity,
        description: l.description || undefined,
      })),
    };
    const data = await patchDataWithAuth<typeof body, Record<string, unknown>>(
      `/requests/purchase/${id}`,
      body,
    );
    return { success: true as const, data: mapPurchaseRequest(data) };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'ویرایش درخواست خرید ناموفق بود'),
    };
  }
}

export async function deletePurchaseRequestAction(id: string | number) {
  try {
    await deleteDataWithAuth(`/requests/purchase/${id}`);
    return { success: true as const };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'حذف درخواست خرید ناموفق بود'),
    };
  }
}

export async function getPurchaseRequestAction(id: string | number) {
  try {
    const data = await readDataWithAuth<Record<string, unknown>>(`/requests/purchase/${id}`);
    return { success: true as const, data: mapPurchaseRequest(data) };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'درخواست یافت نشد'),
    };
  }
}

export async function getPurchaseRequestByWorkflowInstanceAction(instanceId: string | number) {
  try {
    const data = await readDataWithAuth<Record<string, unknown>>(
      `/requests/purchase/by-workflow-instance/${instanceId}`,
    );
    return { success: true as const, data: mapPurchaseRequest(data) };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(
        err,
        'درخواست خرید برای این نمونه workflow یافت نشد',
      ),
    };
  }
}

export async function getPurchaseProformasAction(requestId: string | number) {
  try {
    const rows = await readDataWithAuth<Record<string, unknown>[]>(`/requests/purchase/${requestId}/proformas`);
    return { success: true as const, data: rows.map(mapProforma) };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { success: false as const, error: error?.message || 'خطا در دریافت پیش‌فاکتورها' };
  }
}

export async function uploadPurchaseProformaAction(
  requestId: number,
  input: { supplierId: number; amount: number; notes?: string; file: File },
) {
  try {
    const formData = new FormData();
    formData.set('supplier_id', String(input.supplierId));
    formData.set('amount', String(input.amount));
    if (input.notes) formData.set('notes', input.notes);
    formData.set('file', input.file);
    const data = await uploadDataWithAuth<Record<string, unknown>>(
      `/requests/purchase/${requestId}/proformas`,
      formData,
    );
    return { success: true as const, data: mapProforma(data) };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { detail?: string } } };
    return {
      success: false as const,
      error: error?.response?.data?.detail || error?.message || 'خطا در آپلود پیش‌فاکتور',
    };
  }
}

export async function submitPurchaseProformaAction(requestId: number, proformaId: number) {
  try {
    const data = await createDataWithAuth<Record<string, never>, Record<string, unknown>>(
      `/requests/purchase/${requestId}/proformas/${proformaId}/submit`,
      {},
    );
    return { success: true as const, data: mapProforma(data) };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { detail?: string } } };
    return {
      success: false as const,
      error: error?.response?.data?.detail || error?.message || 'خطا در ارسال پیش‌فاکتور',
    };
  }
}

export async function uploadPurchaseRequestAttachmentAction(requestId: number, file: File) {
  try {
    const formData = new FormData();
    formData.set('file', file);
    const data = await uploadDataWithAuth<{ items?: unknown[] }>(
      `/requests/purchase/${requestId}/attachments`,
      formData,
    );
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در آپلود پیوست'),
    };
  }
}

export async function uploadPurchaseInvoiceAction(requestId: number, file: File) {
  try {
    const formData = new FormData();
    formData.set('file', file);
    const data = await uploadDataWithAuth<{ items?: unknown[] }>(
      `/requests/purchase/${requestId}/invoice`,
      formData,
    );
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در آپلود فاکتور'),
    };
  }
}

export async function markPurchaseInvoicePaidAction(requestId: number) {
  try {
    const data = await createDataWithAuth<Record<string, never>, Record<string, unknown>>(
      `/requests/purchase/${requestId}/mark-invoice-paid`,
      {},
    );
    return { success: true as const, data: mapPurchaseRequest(data) };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'ثبت پرداخت فاکتور ناموفق بود'),
    };
  }
}

export async function createProcurementPaymentAction(
  requestId: number,
  payload?: { notes?: string },
) {
  try {
    const data = await createDataWithAuth<{ notes?: string }, Record<string, unknown>>(
      `/requests/purchase/${requestId}/payment`,
      payload ?? {},
    );
    return { success: true as const, data };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { detail?: string } } };
    return {
      success: false as const,
      error: error?.response?.data?.detail || error?.message || 'خطا در ثبت درخواست پرداخت',
    };
  }
}

export async function getSupplierProformasAction(supplierId: number) {
  try {
    const rows = await readDataWithAuth<Record<string, unknown>[]>(`/suppliers/${supplierId}/proformas`);
    return { success: true as const, data: rows.map(mapProforma) };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { success: false as const, error: error?.message || 'خطا در دریافت بایگانی' };
  }
}

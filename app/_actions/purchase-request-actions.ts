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
  uploadPatchDataWithAuth,
} from '@/app/core/http-service/http-service';
import type {
  CreatePurchaseRequestPayload,
  PaginatedPurchaseRequests,
  PurchaseProforma,
  PurchaseRequest,
  UpdatePurchaseRequestPayload,
} from '@/app/_types/purchase-request.types';

function mapPurchaseRequest(raw: unknown): PurchaseRequest {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const items = Array.isArray(r.items)
    ? (r.items as Record<string, unknown>[]).map((li) => ({
        id: li.id != null ? Number(li.id) : undefined,
        itemId: (li.item_id ?? li.itemId) as number | null | undefined,
        itemName: String(li.item_name ?? li.itemName ?? ''),
        quantity: Number(li.quantity ?? 0),
        description: (li.description as string | null) ?? null,
        stockOnHand:
          li.stock_on_hand != null || li.stockOnHand != null
            ? Number(li.stock_on_hand ?? li.stockOnHand)
            : li.warehouse_stock != null || li.warehouseStock != null
              ? Number(li.warehouse_stock ?? li.warehouseStock)
              : null,
      }))
    : [];
  return {
    id: Number(r.id),
    type: String(r.type ?? 'purchase'),
    status: String(r.status ?? ''),
    requesterId: Number(r.requester_id ?? r.requesterId ?? 0),
    requesterName: (r.requester_name ?? r.requesterName) as string | null | undefined,
    title: (r.title as string | null) ?? null,
    reason: (r.reason as string | null) ?? null,
    items,
    workflowInstanceId: (r.workflow_instance_id ?? r.workflowInstanceId) as number | null | undefined,
    workflowProgress: mapWorkflowProgress(r.workflow_progress ?? r.workflowProgress),
    paymentRequestId: (r.payment_request_id ?? r.paymentRequestId) as number | null | undefined,
    purchaseOrderId: (r.purchase_order_id ?? r.purchaseOrderId) as number | null | undefined,
    payment: mapPaymentSummary(r.payment),
    purchaseOrder: mapPurchaseOrderSummary(r.purchase_order ?? r.purchaseOrder),
    createdAt: (r.created_at ?? r.createdAt) as string | null | undefined,
    attachments: parseAttachmentsFromApi(r.attachments).map((a) => ({
      id: typeof a.id === 'number' ? a.id : undefined,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
    })),
    invoices: parseAttachmentsFromApi(r.invoices).map((a) => ({
      id: typeof a.id === 'number' ? a.id : undefined,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      downloadUrl:
        typeof a.id === 'number' ? attachmentProxyDownloadPath(a.id) : a.fileUrl,
    })),
    bolAttachments: parseAttachmentsFromApi(r.bol_attachments ?? r.bolAttachments).map((a) => ({
      id: typeof a.id === 'number' ? a.id : undefined,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      downloadUrl:
        typeof a.id === 'number' ? attachmentProxyDownloadPath(a.id) : a.fileUrl,
    })),
    approvedPaymentMethod: (r.approved_payment_method ?? r.approvedPaymentMethod) as
      | string
      | null
      | undefined,
    approvedPaymentComment: (r.approved_payment_comment ?? r.approvedPaymentComment) as
      | string
      | null
      | undefined,
    approvedPaymentLocation: (r.approved_payment_location ?? r.approvedPaymentLocation) as
      | string
      | null
      | undefined,
    approvedCheckNumber: (r.approved_check_number ?? r.approvedCheckNumber) as
      | string
      | null
      | undefined,
    approvedCheckDueDate: (r.approved_check_due_date ?? r.approvedCheckDueDate) as
      | string
      | null
      | undefined,
    approvedCheckBank: (r.approved_check_bank ?? r.approvedCheckBank) as string | null | undefined,
    invoicePaidAt: (r.invoice_paid_at ?? r.invoicePaidAt) as string | null | undefined,
    warehouseId:
      r.warehouse_id != null || r.warehouseId != null
        ? Number(r.warehouse_id ?? r.warehouseId)
        : null,
    warehouseName: (r.warehouse_name ?? r.warehouseName) as string | null | undefined,
    destinationWarehouseId: (r.destination_warehouse_id ?? r.destinationWarehouseId) as
      | number
      | null
      | undefined,
    destinationWarehouseName: (r.destination_warehouse_name ?? r.destinationWarehouseName) as
      | string
      | null
      | undefined,
    canEditItems: Boolean(r.can_edit_items ?? r.canEditItems),
    canEditStock: Boolean(r.can_edit_stock ?? r.canEditStock),
    canUploadProforma: Boolean(r.can_upload_proforma ?? r.canUploadProforma),
    canSubmitProforma: Boolean(r.can_submit_proforma ?? r.canSubmitProforma),
    currentStepAction: (r.current_step_action ?? r.currentStepAction) as string | null | undefined,
    proformas: Array.isArray(r.proformas)
      ? (r.proformas as Record<string, unknown>[]).map(mapProforma)
      : undefined,
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
      phase: String(p.phase ?? '') as 'phase1' | 'phase2' | 'purchase',
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
  const amount = Number(raw.amount ?? raw.total_amount ?? raw.totalAmount ?? 0);
  return {
    id: Number(raw.id),
    requestId: Number(raw.request_id ?? raw.requestId),
    supplierId: Number(raw.supplier_id ?? raw.supplierId),
    supplierName: (raw.supplier_name ?? raw.supplierName) as string | null | undefined,
    amount,
    totalAmount: amount,
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
      warehouseId: payload.warehouseId,
      title: payload.title?.trim() || undefined,
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
  query.set('sortBy', 'created_at');
  query.set('sortOrder', 'desc');
  if (params?.search) query.set('search', params.search);
  if (params?.filterBy) query.set('filterBy', params.filterBy);
  if (params?.filterValue) query.set('filterValue', params.filterValue);
  if (params?.scope && params.scope !== 'mine') query.set('scope', params.scope);
  try {
    const data = await readDataWithAuth<Omit<PaginatedPurchaseRequests, 'items'> & { items?: unknown[] }>(
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
  payload: UpdatePurchaseRequestPayload,
) {
  try {
    const body = {
      title: payload.title?.trim() || undefined,
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

/** سرپرست مالی — ذخیره موجودی انبار قبل از تأیید مرحله fill_stock */
export async function updatePurchaseStockLevelsAction(
  requestId: string | number,
  items: { id: number; warehouseStock: number }[],
) {
  try {
    const body = {
      items: items.map((row) => ({
        id: row.id,
        warehouseStock: row.warehouseStock,
      })),
    };
    const data = await patchDataWithAuth<typeof body, Record<string, unknown>>(
      `/requests/purchase/${requestId}/stock`,
      body,
    );
    return { success: true as const, data: mapPurchaseRequest(data) };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'ثبت موجودی انبار ناموفق بود'),
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
    formData.set('supplierId', String(input.supplierId));
    formData.set('amount', String(input.amount));
    formData.set('totalAmount', String(input.amount));
    if (input.notes) formData.set('notes', input.notes);
    formData.set('file', input.file);
    const data = await uploadDataWithAuth<Record<string, unknown>>(
      `/requests/purchase/${requestId}/proformas`,
      formData,
    );
    return { success: true as const, data: mapProforma(data) };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در آپلود پیش‌فاکتور'),
    };
  }
}

export async function updatePurchaseProformaAction(
  requestId: number,
  proformaId: number,
  input: {
    supplierId?: number;
    amount?: number;
    notes?: string;
    file?: File | null;
  },
) {
  try {
    const formData = new FormData();
    if (input.supplierId != null) formData.set('supplierId', String(input.supplierId));
    if (input.amount != null) {
      formData.set('amount', String(input.amount));
      formData.set('totalAmount', String(input.amount));
    }
    if (input.notes != null) formData.set('notes', input.notes);
    if (input.file) formData.set('file', input.file);
    const data = await uploadPatchDataWithAuth<Record<string, unknown>>(
      `/requests/purchase/${requestId}/proformas/${proformaId}`,
      formData,
    );
    return { success: true as const, data: mapProforma(data) };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'ویرایش پیش‌فاکتور ناموفق بود'),
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
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در ارسال پیش‌فاکتور'),
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

'use server';

import {
  attachmentProxyDownloadPath,
  extractAttachmentId,
} from '@/app/utils/attachment-display.utils';
import {
  createDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
  uploadDataWithAuth,
} from '@/app/core/http-service/http-service';
import type { CreateGrnModel, Grn, UpdateGrnModel } from '@/app/_types/grn.types';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

function mapGrnDownloadUrl(raw: Record<string, unknown>): string | undefined {
  const backendUrl = String(raw.download_url ?? raw.downloadUrl ?? '').trim();
  const attachmentId = extractAttachmentId(backendUrl);
  if (attachmentId) return attachmentProxyDownloadPath(attachmentId);
  return backendUrl || undefined;
}

function mapGrn(raw: Record<string, unknown>): Grn {
  const lines = Array.isArray(raw.lines)
    ? (raw.lines as Record<string, unknown>[]).map((li) => ({
        id: li.id as number | undefined,
        requestItemId: (li.request_item_id ?? li.requestItemId) as number | null | undefined,
        itemId: Number(li.item_id ?? li.itemId),
        itemName: (li.item_name ?? li.itemName) as string | null | undefined,
        quantityReceived: Number(li.quantity_received ?? li.quantityReceived ?? 0),
        unitPrice: li.unit_price != null ? Number(li.unit_price) : (li.unitPrice as number | undefined),
      }))
    : [];
  return {
    id: Number(raw.id),
    grnNo: (raw.grn_no ?? raw.grnNo) as string | null | undefined,
    requestId: Number(raw.request_id ?? raw.requestId),
    supplierId: Number(raw.supplier_id ?? raw.supplierId),
    supplierName: (raw.supplier_name ?? raw.supplierName) as string | null | undefined,
    warehouseId: Number(raw.warehouse_id ?? raw.warehouseId),
    warehouseName: (raw.warehouse_name ?? raw.warehouseName) as string | null | undefined,
    proformaId: (raw.proforma_id ?? raw.proformaId) as number | null | undefined,
    status: String(raw.status ?? 'draft') as Grn['status'],
    invoiceNotes: (raw.invoice_notes ?? raw.invoiceNotes) as string | null | undefined,
    receiptDate: (raw.receipt_date ?? raw.receiptDate) as string | null | undefined,
    createdAt: (raw.created_at ?? raw.createdAt) as string | null | undefined,
    postedAt: (raw.posted_at ?? raw.postedAt) as string | null | undefined,
    lines,
    requestStatus: (raw.request_status ?? raw.requestStatus) as string | null | undefined,
    fileName: (raw.file_name ?? raw.fileName) as string | null | undefined,
    downloadUrl: mapGrnDownloadUrl(raw),
  };
}

function toCreateBody(model: CreateGrnModel) {
  return {
    request_id: model.requestId,
    warehouse_id: model.warehouseId,
    supplier_id: model.supplierId,
    receipt_date: model.receiptDate,
    invoice_notes: model.invoiceNotes,
    lines: model.lines?.map((l) => ({
      request_item_id: l.requestItemId,
      item_id: l.itemId,
      item_name: l.itemName,
      quantity_received: l.quantityReceived,
      unit_price: l.unitPrice,
    })),
  };
}

export async function getGrnsAction(params?: {
  page?: number;
  pageSize?: number;
  requestId?: number;
  search?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 10));
  if (params?.requestId) query.set('requestId', String(params.requestId));
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('filterBy', 'status');
  if (params?.status) query.set('filterValue', params.status);
  try {
    const data = await readDataWithAuth<PaginatedResponse<Record<string, unknown>>>(`/grn?${query}`);
    return {
      success: true as const,
      data: {
        ...data,
        items: (data.items ?? []).map(mapGrn),
      },
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { success: false as const, error: error?.message || 'خطا در دریافت رسیدها' };
  }
}

export async function getGrnAction(id: number) {
  try {
    const data = await readDataWithAuth<Record<string, unknown>>(`/grn/${id}`);
    return { success: true as const, data: mapGrn(data) };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { success: false as const, error: error?.message || 'رسید یافت نشد' };
  }
}

export async function createGrnAction(model: CreateGrnModel) {
  try {
    const data = await createDataWithAuth<ReturnType<typeof toCreateBody>, Record<string, unknown>>(
      '/grn',
      toCreateBody(model),
    );
    return { success: true as const, data: mapGrn(data) };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { detail?: string } } };
    return {
      success: false as const,
      error: error?.response?.data?.detail || error?.message || 'خطا در ایجاد رسید',
    };
  }
}

export async function updateGrnAction(id: number, model: UpdateGrnModel) {
  try {
    const body: Record<string, unknown> = {};
    if (model.warehouseId != null) body.warehouse_id = model.warehouseId;
    if (model.receiptDate != null) body.receipt_date = model.receiptDate;
    if (model.invoiceNotes != null) body.invoice_notes = model.invoiceNotes;
    if (model.lines) {
      body.lines = model.lines.map((l) => ({
        request_item_id: l.requestItemId,
        item_id: l.itemId,
        item_name: l.itemName,
        quantity_received: l.quantityReceived,
        unit_price: l.unitPrice,
      }));
    }
    const data = await updateDataWithAuth<typeof body, Record<string, unknown>>(`/grn/${id}`, body);
    return { success: true as const, data: mapGrn(data) };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { detail?: string } } };
    return {
      success: false as const,
      error: error?.response?.data?.detail || error?.message || 'خطا در به‌روزرسانی رسید',
    };
  }
}

export async function uploadGrnInvoiceAction(grnId: number, file: File) {
  try {
    const formData = new FormData();
    formData.set('file', file);
    const data = await uploadDataWithAuth<Record<string, unknown>>(`/grn/${grnId}/invoice`, formData);
    return { success: true as const, data: mapGrn(data) };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { detail?: string } } };
    return {
      success: false as const,
      error: error?.response?.data?.detail || error?.message || 'خطا در آپلود فاکتور',
    };
  }
}

export async function postGrnAction(grnId: number) {
  try {
    const data = await createDataWithAuth<Record<string, never>, Record<string, unknown>>(
      `/grn/${grnId}/post`,
      {},
    );
    return { success: true as const, data: mapGrn(data) };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { detail?: string } } };
    return {
      success: false as const,
      error: error?.response?.data?.detail || error?.message || 'خطا در ثبت نهایی رسید',
    };
  }
}

export async function getGrnWarehousesAction() {
  try {
    const data = await readDataWithAuth<{ items: { id: number; name: string }[] }>('/grn/meta/warehouses');
    return { success: true as const, data: data.items ?? [] };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { success: false as const, error: error?.message || 'خطا در دریافت انبارها' };
  }
}

'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
} from '@/app/core/http-service/http-service';
import { CreatePurchaseOrderModel, PurchaseOrder, UpdatePurchaseOrderModel } from '@/app/_types/purchase-order.types';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[PURCHASE-ORDER-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function getPurchaseOrdersAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  id?: number;
  request_id?: string;
  supplier_name?: string;
  status?: string;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.search) query.set('search', params.search);
  if (params?.id !== undefined && params.id !== null && Number.isFinite(params.id)) query.set('id', String(params.id));
  if (params?.request_id) query.set('request_id', params.request_id);
  if (params?.supplier_name) query.set('supplier_name', params.supplier_name);
  if (params?.status) query.set('status', params.status);

  const url = `/purchase-orders?${query.toString()}`;
  try {
    log('info', 'getPurchaseOrdersAction request', { url, params });
    const data = await readDataWithAuth<PaginatedResponse<PurchaseOrder>>(url);
    log('info', 'getPurchaseOrdersAction success', { total: data?.total, itemCount: data?.items?.length });
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'getPurchaseOrdersAction failed', { error: error?.message, url });
    return { success: false, error: error?.message || 'خطا در دریافت سفارش‌های خرید' };
  }
}

export async function createPurchaseOrderAction(model: CreatePurchaseOrderModel) {
  try {
    const data = await createDataWithAuth<CreatePurchaseOrderModel, PurchaseOrder>('/purchase-orders', model);
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'createPurchaseOrderAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در ایجاد سفارش خرید',
    };
  }
}

export async function updatePurchaseOrderAction(id: number, model: UpdatePurchaseOrderModel) {
  try {
    const data = await updateDataWithAuth<UpdatePurchaseOrderModel, PurchaseOrder>(`/purchase-orders/${id}`, model);
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'updatePurchaseOrderAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در به‌روزرسانی سفارش خرید',
    };
  }
}

export async function deletePurchaseOrderAction(id: number) {
  try {
    await deleteDataWithAuth(`/purchase-orders/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'deletePurchaseOrderAction failed', { error: error?.message });
    return { success: false, error: error?.message || 'خطا در حذف سفارش خرید' };
  }
}


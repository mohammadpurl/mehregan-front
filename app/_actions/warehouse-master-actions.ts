'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
} from '@/app/core/http-service/http-service';
import { CreateWarehouseModel, UpdateWarehouseModel, Warehouse } from '@/app/_types/warehouse-master.types';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[WAREHOUSE-MASTER-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function getWarehouseMastersAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  id?: number;
  name?: string;
  code?: string;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.search) query.set('search', params.search);
  if (params?.id !== undefined && params.id !== null && Number.isFinite(params.id)) {
    query.set('id', String(params.id));
  }
  if (params?.name) query.set('name', params.name);
  if (params?.code) query.set('code', params.code);

  const url = `/warehouses?${query.toString()}`;
  try {
    log('info', 'getWarehouseMastersAction request', { url, params });
    const data = await readDataWithAuth<PaginatedResponse<Warehouse>>(url);
    log('info', 'getWarehouseMastersAction success', { total: data?.total, itemCount: data?.items?.length });
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'getWarehouseMastersAction failed', { error: error?.message, page, pageSize, url });
    return { success: false, error: error?.message || 'خطا در دریافت انبارها' };
  }
}

export async function createWarehouseMasterAction(model: CreateWarehouseModel) {
  try {
    const data = await createDataWithAuth<CreateWarehouseModel, Warehouse>('/warehouses', model);
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'createWarehouseMasterAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در ایجاد انبار',
    };
  }
}

export async function updateWarehouseMasterAction(id: number, model: UpdateWarehouseModel) {
  try {
    const data = await updateDataWithAuth<UpdateWarehouseModel, Warehouse>(`/warehouses/${id}`, model);
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'updateWarehouseMasterAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در به‌روزرسانی انبار',
    };
  }
}

export async function deleteWarehouseMasterAction(id: number) {
  try {
    await deleteDataWithAuth(`/warehouses/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'deleteWarehouseMasterAction failed', { error: error?.message });
    return { success: false, error: error?.message || 'خطا در حذف انبار' };
  }
}


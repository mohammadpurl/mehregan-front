'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
} from '@/app/core/http-service/http-service';
import { CreateSupplierModel, Supplier, UpdateSupplierModel } from '@/app/_types/supplier.types';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[SUPPLIER-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function getSuppliersAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  id?: number;
  name?: string;
  code?: string;
  phone?: string;
  email?: string;
  activeOnly?: boolean;
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
  if (params?.phone) query.set('phone', params.phone);
  if (params?.email) query.set('email', params.email);
  if (params?.activeOnly) query.set('activeOnly', 'true');

  const url = `/suppliers?${query.toString()}`;
  try {
    log('info', 'getSuppliersAction request', { url, params });
    const data = await readDataWithAuth<PaginatedResponse<Supplier>>(url);
    log('info', 'getSuppliersAction success', { total: data?.total, itemCount: data?.items?.length });
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'getSuppliersAction failed', { error: error?.message, page, pageSize, url });
    return { success: false, error: error?.message || 'خطا در دریافت تامین‌کنندگان' };
  }
}

export async function createSupplierAction(model: CreateSupplierModel) {
  try {
    const data = await createDataWithAuth<CreateSupplierModel, Supplier>('/suppliers', model);
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'createSupplierAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در ایجاد تامین‌کننده',
    };
  }
}

export async function updateSupplierAction(id: number, model: UpdateSupplierModel) {
  try {
    const data = await updateDataWithAuth<UpdateSupplierModel, Supplier>(`/suppliers/${id}`, model);
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'updateSupplierAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در به‌روزرسانی تامین‌کننده',
    };
  }
}

export async function deleteSupplierAction(id: number) {
  try {
    await deleteDataWithAuth(`/suppliers/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'deleteSupplierAction failed', { error: error?.message });
    return { success: false, error: error?.message || 'خطا در حذف تامین‌کننده' };
  }
}


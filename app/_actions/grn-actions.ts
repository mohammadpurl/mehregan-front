'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
} from '@/app/core/http-service/http-service';
import { CreateGrnModel, Grn, UpdateGrnModel } from '@/app/_types/grn.types';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[GRN-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function getGrnsAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  id?: number;
  po_id?: string;
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
  if (params?.po_id) query.set('po_id', params.po_id);
  if (params?.supplier_name) query.set('supplier_name', params.supplier_name);
  if (params?.status) query.set('status', params.status);

  const url = `/grn?${query.toString()}`;
  try {
    log('info', 'getGrnsAction request', { url, params });
    const data = await readDataWithAuth<PaginatedResponse<Grn>>(url);
    log('info', 'getGrnsAction success', { total: data?.total, itemCount: data?.items?.length });
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'getGrnsAction failed', { error: error?.message, url });
    return { success: false, error: error?.message || 'خطا در دریافت رسیدهای کالا' };
  }
}

export async function createGrnAction(model: CreateGrnModel) {
  try {
    const data = await createDataWithAuth<CreateGrnModel, Grn>('/grn', model);
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'createGrnAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در ایجاد رسید کالا',
    };
  }
}

export async function updateGrnAction(id: number, model: UpdateGrnModel) {
  try {
    const data = await updateDataWithAuth<UpdateGrnModel, Grn>(`/grn/${id}`, model);
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'updateGrnAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در به‌روزرسانی رسید کالا',
    };
  }
}

export async function deleteGrnAction(id: number) {
  try {
    await deleteDataWithAuth(`/grn/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'deleteGrnAction failed', { error: error?.message });
    return { success: false, error: error?.message || 'خطا در حذف رسید کالا' };
  }
}


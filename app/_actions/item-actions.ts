'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
} from '@/app/core/http-service/http-service';
import { CreateItemModel, Item, UpdateItemModel } from '@/app/_types/item.types';

type ItemApiRow = {
  id: number;
  name: string;
  sku?: string | null;
  code?: string | null;
  unit?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  description?: string | null;
  category_id?: number | null;
  categoryId?: number | null;
  category_name?: string | null;
  categoryName?: string | null;
};

function normalizeItem(raw: ItemApiRow): Item {
  return {
    id: raw.id,
    name: raw.name,
    sku: raw.sku ?? raw.code ?? null,
    unit: raw.unit ?? null,
    is_active: raw.is_active ?? raw.isActive,
    description: raw.description ?? null,
    category_id: raw.category_id ?? raw.categoryId ?? null,
    category_name: raw.category_name ?? raw.categoryName ?? null,
  };
}

type ItemApiCreateBody = {
  name: string;
  code: string;
  category_id: number | null;
  unit?: string;
};

type ItemApiUpdateBody = {
  name?: string;
  code?: string;
  category_id?: number | null;
  unit?: string;
  is_active?: boolean;
};

function toApiCreateBody(model: CreateItemModel): ItemApiCreateBody {
  return {
    name: model.name,
    code: (model.sku?.trim() || model.name).trim(),
    category_id: model.category_id ?? null,
    unit: model.unit,
  };
}

function toApiUpdateBody(model: UpdateItemModel): ItemApiUpdateBody {
  const body: ItemApiUpdateBody = {
    name: model.name,
    category_id: model.category_id,
    unit: model.unit,
    is_active: model.is_active,
  };
  if (model.sku?.trim()) {
    body.code = model.sku.trim();
  }
  return body;
}

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[ITEM-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function getItemsAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  id?: number;
  name?: string;
  sku?: string;
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
  if (params?.sku) query.set('sku', params.sku);

  const url = `/items?${query.toString()}`;
  try {
    log('info', 'getItemsAction request', { url, params });
    const data = await readDataWithAuth<PaginatedResponse<ItemApiRow>>(url);
    const normalized = {
      ...data,
      items: (data?.items ?? []).map(normalizeItem),
    };
    log('info', 'getItemsAction success', { total: normalized?.total, itemCount: normalized?.items?.length });
    return { success: true, data: normalized };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'getItemsAction failed', { error: error?.message, page, pageSize, url });
    return { success: false, error: error?.message || 'خطا در دریافت کالاها' };
  }
}

export async function createItemAction(model: CreateItemModel) {
  try {
    const data = await createDataWithAuth<ItemApiCreateBody, ItemApiRow>('/items', toApiCreateBody(model));
    const normalized = normalizeItem(data);
    return { success: true, data: normalized };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'createItemAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در ایجاد کالا',
    };
  }
}

export async function updateItemAction(id: number, model: UpdateItemModel) {
  try {
    const data = await updateDataWithAuth<ItemApiUpdateBody, ItemApiRow>(`/items/${id}`, toApiUpdateBody(model));
    return { success: true, data: normalizeItem(data) };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'updateItemAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در به‌روزرسانی کالا',
    };
  }
}

export async function deleteItemAction(id: number) {
  try {
    await deleteDataWithAuth(`/items/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'deleteItemAction failed', { error: error?.message });
    return { success: false, error: error?.message || 'خطا در حذف کالا' };
  }
}


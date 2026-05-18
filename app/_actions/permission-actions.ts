'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
} from '@/app/core/http-service/http-service';
import {
  CreatePermissionModel,
  Permission,
  UpdatePermissionModel,
} from '@/app/_types/permission.types';
import { extractActionErrorMessage } from './extract-action-error';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[PERMISSION-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function getPermissionsAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  id?: number;
  code?: string;
  name?: string;
}) {
  const PERMISSIONS_MAX_PAGE_SIZE = 100;
  const page = params?.page ?? 1;
  const pageSize = Math.min(params?.pageSize ?? 10, PERMISSIONS_MAX_PAGE_SIZE);
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
  const url = `/permissions?${query.toString()}`;
  try {
    log('info', 'getPermissionsAction request', { url, params });
    const data = await readDataWithAuth<PaginatedResponse<Permission>>(url);
    log('info', 'getPermissionsAction success', { total: data?.total, itemCount: data?.items?.length });
    return { success: true, data };
  } catch (err: unknown) {
    const message = extractActionErrorMessage(err, 'خطا در دریافت مجوزها');
    log('error', 'getPermissionsAction failed', { error: message, page, pageSize, url });
    return { success: false, error: message };
  }
}

export async function getAllPermissionsAction() {
  const pageSize = 100;
  const items: Permission[] = [];
  let page = 1;
  let total = 0;

  while (page === 1 || items.length < total) {
    const result = await getPermissionsAction({ page, pageSize });
    if (!result.success || !result.data) {
      return result;
    }
    items.push(...(result.data.items ?? []));
    total = result.data.total ?? items.length;
    if ((result.data.items?.length ?? 0) < pageSize) break;
    page += 1;
    if (page > 50) break;
  }

  return {
    success: true as const,
    data: { items, total: items.length, page: 1, pageSize: items.length },
  };
}

export async function createPermissionAction(model: CreatePermissionModel) {
  try {
    log('info', 'createPermissionAction request', { model });
    const data = await createDataWithAuth<CreatePermissionModel, Permission>('/permissions', model);
    return { success: true, data };
  } catch (err: unknown) {
    const message = extractActionErrorMessage(err, 'خطا در ایجاد مجوز');
    log('error', 'createPermissionAction failed', { error: message, model });
    return { success: false, error: message };
  }
}

export async function updatePermissionAction(id: number, model: UpdatePermissionModel) {
  try {
    const data = await updateDataWithAuth<UpdatePermissionModel, Permission>(`/permissions/${id}`, model);
    return { success: true, data };
  } catch (err: unknown) {
    const message = extractActionErrorMessage(err, 'خطا در به‌روزرسانی مجوز');
    log('error', 'updatePermissionAction failed', { error: message, id });
    return { success: false, error: message };
  }
}

export async function deletePermissionAction(id: number) {
  try {
    await deleteDataWithAuth(`/permissions/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const message = extractActionErrorMessage(err, 'خطا در حذف مجوز');
    log('error', 'deletePermissionAction failed', { error: message, id });
    return { success: false, error: message };
  }
}


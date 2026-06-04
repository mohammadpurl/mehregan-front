'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
} from '@/app/core/http-service/http-service';
import { CreateRoleModel, Role, UpdateRoleModel } from '@/app/_types/role.types';

function normalizeRole(raw: Record<string, unknown>): Role {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    displayName:
      raw.displayName != null
        ? String(raw.displayName)
        : raw.display_name != null
          ? String(raw.display_name)
          : null,
    isSingleton: Boolean(raw.isSingleton ?? raw.is_singleton ?? false),
  };
}

function normalizeRoleList(data: PaginatedResponse<Record<string, unknown>>): PaginatedResponse<Role> {
  return {
    ...data,
    items: (data.items ?? []).map((row) => normalizeRole(row as Record<string, unknown>)),
  };
}
import { extractActionErrorMessage } from './extract-action-error';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

/** حداکثر pageSize مجاز API نقش‌ها */
const ROLES_MAX_PAGE_SIZE = 100;

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[ROLE-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function getRolesAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  id?: number;
  name?: string;
}) {
  const page = params?.page ?? 1;
  const pageSize = Math.min(params?.pageSize ?? 10, ROLES_MAX_PAGE_SIZE);
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
  const url = `/roles?${query.toString()}`;
  try {
    log('info', 'getRolesAction request', { url, params });
    const data = await readDataWithAuth<PaginatedResponse<Record<string, unknown>>>(url);
    const normalized = normalizeRoleList(data);
    log('info', 'getRolesAction success', {
      total: normalized?.total,
      itemCount: normalized?.items?.length,
    });
    return { success: true, data: normalized };
  } catch (err: unknown) {
    const message = extractActionErrorMessage(err, 'خطا در دریافت نقش‌ها');
    log('error', 'getRolesAction failed', { error: message, page, pageSize, url });
    return { success: false, error: message };
  }
}

/** بارگذاری همه نقش‌ها برای select (چند صفحه تا سقف ۱۰۰ تایی API) */
export async function getAllRolesAction() {
  const pageSize = ROLES_MAX_PAGE_SIZE;
  const items: Role[] = [];
  let page = 1;
  let total = 0;

  while (page === 1 || items.length < total) {
    const result = await getRolesAction({ page, pageSize });
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

export async function createRoleAction(model: CreateRoleModel) {
  try {
    const payload = {
      name: model.name,
      displayName: model.displayName,
      isSingleton: model.isSingleton ?? false,
    };
    const raw = await createDataWithAuth<typeof payload, Record<string, unknown>>('/roles', payload);
    return { success: true, data: normalizeRole(raw) };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'createRoleAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در ایجاد نقش',
    };
  }
}

export async function updateRoleAction(id: number, model: UpdateRoleModel) {
  try {
    const payload = {
      name: model.name,
      displayName: model.displayName,
      isSingleton: model.isSingleton,
    };
    const raw = await updateDataWithAuth<typeof payload, Record<string, unknown>>(
      `/roles/${id}`,
      payload,
    );
    return { success: true, data: normalizeRole(raw) };
  } catch (err: unknown) {
    const error = err as { message?: string; response?: { data?: { message?: string } } };
    log('error', 'updateRoleAction failed', { error: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'خطا در به‌روزرسانی نقش',
    };
  }
}

export async function deleteRoleAction(id: number) {
  try {
    await deleteDataWithAuth(`/roles/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'deleteRoleAction failed', { error: error?.message });
    return { success: false, error: error?.message || 'خطا در حذف نقش' };
  }
}


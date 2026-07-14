'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  patchDataWithAuth,
  readDataWithAuth,
} from '@/app/core/http-service/http-service';
import {
  AdminUser,
  CreateUserModel,
  ManagerLookupItem,
  UpdateUserModel,
} from '@/app/_types/user.types';
import { normalizeAdminUser, normalizeAdminUserList } from '@/app/utils/user-mapper';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[USER-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function getUsersAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  id?: number;
  username?: string;
  email?: string;
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
  if (params?.username) query.set('username', params.username);
  if (params?.email) query.set('email', params.email);
  const url = `/users?${query.toString()}`;
  try {
    log('info', 'getUsersAction request', { url, params });
    const data = await readDataWithAuth<PaginatedResponse<AdminUser>>(url);
    const normalized = {
      ...data,
      items: normalizeAdminUserList(data?.items ?? []),
    };
    log('info', 'getUsersAction success', { total: normalized?.total, itemCount: normalized?.items?.length });
    return { success: true, data: normalized };
  } catch (err: unknown) {
    const error = err as { message?: string };
    log('error', 'getUsersAction failed', { error: error?.message, page, pageSize, url });
    return { success: false, error: error?.message || 'خطا در دریافت کاربران' };
  }
}

function managerLookupLabel(user: AdminUser): string {
  const fromApi = user.full_name?.trim();
  const fromParts = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  const name = fromApi || fromParts;
  return name ? `${name} (${user.username})` : user.username;
}

/** جستجوی paginated کاربران برای انتخاب مدیر مستقیم */
export async function lookupUsersForManagerAction(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
  excludeUserId?: number | null;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  try {
    const result = await getUsersAction({
      page,
      pageSize,
      search: params?.search?.trim() || undefined,
    });
    if (!result.success || !result.data?.items) {
      return {
        success: false as const,
        error: result.error || 'جستجوی کاربران ناموفق بود',
        data: { items: [] as ManagerLookupItem[], total: 0, rawCount: 0 },
      };
    }
    const rawItems = result.data.items;
    const items = rawItems
      .filter((user) => (params?.excludeUserId != null ? user.id !== params.excludeUserId : true))
      .map((user) => ({ id: user.id, label: managerLookupLabel(user) }));
    return {
      success: true as const,
      data: {
        items,
        total: result.data.total ?? rawItems.length,
        rawCount: rawItems.length,
      },
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return {
      success: false as const,
      error: error?.message || 'جستجوی کاربران ناموفق بود',
      data: { items: [] as ManagerLookupItem[], total: 0, rawCount: 0 },
    };
  }
}

export async function createUserAction(model: CreateUserModel) {
  try {
    const data = normalizeAdminUser(await createDataWithAuth<CreateUserModel, unknown>('/users', model));
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as {
      message?: string;
      detail?: string;
      response?: { data?: { message?: string; detail?: string } };
    };
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.detail ||
      error?.message ||
      'خطا در ایجاد کاربر';
    log('error', 'createUserAction failed', { error: message });
    return { success: false, error: message };
  }
}

export async function updateUserAction(id: number, model: UpdateUserModel) {
  const body: UpdateUserModel = { ...model };
  if (!body.password?.trim()) {
    delete body.password;
  } else {
    body.password = body.password.trim();
  }
  try {
    const data = normalizeAdminUser(
      await patchDataWithAuth<UpdateUserModel, unknown>(`/users/${id}`, body),
    );
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as {
      message?: string;
      detail?: string;
      response?: { data?: { message?: string; detail?: string } };
    };
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.detail ||
      error?.message ||
      'خطا در به‌روزرسانی کاربر';
    log('error', 'updateUserAction failed', { error: message });
    return { success: false, error: message };
  }
}

export async function deleteUserAction(id: number) {
  try {
    await deleteDataWithAuth(`/users/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as { message?: string; detail?: string };
    const message = error?.detail || error?.message || 'خطا در حذف کاربر';
    log('error', 'deleteUserAction failed', { error: message });
    return { success: false, error: message };
  }
}

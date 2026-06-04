import { getRolesAction } from '@/app/_actions/role-actions';
import { getDepartmentsAction } from '@/app/_actions/department-actions';
import { lookupUsersForManagerAction } from '@/app/_actions/user-actions';
import { roleLabel } from '@/app/_types/role.types';
import type { ComboboxPageResult } from '@/app/components/form-input/infinite-scroll-combobox';

export type { ComboboxPageResult };

/** هم‌تراز با pageSize جدول‌های admin */
export const USER_FORM_COMBOBOX_PAGE_SIZE = 10;

export function computeHasMore(
  page: number,
  pageSize: number,
  itemCount: number,
  total?: number,
): boolean {
  if (itemCount <= 0) return false;
  const loadedCount = (page - 1) * pageSize + itemCount;
  if (typeof total === 'number' && total > 0) {
    return loadedCount < total;
  }
  return itemCount >= pageSize;
}

export async function fetchRolesPage(page: number, search: string): Promise<ComboboxPageResult> {
  const pageSize = USER_FORM_COMBOBOX_PAGE_SIZE;
  const result = await getRolesAction({ page, pageSize, search: search || undefined });
  if (!result.success || !result.data) {
    throw new Error(result.error || 'دریافت نقش‌ها ناموفق بود');
  }
  const items = result.data.items ?? [];
  const total = result.data.total ?? items.length;
  return {
    items: items.map((role) => ({
      value: String(role.id),
      label: roleLabel(role),
    })),
    total,
    hasMore: computeHasMore(page, pageSize, items.length, total),
  };
}

export async function fetchDepartmentsPage(page: number, search: string): Promise<ComboboxPageResult> {
  const pageSize = USER_FORM_COMBOBOX_PAGE_SIZE;
  const result = await getDepartmentsAction({
    page,
    pageSize,
    search: search || undefined,
  });
  if (!result.success || !result.data) {
    throw new Error(result.error || 'دریافت واحدهای سازمانی ناموفق بود');
  }
  const items = result.data.items ?? [];
  const total = result.data.total ?? items.length;
  return {
    items: items.map((dept) => ({
      value: String(dept.id),
      label: dept.name,
    })),
    total,
    hasMore: computeHasMore(page, pageSize, items.length, total),
  };
}

export async function fetchManagersPage(
  page: number,
  search: string,
  excludeUserId?: number,
): Promise<ComboboxPageResult> {
  const pageSize = USER_FORM_COMBOBOX_PAGE_SIZE;
  const result = await lookupUsersForManagerAction({
    page,
    pageSize,
    search: search || undefined,
    excludeUserId,
  });
  if (!result.success || !result.data) {
    throw new Error(result.error || 'جستجوی کاربران ناموفق بود');
  }
  const rawCount = result.data.rawCount ?? result.data.items.length;
  return {
    items: result.data.items.map((item) => ({ value: String(item.id), label: item.label })),
    total: result.data.total,
    hasMore: computeHasMore(page, pageSize, rawCount, result.data.total),
  };
}

'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
} from '@/app/core/http-service/http-service';
import type {
  Category,
  CategoryTreeNode,
  CreateCategoryModel,
  UpdateCategoryModel,
} from '@/app/_types/category.types';
import { extractActionErrorMessage } from './extract-action-error';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

export async function getCategoriesTreeAction() {
  try {
    const data = await readDataWithAuth<CategoryTreeNode[]>('/categories/tree');
    return { success: true as const, data: Array.isArray(data) ? data : [] };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت درخت گروه‌ها') };
  }
}

export async function getCategoriesAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  parentId?: number | null;
  rootsOnly?: boolean;
}) {
  const page = params?.page ?? 1;
  const pageSize = Math.min(params?.pageSize ?? 100, 100);
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.search) query.set('search', params.search);
  if (params?.rootsOnly) query.set('rootsOnly', 'true');
  if (params?.parentId != null && Number.isFinite(params.parentId)) {
    query.set('parentId', String(params.parentId));
  }

  try {
    const data = await readDataWithAuth<PaginatedResponse<Category>>(`/categories?${query.toString()}`);
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت گروه‌ها') };
  }
}

export async function getAllCategoriesMetaAction() {
  const pageSize = 100;
  const items: Category[] = [];
  let page = 1;
  let total = 0;

  while (page === 1 || items.length < total) {
    const result = await getCategoriesAction({ page, pageSize, sortBy: 'name', sortOrder: 'asc' });
    if (!result.success || !result.data) {
      return result;
    }
    items.push(...(result.data.items ?? []));
    total = result.data.total ?? items.length;
    if ((result.data.items?.length ?? 0) < pageSize) break;
    page += 1;
    if (page > 50) break;
  }

  return { success: true as const, data: items };
}

export async function getCategoryAction(id: number) {
  try {
    const data = await readDataWithAuth<Category>(`/categories/${id}`);
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'گروه کالا یافت نشد') };
  }
}

export async function createCategoryAction(model: CreateCategoryModel) {
  try {
    const data = await createDataWithAuth<CreateCategoryModel, Category>('/categories', model);
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در ایجاد گروه کالا') };
  }
}

export async function updateCategoryAction(id: number, model: UpdateCategoryModel) {
  try {
    const data = await updateDataWithAuth<UpdateCategoryModel, Category>(`/categories/${id}`, model);
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در به‌روزرسانی گروه کالا') };
  }
}

export async function deleteCategoryAction(id: number) {
  try {
    await deleteDataWithAuth(`/categories/${id}`);
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در حذف گروه کالا') };
  }
}

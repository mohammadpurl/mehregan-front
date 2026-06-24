'use server';

import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
} from '@/app/core/http-service/http-service';
import type {
  Department,
  DepartmentCreatePayload,
  DepartmentListResponse,
  DepartmentUpdatePayload,
} from '@/app/_types/department.types';
import { normalizeDepartment, normalizeDepartmentTree } from '@/app/_utils/department-mapper';
import { extractActionErrorMessage } from './extract-action-error';

export async function getDepartmentTreeAction() {
  try {
    const data = await readDataWithAuth<unknown[]>('/departments/tree');
    return { success: true as const, data: normalizeDepartmentTree(Array.isArray(data) ? data : []) };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت درخت واحدها') };
  }
}

export async function getDepartmentsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  parentId?: number | null;
  rootsOnly?: boolean;
}) {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 200));
  if (params?.search) query.set('search', params.search);
  if (params?.parentId != null) query.set('parentId', String(params.parentId));
  if (params?.rootsOnly) query.set('rootsOnly', 'true');

  try {
    const data = await readDataWithAuth<DepartmentListResponse>(`/departments/?${query.toString()}`);
    const items = (data?.items ?? []).map((item) => normalizeDepartment(item));
    return {
      success: true as const,
      data: { ...data, items },
    };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت لیست واحدها') };
  }
}

export async function createDepartmentAction(payload: DepartmentCreatePayload) {
  try {
    const body: Record<string, unknown> = { name: payload.name.trim() };
    if (payload.parentId != null) body.parentId = payload.parentId;
    if (payload.headUserId != null) body.headUserId = payload.headUserId;

    const data = await createDataWithAuth<Record<string, unknown>, Department>('/departments/', body);
    return { success: true as const, data: normalizeDepartment(data) };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در ایجاد واحد') };
  }
}

export async function updateDepartmentAction(id: number, payload: DepartmentUpdatePayload) {
  try {
    const body: Record<string, unknown> = {};
    if (payload.name !== undefined) body.name = payload.name.trim();
    if (payload.parentId !== undefined) body.parentId = payload.parentId;
    if (payload.headUserId !== undefined) body.headUserId = payload.headUserId;

    const data = await updateDataWithAuth<Record<string, unknown>, Department>(`/departments/${id}`, body);
    return { success: true as const, data: normalizeDepartment(data) };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در به‌روزرسانی واحد') };
  }
}

export async function deleteDepartmentAction(id: number) {
  try {
    await deleteDataWithAuth(`/departments/${id}`);
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در حذف واحد') };
  }
}

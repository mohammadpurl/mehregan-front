'use server';

import {
  createDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
  deleteDataWithAuth,
} from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import { getRequesterFromSession } from '@/app/utils/requester-from-session';
import {
  WorkflowFormData,
  WorkflowResponse,
  WorkflowListResponse,
  WorkflowInstanceListResponse,
  WorkflowInstanceListScope,
} from '../_types/workflow.types';

const BASE = '/workflow-forms';

function toCreatePayload(data: WorkflowFormData) {
  return {
    title: data.title,
    description: data.description,
    receiver_id: data.receiver_id,
    ...(data.type ? { type: data.type } : {}),
  };
}

export async function createWorkflowAction(data: WorkflowFormData) {
  try {
    const response = await createDataWithAuth<ReturnType<typeof toCreatePayload>, WorkflowResponse>(
      BASE,
      toCreatePayload(data),
    );
    return { success: true as const, data: response };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در ایجاد فرم گردش کار') };
  }
}

export async function getWorkflowAction(id: string) {
  try {
    const data = await readDataWithAuth<WorkflowResponse>(`${BASE}/${id}`);
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت فرم گردش کار') };
  }
}

export async function getWorkflowsAction(page: number = 1, pageSize: number = 10) {
  try {
    const data = await readDataWithAuth<WorkflowListResponse>(
      `${BASE}?page=${page}&pageSize=${pageSize}`,
    );
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت لیست فرم‌ها') };
  }
}

export async function getWorkflowsQueryAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  id?: string;
  type?: string;
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
  if (params?.id) query.set('id', params.id);
  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);

  try {
    const data = await readDataWithAuth<WorkflowListResponse>(`${BASE}?${query.toString()}`);
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت لیست فرم‌ها') };
  }
}

export async function updateWorkflowAction(id: string, data: Partial<WorkflowFormData>) {
  try {
    const response = await updateDataWithAuth<Partial<WorkflowFormData>, WorkflowResponse>(
      `${BASE}/${id}`,
      data,
    );
    return { success: true as const, data: response };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در به‌روزرسانی فرم') };
  }
}

export async function getWorkflowInstancesListCapabilitiesAction() {
  try {
    const data = await readDataWithAuth<{ scopes: WorkflowInstanceListScope[] }>(
      '/workflow/instances/list-capabilities',
    );
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت محدوده‌های پیگیری'),
    };
  }
}

export async function getWorkflowInstancesQueryAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  id?: string;
  refType?: string;
  status?: string;
  scope?: WorkflowInstanceListScope;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.search) query.set('search', params.search);
  if (params?.id) query.set('id', params.id);
  if (params?.refType) query.set('refType', params.refType);
  if (params?.status) query.set('status', params.status);
  if (params?.scope) query.set('scope', params.scope);

  try {
    const data = await readDataWithAuth<WorkflowInstanceListResponse>(
      `/workflow/instances?${query.toString()}`,
    );
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت پیگیری گردش‌کار'),
    };
  }
}

export async function deleteWorkflowAction(id: string) {
  try {
    await deleteDataWithAuth(`${BASE}/${id}`);
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در حذف فرم') };
  }
}

'use server';

import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import {
  createDataWithAuth,
  deleteDataWithAuth,
  readDataWithAuth,
} from '@/app/core/http-service/http-service';
import type {
  MissionListScope,
  MissionRequestCreateInput,
  MissionRequestResponse,
} from '@/app/dashboard/mission-requests/_types/mission-request.types';
import {
  missionRequestCreateToBody,
  normalizeMissionRequestFromApi,
} from '@/app/dashboard/mission-requests/_utils/mission-request-mapper';

export async function createMissionRequestAction(input: MissionRequestCreateInput) {
  try {
    const body = missionRequestCreateToBody(input);
    const response = await createDataWithAuth<typeof body, unknown>('/mission-requests/', body);
    const normalized = normalizeMissionRequestFromApi(response);
    if (!normalized) return { success: false as const, error: 'پاسخ سرور نامعتبر بود' };
    return { success: true as const, data: normalized };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'ثبت درخواست ماموریت ناموفق بود') };
  }
}

export async function getMissionRequestListCapabilitiesAction() {
  try {
    const data = await readDataWithAuth<{ scopes: MissionListScope[] }>(
      '/mission-requests/list-capabilities',
    );
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت محدوده لیست'),
    };
  }
}

export async function getMissionRequestListAction(params?: {
  page?: number;
  pageSize?: number;
  scope?: MissionListScope;
  search?: string;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (params?.scope) query.set('scope', params.scope);
  if (params?.search) query.set('search', params.search);
  try {
    const response = await readDataWithAuth<{ items?: unknown[]; total: number }>(
      `/mission-requests/?${query}`,
    );
    const items = (response?.items ?? [])
      .map(normalizeMissionRequestFromApi)
      .filter(Boolean) as MissionRequestResponse[];
    return { success: true as const, data: { items, total: response?.total ?? items.length } };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت لیست ماموریت') };
  }
}

export async function getMissionRequestByIdAction(id: string | number) {
  try {
    const response = await readDataWithAuth<unknown>(`/mission-requests/${id}`);
    const normalized = normalizeMissionRequestFromApi(response);
    if (!normalized) return { success: false as const, error: 'درخواست یافت نشد' };
    return { success: true as const, data: normalized };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت جزئیات') };
  }
}

export async function getMissionRequestByWorkflowInstanceAction(instanceId: number) {
  try {
    const response = await readDataWithAuth<unknown>(
      `/mission-requests/by-workflow-instance/${instanceId}`,
    );
    const normalized = normalizeMissionRequestFromApi(response);
    if (!normalized) {
      return { success: false as const, error: 'درخواست ماموریت برای این نمونه workflow یافت نشد' };
    }
    return { success: true as const, data: normalized };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'درخواست ماموریت برای این نمونه workflow یافت نشد'),
    };
  }
}

export async function submitMissionReportAction(id: string | number, reportText: string) {
  try {
    const response = await createDataWithAuth<{ report_text: string }, unknown>(
      `/mission-requests/${id}/report`,
      { report_text: reportText },
    );
    const normalized = normalizeMissionRequestFromApi(response);
    return { success: true as const, data: normalized ?? undefined };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'ثبت گزارش ناموفق بود') };
  }
}

export async function deleteMissionRequestAction(id: string | number) {
  try {
    await deleteDataWithAuth(`/mission-requests/${id}`);
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'حذف ناموفق بود') };
  }
}

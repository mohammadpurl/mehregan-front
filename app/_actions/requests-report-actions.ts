'use server';

import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import { readBlobWithAuth, readDataWithAuth } from '@/app/core/http-service/http-service';
import type {
  RequestReportItem,
  RequestReportTypeOption,
  RequestsReport,
  RequestsReportFilters,
} from '@/app/_types/requests-report.types';
import { getRequestRefTypeLabel } from '@/app/constants/request-ref-type-labels';

function mapItem(raw: Record<string, unknown>): RequestReportItem {
  const refType = String(raw.ref_type ?? raw.refType ?? '');
  return {
    id: Number(raw.id ?? raw.business_ref_id ?? raw.businessRefId ?? 0),
    refType,
    refLabel: getRequestRefTypeLabel(refType),
    title: String(raw.title ?? raw.name ?? ''),
    requesterId:
      raw.requester_id != null || raw.requesterId != null
        ? Number(raw.requester_id ?? raw.requesterId)
        : null,
    requesterName: (raw.requester_name ?? raw.requesterName) as string | null | undefined,
    status: (raw.status as string | null | undefined) ?? null,
    statusLabel: (raw.status_label ?? raw.statusLabel) as string | null | undefined,
    workflowStatus: (raw.workflow_status ?? raw.workflowStatus) as string | null | undefined,
    workflowStatusLabel: (raw.workflow_status_label ??
      raw.workflowStatusLabel) as string | null | undefined,
    amount:
      raw.amount != null && Number.isFinite(Number(raw.amount)) ? Number(raw.amount) : null,
    createdAt: (raw.created_at ?? raw.createdAt) as string | null | undefined,
    workflowInstanceId:
      raw.workflow_instance_id != null || raw.workflowInstanceId != null
        ? Number(raw.workflow_instance_id ?? raw.workflowInstanceId)
        : null,
    businessRefId:
      raw.business_ref_id != null || raw.businessRefId != null
        ? Number(raw.business_ref_id ?? raw.businessRefId)
        : null,
  };
}

function buildQuery(params?: RequestsReportFilters): string {
  const query = new URLSearchParams();
  if (params?.refType) query.set('refType', params.refType);
  if (params?.requesterId != null && params.requesterId > 0) {
    query.set('requesterId', String(params.requesterId));
  }
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.search?.trim()) query.set('search', params.search.trim());
  const s = query.toString();
  return s ? `?${s}` : '';
}

export async function getRequestTypesAction() {
  try {
    const data = await readDataWithAuth<unknown>('/reports/request-types');
    const rows = Array.isArray(data)
      ? data
      : Array.isArray((data as { items?: unknown[] })?.items)
        ? (data as { items: unknown[] }).items
        : Array.isArray((data as { types?: unknown[] })?.types)
          ? (data as { types: unknown[] }).types
          : [];
    const items: RequestReportTypeOption[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      let value = '';
      if (typeof row === 'string') {
        value = row.trim();
      } else if (row && typeof row === 'object') {
        const o = row as Record<string, unknown>;
        value = String(o.value ?? o.ref_type ?? o.refType ?? o.code ?? '').trim();
      }
      if (!value || seen.has(value)) continue;
      seen.add(value);
      const option: RequestReportTypeOption = {
        value,
        label: getRequestRefTypeLabel(value),
      };
      items.push(option);
    }
    return { success: true as const, data: items };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت انواع درخواست'),
    };
  }
}

export async function getRequestsReportAction(params?: RequestsReportFilters) {
  try {
    const data = await readDataWithAuth<Record<string, unknown>>(
      `/reports/requests${buildQuery(params)}`,
    );
    const itemsRaw = data.items ?? data.results ?? data.data;
    const items = Array.isArray(itemsRaw)
      ? itemsRaw.map((i) => mapItem(i as Record<string, unknown>))
      : [];
    const report: RequestsReport = {
      items,
      total: Number(data.total ?? items.length),
      page: Number(data.page ?? params?.page ?? 1),
      pageSize: Number(data.pageSize ?? data.page_size ?? params?.pageSize ?? 20),
    };
    return { success: true as const, data: report };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت گزارش درخواست‌ها'),
    };
  }
}

export async function getRequestTitleSuggestionAction(refType: string) {
  try {
    const query = new URLSearchParams({ refType });
    const data = await readDataWithAuth<Record<string, unknown>>(
      `/reports/request-title-suggestion?${query.toString()}`,
    );
    const title = String(
      data.title ?? data.suggestion ?? data.suggested_title ?? data.suggestedTitle ?? '',
    ).trim();
    return { success: true as const, data: { title } };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت پیشنهاد عنوان'),
    };
  }
}

export async function exportRequestsReportAction(params?: Omit<RequestsReportFilters, 'page' | 'pageSize'>) {
  try {
    const { data, contentType } = await readBlobWithAuth(
      `/reports/requests/export.xlsx${buildQuery(params)}`,
    );
    const base64 = Buffer.from(data).toString('base64');
    const filename = `requests-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    return {
      success: true as const,
      data: {
        base64,
        filename,
        contentType:
          contentType ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خروجی اکسل ناموفق بود'),
    };
  }
}

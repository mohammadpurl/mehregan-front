'use server';

import { readDataWithAuth } from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import type { SlaReport, SlaReportAssigneeSummary, SlaReportItem } from '@/app/_types/sla-report.types';

function mapItem(raw: Record<string, unknown>): SlaReportItem {
  return {
    kind: (raw.kind as SlaReportItem['kind']) ?? 'workflow',
    refType: String(raw.ref_type ?? raw.refType ?? ''),
    refLabel: String(raw.ref_label ?? raw.refLabel ?? ''),
    instanceId: (raw.instance_id ?? raw.instanceId) as number | undefined,
    taskId: (raw.task_id ?? raw.taskId) as number | undefined,
    businessRefId: (raw.business_ref_id ?? raw.businessRefId) as number | undefined,
    stepId: (raw.step_id ?? raw.stepId) as number | null | undefined,
    stepOrder: (raw.step_order ?? raw.stepOrder) as number | null | undefined,
    stepStatus: (raw.step_status ?? raw.stepStatus) as string | null | undefined,
    title: String(raw.title ?? ''),
    assigneeId: (raw.assignee_id ?? raw.assigneeId) as number | undefined,
    assigneeName: (raw.assignee_name ?? raw.assigneeName) as string | null | undefined,
    startedAt: (raw.started_at ?? raw.startedAt) as string | null | undefined,
    dueAt: (raw.due_at ?? raw.dueAt) as string | null | undefined,
    completedAt: (raw.completed_at ?? raw.completedAt) as string | null | undefined,
    durationMinutes: (raw.duration_minutes ?? raw.durationMinutes) as number | null | undefined,
    status: String(raw.status ?? 'unknown') as SlaReportItem['status'],
    statusLabel: String(raw.status_label ?? raw.statusLabel ?? ''),
    breached: Boolean(raw.breached),
  };
}

function mapAssignee(raw: Record<string, unknown>): SlaReportAssigneeSummary {
  return {
    userId: Number(raw.user_id ?? raw.userId),
    assigneeName: (raw.assignee_name ?? raw.assigneeName) as string | null | undefined,
    total: Number(raw.total ?? 0),
    onTime: Number(raw.on_time ?? raw.onTime ?? 0),
    late: Number(raw.late ?? 0),
    overdue: Number(raw.overdue ?? 0),
    inProgress: Number(raw.in_progress ?? raw.inProgress ?? 0),
    avgDurationMinutes: (raw.avg_duration_minutes ?? raw.avgDurationMinutes) as number | null | undefined,
    complianceRatePercent: (raw.compliance_rate_percent ?? raw.complianceRatePercent) as number | null | undefined,
  };
}

function mapReport(raw: Record<string, unknown>): SlaReport {
  const summaryRaw = (raw.summary ?? {}) as Record<string, unknown>;
  const paginationRaw = (raw.pagination ?? {}) as Record<string, unknown>;
  const periodRaw = (raw.period ?? {}) as Record<string, unknown>;
  const filtersRaw = (raw.filters ?? {}) as Record<string, unknown>;
  const itemsRaw = raw.items;
  const byAssigneeRaw = summaryRaw.by_assignee ?? summaryRaw.byAssignee;

  return {
    period: {
      from: (periodRaw.from as string | null) ?? null,
      to: (periodRaw.to as string | null) ?? null,
    },
    filters: {
      refType: (filtersRaw.ref_type ?? filtersRaw.refType) as string | null,
      assigneeId: (filtersRaw.assignee_id ?? filtersRaw.assigneeId) as number | null,
      kind: String(filtersRaw.kind ?? 'all'),
    },
    summary: {
      total: Number(summaryRaw.total ?? 0),
      onTime: Number(summaryRaw.on_time ?? summaryRaw.onTime ?? 0),
      late: Number(summaryRaw.late ?? 0),
      overduePending: Number(summaryRaw.overdue_pending ?? summaryRaw.overduePending ?? 0),
      inProgress: Number(summaryRaw.in_progress ?? summaryRaw.inProgress ?? 0),
      complianceRatePercent: Number(summaryRaw.compliance_rate_percent ?? summaryRaw.complianceRatePercent ?? 0),
      byAssignee: Array.isArray(byAssigneeRaw)
        ? byAssigneeRaw.map((a) => mapAssignee(a as Record<string, unknown>))
        : [],
    },
    items: Array.isArray(itemsRaw)
      ? itemsRaw.map((i) => mapItem(i as Record<string, unknown>))
      : [],
    pagination: {
      total: Number(paginationRaw.total ?? 0),
      page: Number(paginationRaw.page ?? 1),
      pageSize: Number(paginationRaw.pageSize ?? paginationRaw.page_size ?? 50),
      offset: Number(paginationRaw.offset ?? 0),
      limit: Number(paginationRaw.limit ?? 50),
      hasMore: Boolean(paginationRaw.has_more ?? paginationRaw.hasMore),
    },
    generatedAt: String(raw.generated_at ?? raw.generatedAt ?? ''),
  };
}

export async function getExecutiveSlaReportAction(params?: {
  dateFrom?: string;
  dateTo?: string;
  refType?: string;
  assigneeId?: number;
  kind?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  if (params?.refType) query.set('refType', params.refType);
  if (params?.assigneeId) query.set('assigneeId', String(params.assigneeId));
  if (params?.kind) query.set('kind', params.kind);
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));

  try {
    const data = await readDataWithAuth<Record<string, unknown>>(
      `/reports/executive/sla?${query.toString()}`,
    );
    return { success: true as const, data: mapReport(data) };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت گزارش SLA'),
    };
  }
}

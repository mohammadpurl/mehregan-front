'use server';

import {
  deleteDataWithAuth,
  readDataWithAuth,
  updateDataWithAuth,
} from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import {
  normalizeWorkflowDefinitionFromApi,
  stepsToUpsertPayload,
} from '@/app/dashboard/admin/workflow-definitions/_utils/workflow-definition-mapper';
import type {
  AssigneeStrategy,
  WorkflowAssigneePreview,
  WorkflowDefinition,
  WorkflowDefinitionListResponse,
  WorkflowDefinitionUpsert,
} from '@/app/_types/workflow-definition.types';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';

function normalizeListResponse(raw: WorkflowDefinitionListResponse): WorkflowDefinitionListResponse {
  const items = (raw.items ?? [])
    .map((row) => normalizeWorkflowDefinitionFromApi(row))
    .filter((d): d is WorkflowDefinition => d != null);
  return { ...raw, items };
}

export async function getWorkflowDefinitionsAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  try {
    const data = await readDataWithAuth<WorkflowDefinitionListResponse>(
      `/workflow-definitions?${query.toString()}`,
    );
    return { success: true as const, data: normalizeListResponse(data) };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت تعاریف workflow') };
  }
}

export async function getWorkflowDefinitionAction(refType: WorkflowBusinessRefType) {
  try {
    const raw = await readDataWithAuth<unknown>(`/workflow-definitions/${refType}`);
    const data = normalizeWorkflowDefinitionFromApi(raw);
    if (!data) {
      return { success: false as const, error: 'پاسخ نامعتبر از سرور' };
    }
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'تعریف workflow یافت نشد') };
  }
}

export async function upsertWorkflowDefinitionAction(model: WorkflowDefinitionUpsert) {
  try {
    const body = {
      ref_type: model.ref_type,
      name: model.name,
      code: model.code,
      steps: stepsToUpsertPayload(model.steps),
    };
    console.log(body);
    const raw = await updateDataWithAuth<typeof body, unknown>(
      `/workflow-definitions/${model.ref_type}`,
      body,
    );
    const data = normalizeWorkflowDefinitionFromApi(raw);
    if (!data) {
      return { success: false as const, error: 'پاسخ نامعتبر از سرور' };
    }
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در ذخیره تعریف workflow') };
  }
}

export async function deleteWorkflowDefinitionAction(refType: WorkflowBusinessRefType) {
  try {
    await deleteDataWithAuth(`/workflow-definitions/${refType}`);
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در حذف تعریف workflow') };
  }
}

function normalizeAssigneePreviewRow(raw: unknown): WorkflowAssigneePreview | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const aliases = r.roleAliases ?? r.role_aliases;
  return {
    order: Number(r.order ?? 0),
    roleAliases: Array.isArray(aliases) ? aliases.map(String) : [],
    roleId: r.roleId != null ? Number(r.roleId) : r.role_id != null ? Number(r.role_id) : null,
    assigneeStrategy: String(r.assigneeStrategy ?? r.assignee_strategy ?? 'role_pool') as AssigneeStrategy,
    assigneeUserId:
      r.assigneeUserId != null
        ? Number(r.assigneeUserId)
        : r.assignee_user_id != null
          ? Number(r.assignee_user_id)
          : null,
    resolvedUserId:
      r.resolvedUserId != null
        ? Number(r.resolvedUserId)
        : r.resolved_user_id != null
          ? Number(r.resolved_user_id)
          : null,
    resolvedUserName: (r.resolvedUserName ?? r.resolved_user_name) as string | null,
    label: (r.label as string | null) ?? null,
  };
}

export async function getWorkflowAssigneesPreviewAction(
  refType: WorkflowBusinessRefType,
  submitterId: number,
) {
  try {
    const data = await readDataWithAuth<unknown[]>(
      `/workflow-definitions/${refType}/assignees-preview?submitterId=${submitterId}`,
    );
    const items = (Array.isArray(data) ? data : [])
      .map((row) => normalizeAssigneePreviewRow(row))
      .filter((x): x is WorkflowAssigneePreview => x != null);
    return { success: true as const, data: items };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در پیش‌نمایش تأییدکنندگان'),
    };
  }
}

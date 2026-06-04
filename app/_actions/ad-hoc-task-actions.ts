'use server';

import {
  createDataWithAuth,
  readDataWithAuth,
  uploadDataWithAuth,
} from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import {
  attachmentProxyDownloadPath,
  parseAttachmentsFromApi,
} from '@/app/utils/attachment-display.utils';
import type {
  AdHocTask,
  AdHocTaskListItem,
  AddAdHocTaskStepPayload,
  CreateAdHocTaskPayload,
  UserLookupItem,
} from '@/app/_types/ad-hoc-task.types';

function mapAttachment(raw: Record<string, unknown>) {
  const id = Number(raw.id);
  return {
    id,
    fileName: String(raw.file_name ?? raw.fileName ?? ''),
    downloadUrl:
      (raw.download_url ?? raw.downloadUrl ?? raw.url) as string | undefined ||
      attachmentProxyDownloadPath(id),
    fileUrl: (raw.file_url ?? raw.fileUrl) as string | undefined,
  };
}

function mapStep(raw: Record<string, unknown>) {
  const attRaw = raw.attachments;
  return {
    id: Number(raw.id),
    authorId: Number(raw.author_id ?? raw.authorId),
    authorName: (raw.author_name ?? raw.authorName) as string | null,
    comment: String(raw.comment ?? ''),
    assigneeId: (raw.assignee_id ?? raw.assigneeId) as number | null,
    assigneeName: (raw.assignee_name ?? raw.assigneeName) as string | null,
    createdAt: (raw.created_at ?? raw.createdAt) as string | null,
    attachments: Array.isArray(attRaw)
      ? attRaw.map((a) => mapAttachment(a as Record<string, unknown>))
      : [],
  };
}

function mapTask(raw: Record<string, unknown>): AdHocTask {
  const stepsRaw = raw.steps;
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ''),
    description: (raw.description as string | null) ?? null,
    status: String(raw.status ?? 'open') as AdHocTask['status'],
    createdById: Number(raw.created_by_id ?? raw.createdById),
    createdByName: (raw.created_by_name ?? raw.createdByName) as string | null,
    currentAssigneeId: Number(raw.current_assignee_id ?? raw.currentAssigneeId),
    currentAssigneeName: (raw.current_assignee_name ?? raw.currentAssigneeName) as string | null,
    dueAt: (raw.due_at ?? raw.dueAt) as string | null,
    createdAt: (raw.created_at ?? raw.createdAt) as string | null,
    updatedAt: (raw.updated_at ?? raw.updatedAt) as string | null,
    attachments: parseAttachmentsFromApi(raw.attachments).map((a, i) => ({
      id: typeof a.id === 'number' ? a.id : i,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      downloadUrl: typeof a.id === 'number' ? attachmentProxyDownloadPath(a.id) : a.fileUrl,
    })),
    steps: Array.isArray(stepsRaw)
      ? stepsRaw.map((s) => mapStep(s as Record<string, unknown>))
      : [],
  };
}

function mapListItem(raw: Record<string, unknown>): AdHocTaskListItem {
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ''),
    status: String(raw.status ?? 'open') as AdHocTaskListItem['status'],
    createdByName: (raw.created_by_name ?? raw.createdByName) as string | null,
    currentAssigneeName: (raw.current_assignee_name ?? raw.currentAssigneeName) as string | null,
    dueAt: (raw.due_at ?? raw.dueAt) as string | null,
    createdAt: (raw.created_at ?? raw.createdAt) as string | null,
    updatedAt: (raw.updated_at ?? raw.updatedAt) as string | null,
  };
}

export async function lookupUsersForAssignAction(search?: string) {
  try {
    const q = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const rows = await readDataWithAuth<Record<string, unknown>[]>(`/ad-hoc-tasks/users/lookup${q}`);
    const items: UserLookupItem[] = (Array.isArray(rows) ? rows : []).map((r) => ({
      id: Number(r.id),
      username: String(r.username ?? ''),
      fullName: (r.full_name ?? r.fullName) as string | null,
    }));
    return { success: true as const, data: items };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در جستجوی کاربران'),
      data: [] as UserLookupItem[],
    };
  }
}

export async function getAdHocTasksAction(params?: {
  page?: number;
  pageSize?: number;
  scope?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 20));
  query.set('sortBy', 'updated_at');
  query.set('sortOrder', 'desc');
  if (params?.scope) query.set('scope', params.scope);
  if (params?.search) query.set('search', params.search);
  try {
    const data = await readDataWithAuth<{
      items: Record<string, unknown>[];
      total: number;
    }>(`/ad-hoc-tasks?${query.toString()}`);
    return {
      success: true as const,
      data: {
        items: (data.items ?? []).map(mapListItem),
        total: data.total ?? 0,
      },
    };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت لیست') };
  }
}

export async function getAdHocTaskAction(id: number) {
  try {
    const data = await readDataWithAuth<Record<string, unknown>>(`/ad-hoc-tasks/${id}`);
    return { success: true as const, data: mapTask(data) };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'کار یافت نشد') };
  }
}

export async function createAdHocTaskAction(payload: CreateAdHocTaskPayload) {
  try {
    const data = await createDataWithAuth<Record<string, unknown>, Record<string, unknown>>(
      '/ad-hoc-tasks',
      {
        title: payload.title,
        description: payload.description ?? null,
        assignee_id: payload.assigneeId,
        due_at: payload.dueAt,
        initial_comment: payload.initialComment ?? null,
      },
    );
    return { success: true as const, data: mapTask(data) };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'ثبت کار ناموفق بود') };
  }
}

export async function addAdHocTaskStepAction(taskId: number, payload: AddAdHocTaskStepPayload) {
  try {
    const data = await createDataWithAuth<Record<string, unknown>, Record<string, unknown>>(
      `/ad-hoc-tasks/${taskId}/steps`,
      {
        comment: payload.comment,
        assignee_id: payload.assigneeId ?? null,
        due_at: payload.dueAt ?? null,
        close_task: payload.closeTask ?? false,
      },
    );
    return { success: true as const, data: mapTask(data) };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'ثبت اقدام ناموفق بود') };
  }
}

export async function uploadAdHocTaskAttachmentAction(taskId: number, file: File) {
  const form = new FormData();
  form.append('file', file);
  try {
    await uploadDataWithAuth(`/ad-hoc-tasks/${taskId}/attachments`, form);
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'آپلود پیوست ناموفق بود') };
  }
}

export async function uploadAdHocTaskStepAttachmentAction(taskId: number, stepId: number, file: File) {
  const form = new FormData();
  form.append('file', file);
  try {
    await uploadDataWithAuth(`/ad-hoc-tasks/${taskId}/steps/${stepId}/attachments`, form);
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'آپلود پیوست ناموفق بود') };
  }
}

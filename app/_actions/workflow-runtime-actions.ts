'use server';

import {
  createDataWithAuth,
  readDataWithAuth,
  uploadDataWithAuth,
} from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import type {
  WorkflowApprovalHistory,
  WorkflowApprovalHistorySection,
  WorkflowApprovalPlan,
} from '@/app/_types/workflow-approval-plan.types';
import type { WorkflowInstanceDetail } from '@/app/_types/workflow-runtime.types';

export type WorkflowApprovePayload = {
  comment?: string;
  amount?: number;
  payment_date?: string;
  installment_count?: number;
  first_installment_date?: string;
  settlement_date?: string;
  /** @deprecated — از payer_company_account_id استفاده کنید */
  payer_account?: string;
  payer_company_account_id?: number;
  payment_method?: string;
  payment_executed?: boolean;
  sepidar_confirmed?: boolean;
};

export async function getWorkflowInstanceAction(instanceId: number) {
  try {
    const data = await readDataWithAuth<WorkflowInstanceDetail>(`/workflow/instances/${instanceId}`);
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت نمونه گردش‌کار') };
  }
}

function normalizeApprovalPlan(raw: unknown): WorkflowApprovalPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const stepsRaw = r.steps;
  const steps = Array.isArray(stepsRaw)
    ? stepsRaw
        .map((s) => {
          const step = s as Record<string, unknown>;
          return {
            id: step.id != null ? Number(step.id) : step.stepId != null ? Number(step.stepId) : undefined,
            order: Number(step.order ?? 0),
            status: String(step.status ?? 'pending') as WorkflowApprovalPlan['steps'][0]['status'],
            label: (step.label as string | null) ?? null,
            roleId: Number(step.roleId ?? step.role_id ?? 0),
            roleName: (step.roleName ?? step.role_name) as string | null,
            assignedUserId:
              step.assignedUserId != null
                ? Number(step.assignedUserId)
                : step.assigned_user_id != null
                  ? Number(step.assigned_user_id)
                  : null,
            assignedUserName: (step.assignedUserName ?? step.assigned_user_name) as string | null,
            approvedBy:
              step.approvedBy != null
                ? Number(step.approvedBy)
                : step.approved_by != null
                  ? Number(step.approved_by)
                  : null,
            approvedByName: (step.approvedByName ?? step.approved_by_name) as string | null,
            approvedAt: (step.approvedAt ?? step.approved_at) as string | null,
            autoSkippedSameApprover: Boolean(
              step.autoSkippedSameApprover ?? step.auto_skipped_same_approver,
            ),
            stepAction: (step.stepAction ?? step.step_action) as string | null,
          };
        })
        .sort((a, b) => a.order - b.order)
    : [];

  const decisionsRaw = r.decisions;
  const decisions = Array.isArray(decisionsRaw)
    ? decisionsRaw.map((d) => {
        const row = d as Record<string, unknown>;
        return {
          stepId: Number(row.stepId ?? row.step_id ?? 0),
          stepOrder:
            row.stepOrder != null
              ? Number(row.stepOrder)
              : row.step_order != null
                ? Number(row.step_order)
                : null,
          decision: String(row.decision ?? ''),
          comment: (row.comment as string | null) ?? null,
          approvedBy:
            row.approvedBy != null
              ? Number(row.approvedBy)
              : row.approved_by != null
                ? Number(row.approved_by)
                : null,
          approvedByName: (row.approvedByName ?? row.approved_by_name) as string | null,
          createdAt: (row.createdAt ?? row.created_at) as string | null,
        };
      })
    : [];

  const attRaw = r.stepAttachments ?? r.step_attachments;
  const stepAttachments = Array.isArray(attRaw)
    ? attRaw.map((a) => {
        const row = a as Record<string, unknown>;
        return {
          id: Number(row.id ?? 0),
          fileName: String(row.fileName ?? row.file_name ?? ''),
          workflowStepId:
            row.workflowStepId != null
              ? Number(row.workflowStepId)
              : row.workflow_step_id != null
                ? Number(row.workflow_step_id)
                : row.entity_id != null
                  ? Number(row.entity_id)
                  : null,
          attachmentScope: (row.attachmentScope ?? row.attachment_scope) as string | undefined,
          stepOrder:
            row.stepOrder != null
              ? Number(row.stepOrder)
              : row.step_order != null
                ? Number(row.step_order)
                : null,
          downloadUrl: (row.downloadUrl ??
            row.download_url ??
            row.url ??
            row.file_url) as string | null,
          uploadedBy:
            row.uploadedBy != null
              ? Number(row.uploadedBy)
              : row.uploaded_by != null
                ? Number(row.uploaded_by)
                : null,
          createdAt: (row.createdAt ?? row.created_at) as string | null,
        };
      })
    : [];

  return {
    instanceId: Number(r.instanceId ?? r.instance_id ?? 0),
    refType: String(r.refType ?? r.ref_type ?? ''),
    refId: Number(r.refId ?? r.ref_id ?? 0),
    status: String(r.status ?? 'pending'),
    steps,
    decisions,
    stepAttachments,
  };
}

export async function getWorkflowApprovalPlanAction(instanceId: number) {
  try {
    const data = await readDataWithAuth<unknown>(
      `/workflow/instances/${instanceId}/approval-plan`,
    );
    const normalized = normalizeApprovalPlan(data);
    if (!normalized) return { success: false as const, error: 'پاسخ طرح تأیید نامعتبر است' };
    return { success: true as const, data: normalized };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(
        err,
        'مسیر تأیید (GET /workflow/instances/{id}/approval-plan) در دسترس نیست',
      ),
    };
  }
}

function normalizeApprovalHistory(raw: unknown): WorkflowApprovalHistory | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const sectionsRaw = r.sections;
  if (!Array.isArray(sectionsRaw)) return null;

  const sections: WorkflowApprovalHistorySection[] = [];
  for (const sec of sectionsRaw) {
    const plan = normalizeApprovalPlan(sec);
    if (!plan) continue;
    const s = sec as Record<string, unknown>;
    sections.push({
      ...plan,
      phaseLabel: String(s.phaseLabel ?? s.phase_label ?? plan.refType),
      isCurrent: Boolean(s.isCurrent ?? s.is_current),
    });
  }

  if (!sections.length) return null;

  return {
    currentInstanceId: Number(r.currentInstanceId ?? r.current_instance_id ?? sections[0].instanceId),
    sections,
  };
}

export async function getWorkflowApprovalHistoryAction(instanceId: number) {
  try {
    const data = await readDataWithAuth<unknown>(
      `/workflow/instances/${instanceId}/approval-history`,
    );
    const normalized = normalizeApprovalHistory(data);
    if (!normalized) return { success: false as const, error: 'پاسخ تاریخچه تأیید نامعتبر است' };
    return { success: true as const, data: normalized };
  } catch (err: unknown) {
    const fallback = await getWorkflowApprovalPlanAction(instanceId);
    if (fallback.success && fallback.data) {
      return {
        success: true as const,
        data: {
          currentInstanceId: instanceId,
          sections: [
            {
              ...fallback.data,
              phaseLabel: fallback.data.refType,
              isCurrent: true,
            },
          ],
        } satisfies WorkflowApprovalHistory,
      };
    }
    return {
      success: false as const,
      error: extractActionErrorMessage(
        err,
        'تاریخچه تأیید (GET /workflow/instances/{id}/approval-history) در دسترس نیست',
      ),
    };
  }
}

export async function approveWorkflowAction(instanceId: number, payload?: WorkflowApprovePayload) {
  try {
    await createDataWithAuth(`/workflow/${instanceId}/approve`, payload ?? {});
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در تأیید') };
  }
}

export type WorkflowRejectPayload = {
  comment: string;
  returnTo?: 'previous' | 'requester';
};

export async function rejectWorkflowAction(instanceId: number, payload: WorkflowRejectPayload) {
  try {
    await createDataWithAuth(`/workflow/${instanceId}/reject`, {
      comment: payload.comment.trim(),
      returnTo: payload.returnTo ?? 'previous',
    });
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در رد') };
  }
}

export async function uploadWorkflowStepAttachmentAction(
  instanceId: number,
  stepId: number,
  file: File,
) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    await uploadDataWithAuth<unknown>(
      `/workflow/instances/${instanceId}/steps/${stepId}/attachments`,
      formData,
    );
    return { success: true as const };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'آپلود پیوست مرحله ناموفق بود'),
    };
  }
}

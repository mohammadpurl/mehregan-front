'use server';

import { createDataWithAuth, readDataWithAuth } from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import type { WorkflowApprovalPlan } from '@/app/_types/workflow-approval-plan.types';
import type { WorkflowInstanceDetail } from '@/app/_types/workflow-runtime.types';

export type WorkflowApprovePayload = {
  comment?: string;
  amount?: number;
  installment_count?: number;
  first_installment_date?: string;
  settlement_date?: string;
  /** @deprecated — از payer_company_account_id استفاده کنید */
  payer_account?: string;
  payer_company_account_id?: number;
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
    ? stepsRaw.map((s) => {
        const step = s as Record<string, unknown>;
        return {
          order: Number(step.order ?? 0),
          status: String(step.status ?? 'pending') as WorkflowApprovalPlan['steps'][0]['status'],
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
        };
      })
    : [];

  return {
    instanceId: Number(r.instanceId ?? r.instance_id ?? 0),
    refType: String(r.refType ?? r.ref_type ?? ''),
    refId: Number(r.refId ?? r.ref_id ?? 0),
    status: String(r.status ?? 'pending'),
    steps,
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

export async function approveWorkflowAction(instanceId: number, payload?: WorkflowApprovePayload) {
  try {
    await createDataWithAuth(`/workflow/${instanceId}/approve`, payload ?? {});
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در تأیید') };
  }
}

export async function rejectWorkflowAction(instanceId: number, comment?: string) {
  try {
    const q =
      comment && comment.trim()
        ? `?comment=${encodeURIComponent(comment.trim())}`
        : '';
    await createDataWithAuth(`/workflow/${instanceId}/reject${q}`, {});
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در رد') };
  }
}

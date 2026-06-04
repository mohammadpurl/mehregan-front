import type {
  WorkflowApprovalDecision,
  WorkflowApprovalPlanStep,
  WorkflowStepAttachment,
} from '@/app/_types/workflow-approval-plan.types';
import {
  attachmentProxyDownloadPath,
  type AttachmentDisplayItem,
} from '@/app/utils/attachment-display.utils';
import { formatJalaliDate } from '@/app/utils/jalali-date';

export function userInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '؟';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return parts[0]!.slice(0, 2).toUpperCase();
}

export function formatEventDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const formatted = formatJalaliDate(iso, { withTime: true, persianDigits: true });
  return formatted.replace(/\s+/, ' — ');
}

export function isAutoSkipComment(comment: string | null): boolean {
  return Boolean(comment && comment.includes('تأیید خودکار'));
}

export function decisionLabel(decision: string): string {
  if (decision === 'approved') return 'تأیید';
  if (decision === 'rejected') return 'رد';
  return decision;
}

export function stepStatusLabel(step: WorkflowApprovalPlanStep): string {
  if (step.status === 'approved' && step.autoSkippedSameApprover) {
    return 'تأیید خودکار';
  }
  if (step.status === 'approved') return 'تأیید شده';
  if (step.status === 'rejected') return 'رد شده';
  if (step.status === 'pending') return 'در انتظار اقدام';
  return step.status;
}

export function attachmentsForStep(
  step: WorkflowApprovalPlanStep,
  all: WorkflowStepAttachment[],
): AttachmentDisplayItem[] {
  const stepId = step.id;
  return all
    .filter((a) => {
      if (stepId != null && a.workflowStepId === stepId) return true;
      if (a.stepOrder != null && a.stepOrder === step.order) return true;
      if (step.order === 1 && a.stepOrder === 0) return true;
      if (
        step.order === 1 &&
        (a.attachmentScope === 'request' || a.attachmentScope === 'proforma')
      ) {
        return true;
      }
      if (a.attachmentScope === 'invoice' && (step.order === 5 || step.order === 6)) {
        return true;
      }
      if (a.attachmentScope === 'proforma' && step.order === 4) {
        return true;
      }
      return false;
    })
    .map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileUrl: a.downloadUrl?.trim() || (a.id ? attachmentProxyDownloadPath(a.id) : ''),
    }))
    .filter((a) => a.fileUrl);
}

export function decisionsForStep(
  step: WorkflowApprovalPlanStep,
  all: WorkflowApprovalDecision[],
): WorkflowApprovalDecision[] {
  const stepId = step.id;
  return all.filter(
    (d) =>
      (stepId != null && d.stepId === stepId) ||
      (d.stepOrder != null && d.stepOrder === step.order),
  );
}

export function stepEventTime(
  step: WorkflowApprovalPlanStep,
  decisions: WorkflowApprovalDecision[],
): string | null {
  const visible = decisions.filter((d) => d.createdAt && !isAutoSkipComment(d.comment));
  if (visible.length > 0) {
    return visible[visible.length - 1]!.createdAt;
  }
  if (step.approvedAt) return step.approvedAt;
  return null;
}

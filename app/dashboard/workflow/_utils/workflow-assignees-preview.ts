import type { WorkflowAssigneePreview } from '@/app/_types/workflow-definition.types';

/** آیا دو مرحله یا بیشتر به یک resolvedUserId می‌رسند؟ */
export function hasDuplicateAssigneeSteps(preview: WorkflowAssigneePreview[]): boolean {
  const ids = preview
    .map((p) => p.resolvedUserId)
    .filter((id): id is number => id != null && Number.isFinite(id) && id > 0);
  if (ids.length < 2) return false;
  return new Set(ids).size < ids.length;
}

export const SAME_ASSIGNEE_WARNING =
  'هر دو مرحله به یک نفر می‌رسد؛ با یک تأیید پیش می‌رود.';

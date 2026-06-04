'use client';

import { useWorkflowAssigneesPreview } from './use-workflow-assignees-preview';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';

export function useWorkflowAssigneesPreviewWarning(
  refType: WorkflowBusinessRefType = 'payment_request',
  submitterId?: number | null,
) {
  const { sameAssigneeWarning } = useWorkflowAssigneesPreview(refType, submitterId);
  return sameAssigneeWarning;
}

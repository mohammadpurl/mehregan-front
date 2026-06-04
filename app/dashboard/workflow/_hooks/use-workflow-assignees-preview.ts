'use client';

import { useEffect, useState } from 'react';
import { getProfileAction } from '@/app/_actions/profile-actions';
import { getWorkflowAssigneesPreviewAction } from '@/app/_actions/workflow-definition-actions';
import type { WorkflowAssigneePreview } from '@/app/_types/workflow-definition.types';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import { hasDuplicateAssigneeSteps } from '../_utils/workflow-assignees-preview';

export function useWorkflowAssigneesPreview(
  refType: WorkflowBusinessRefType = 'payment_request',
  submitterId?: number | null,
) {
  const [preview, setPreview] = useState<WorkflowAssigneePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);

      let id = submitterId != null ? Number(submitterId) : NaN;
      if (!Number.isFinite(id) || id < 1) {
        const profile = await getProfileAction();
        id = profile.success && profile.data?.id ? profile.data.id : NaN;
      }

      if (!Number.isFinite(id) || id < 1) {
        if (!cancelled) {
          setPreview([]);
          setLoading(false);
        }
        return;
      }

      const res = await getWorkflowAssigneesPreviewAction(refType, id);
      if (cancelled) return;

      if (res.success && res.data) {
        setPreview(res.data);
      } else {
        setPreview([]);
        setError(res.error ?? 'پیش‌نمایش تأییدکنندگان ناموفق بود');
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [submitterId, refType]);

  const firstStep = preview[0];
  const submitterSelfApproval =
    submitterId != null &&
    firstStep?.resolvedUserId != null &&
    Number(firstStep.resolvedUserId) === Number(submitterId);

  return {
    preview,
    loading,
    error,
    firstStep,
    submitterSelfApproval,
    sameAssigneeWarning: hasDuplicateAssigneeSteps(preview),
  };
}

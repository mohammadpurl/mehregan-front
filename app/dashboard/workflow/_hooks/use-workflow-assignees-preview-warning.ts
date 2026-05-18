'use client';

import { useEffect, useState } from 'react';
import { getProfileAction } from '@/app/_actions/profile-actions';
import { getWorkflowAssigneesPreviewAction } from '@/app/_actions/workflow-definition-actions';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import { hasDuplicateAssigneeSteps } from '../_utils/workflow-assignees-preview';

export function useWorkflowAssigneesPreviewWarning(
  refType: WorkflowBusinessRefType = 'payment_request',
  submitterId?: number | null,
) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let id = submitterId != null ? Number(submitterId) : NaN;
      if (!Number.isFinite(id) || id < 1) {
        const profile = await getProfileAction();
        id = profile.success && profile.data?.id ? profile.data.id : NaN;
      }
      if (!Number.isFinite(id) || id < 1) {
        if (!cancelled) setShow(false);
        return;
      }
      const res = await getWorkflowAssigneesPreviewAction(refType, id);
      if (cancelled) return;
      if (res.success && res.data) {
        setShow(hasDuplicateAssigneeSteps(res.data));
      } else {
        setShow(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submitterId, refType]);

  return show;
}

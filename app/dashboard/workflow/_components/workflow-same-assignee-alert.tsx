'use client';

import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { SAME_ASSIGNEE_WARNING } from '../_utils/workflow-assignees-preview';

type Props = {
  show: boolean;
};

export function WorkflowSameAssigneeAlert({ show }: Props) {
  if (!show) return null;
  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <AlertTitle>توجه</AlertTitle>
      <AlertDescription>{SAME_ASSIGNEE_WARNING}</AlertDescription>
    </Alert>
  );
}

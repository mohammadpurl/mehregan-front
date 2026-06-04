'use client';

import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import type { WorkflowAssigneePreview } from '@/app/_types/workflow-definition.types';

type Props = {
  loading?: boolean;
  firstStep?: WorkflowAssigneePreview | null;
  submitterSelfApproval?: boolean;
};

export function WorkflowFirstApproverAlert({ loading, firstStep, submitterSelfApproval }: Props) {
  if (loading) return null;

  if (submitterSelfApproval) {
    return (
      <Alert variant="destructive">
        <AlertTitle>تأییدکننده اول خود شماست</AlertTitle>
        <AlertDescription>
          طبق workflow باید «مدیر مستقیم» تأیید کند، ولی سیستم شما را به‌عنوان تأییدکننده اول
          شناسایی کرده است. معمولاً یعنی «مدیر مستقیم» در پروفایل کاربری (یا دیتابیس) ثبت نشده یا
          workflow درست پیکربندی نشده. قبل از ثبت، مدیر مستقیم را در{' '}
          <strong>مدیریت کاربران</strong> بررسی کنید.
        </AlertDescription>
      </Alert>
    );
  }

  if (firstStep?.resolvedUserName) {
    return (
      <Alert className="border-sky-200 bg-sky-50/80 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
        <AlertTitle>تأییدکننده اول</AlertTitle>
        <AlertDescription>
          {firstStep.label ? `${firstStep.label}: ` : ''}
          <strong>{firstStep.resolvedUserName}</strong>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

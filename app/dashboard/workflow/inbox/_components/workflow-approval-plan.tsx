'use client';

import type { WorkflowApprovalPlan } from '@/app/_types/workflow-approval-plan.types';
import { cn } from '@/lib/utils';
import { Check, Circle, X } from 'lucide-react';

function stepStatusLabel(step: WorkflowApprovalPlan['steps'][0]): string {
  if (step.status === 'approved' && step.autoSkippedSameApprover) {
    return 'تأیید شده (همان تأییدکننده)';
  }
  if (step.status === 'approved') return 'تأیید شده';
  if (step.status === 'rejected') return 'رد شده';
  if (step.status === 'pending') return 'در انتظار';
  return step.status;
}

type Props = {
  plan: WorkflowApprovalPlan | null;
  loading?: boolean;
  error?: string | null;
};

export function WorkflowApprovalPlanTimeline({ plan, loading, error }: Props) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">در حال بارگذاری مسیر تأیید…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
        <p className="font-medium">مسیر تأیید</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          API: <code dir="ltr">GET /workflow/instances/&#123;id&#125;/approval-plan</code>
        </p>
      </div>
    );
  }

  if (!plan?.steps?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        برای این درخواست مرحله‌ای در workflow ثبت نشده است (تعریف workflow را در پنل ادمین بررسی کنید).
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <p className="text-sm font-medium">مسیر تأیید</p>
      <ol className="space-y-2">
        {plan.steps.map((step) => {
          const Icon =
            step.status === 'approved' ? Check : step.status === 'rejected' ? X : Circle;
          const iconClass =
            step.status === 'approved'
              ? 'text-green-600'
              : step.status === 'rejected'
                ? 'text-destructive'
                : 'text-muted-foreground';
          return (
            <li
              key={step.order}
              className={cn(
                'flex gap-3 rounded-md border px-3 py-2 text-sm',
                step.status === 'pending' && 'border-primary/30 bg-primary/5',
              )}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconClass)} />
              <div className="min-w-0 flex-1 text-right">
                <p className="font-medium">
                  مرحله {step.order}: {step.roleName ?? 'نقش'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stepStatusLabel(step)}
                  {step.assignedUserName ? ` — ${step.assignedUserName}` : ''}
                </p>
                {step.approvedByName ? (
                  <p className="text-xs text-muted-foreground">
                    توسط {step.approvedByName}
                    {step.approvedAt ? ` — ${new Date(step.approvedAt).toLocaleString('fa-IR')}` : ''}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

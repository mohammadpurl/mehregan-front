'use client';

import type {
  WorkflowApprovalHistory,
  WorkflowApprovalPlan,
  WorkflowApprovalPlanStep,
} from '@/app/_types/workflow-approval-plan.types';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Check,
  Circle,
  Clock,
  Flag,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { WorkflowTimelineAttachmentChips } from './workflow-timeline-attachment-chips';
import {
  attachmentsForStep,
  decisionLabel,
  decisionsForStep,
  formatEventDateTime,
  isAutoSkipComment,
  stepEventTime,
  stepStatusLabel,
  userInitials,
} from './workflow-timeline-utils';

function nodeConfig(step: WorkflowApprovalPlanStep) {
  if (step.status === 'approved') {
    return {
      Icon: step.autoSkippedSameApprover ? Check : Check,
      ring: 'border-emerald-500 bg-emerald-500 text-white',
      line: 'bg-emerald-200',
    };
  }
  if (step.status === 'rejected') {
    return { Icon: X, ring: 'border-red-500 bg-red-500 text-white', line: 'bg-red-200' };
  }
  return {
    Icon: Circle,
    ring: 'border-primary bg-primary/10 text-primary animate-pulse',
    line: 'bg-border',
  };
}

function TimelineStepRow({
  step,
  plan,
  isLast,
}: {
  step: WorkflowApprovalPlanStep;
  plan: WorkflowApprovalPlan;
  isLast: boolean;
}) {
  const decisions = decisionsForStep(step, plan.decisions ?? []);
  const visibleDecisions = decisions.filter((d) => d.comment && !isAutoSkipComment(d.comment));
  const attachments = attachmentsForStep(step, plan.stepAttachments ?? []);
  const eventTime = stepEventTime(step, decisions);
  const { Icon, ring, line } = nodeConfig(step);
  const actorName = step.approvedByName ?? step.assignedUserName;
  const roleLabel = step.label ?? step.roleName ?? 'نقش';

  return (
    <div className="relative flex gap-3 sm:gap-4">
      <div className="hidden w-24 shrink-0 pt-2 text-left text-xs text-muted-foreground sm:block">
        {eventTime ? formatEventDateTime(eventTime) : step.status === 'pending' ? 'در انتظار' : '—'}
      </div>

      <div className="relative flex w-10 shrink-0 flex-col items-center">
        <div
          className={cn(
            'relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-sm',
            ring,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        {!isLast ? <div className={cn('mt-1 w-0.5 flex-1 min-h-[2rem]', line)} /> : null}
      </div>

      <div className="min-w-0 flex-1 pb-8">
        <div
          className={cn(
            'rounded-xl border bg-card p-4 shadow-sm transition-shadow',
            step.status === 'pending' && 'border-primary/40 ring-2 ring-primary/15',
          )}
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {userInitials(actorName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  مرحله {step.order}: {roleLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {actorName ?? '—'}
                  {step.assignedUserName && step.status === 'pending'
                    ? ` · مسئول: ${step.assignedUserName}`
                    : ''}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                step.status === 'approved' && 'bg-emerald-100 text-emerald-800',
                step.status === 'rejected' && 'bg-red-100 text-red-800',
                step.status === 'pending' && 'bg-amber-100 text-amber-900',
              )}
            >
              {stepStatusLabel(step)}
            </span>
          </div>

          <p className="mb-3 text-xs text-muted-foreground sm:hidden">
            <Clock className="ml-1 inline h-3.5 w-3.5" />
            {eventTime ? formatEventDateTime(eventTime) : 'زمان ثبت نشده'}
          </p>

          {visibleDecisions.length > 0 ? (
            <div className="mb-3 space-y-2">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                توضیحات
              </p>
              {visibleDecisions.map((d, idx) => (
                <div
                  key={`${d.stepId}-${d.createdAt ?? idx}`}
                  className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-foreground dark:border-amber-900/40 dark:bg-amber-950/20"
                >
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {decisionLabel(d.decision)}
                    {d.approvedByName ? ` — ${d.approvedByName}` : ''}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">{d.comment}</p>
                </div>
              ))}
            </div>
          ) : step.status === 'pending' ? (
            <p className="mb-3 text-xs text-muted-foreground">هنوز توضیحی ثبت نشده است.</p>
          ) : null}

          {step.autoSkippedSameApprover ? (
            <p className="mb-3 text-xs text-muted-foreground">تأیید خودکار (همان تأییدکننده مرحله قبل)</p>
          ) : null}

          <WorkflowTimelineAttachmentChips items={attachments} />
        </div>
      </div>
    </div>
  );
}

function CreatedEventRow({
  requesterName,
  createdAt,
  isLast,
}: {
  requesterName: string | null | undefined;
  createdAt: string;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-3 sm:gap-4">
      <div className="hidden w-24 shrink-0 pt-2 text-left text-xs text-muted-foreground sm:block">
        {formatEventDateTime(createdAt)}
      </div>
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-sky-500 bg-sky-500 text-white shadow-sm">
          <Send className="h-4 w-4" />
        </div>
        {!isLast ? <div className="mt-1 w-0.5 flex-1 min-h-[2rem] bg-sky-200" /> : null}
      </div>
      <div className="min-w-0 flex-1 pb-8">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-sky-100 text-xs font-semibold text-sky-800">
                {userInitials(requesterName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-right">
              <p className="font-semibold">ثبت درخواست</p>
              <p className="text-xs text-muted-foreground">{requesterName ?? 'درخواست‌کننده'}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">درخواست ایجاد و وارد گردش تأیید شد.</p>
        </div>
      </div>
    </div>
  );
}

function PlanTimeline({
  plan,
  title,
  isCurrent,
  createdAt,
  requesterName,
}: {
  plan: WorkflowApprovalPlan;
  title: string;
  isCurrent?: boolean;
  createdAt?: string | null;
  requesterName?: string | null;
}) {
  const steps = [...plan.steps].sort((a, b) => a.order - b.order);
  const showCreated = Boolean(createdAt);

  if (!steps.length && !showCreated) {
    return <p className="text-xs text-muted-foreground">مرحله‌ای برای «{title}» ثبت نشده است.</p>;
  }

  return (
    <div className="space-y-1">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-right">
        <p className="text-sm font-semibold">{title}</p>
        {isCurrent ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">گردش جاری</span>
        ) : null}
      </div>

      {showCreated ? (
        <CreatedEventRow
          requesterName={requesterName}
          createdAt={createdAt!}
          isLast={steps.length === 0 && plan.status !== 'approved'}
        />
      ) : null}

      {steps.map((step, index) => (
        <TimelineStepRow
          key={`${plan.instanceId}-${step.order}-${step.id ?? ''}`}
          step={step}
          plan={plan}
          isLast={index === steps.length - 1 && plan.status !== 'approved'}
        />
      ))}

      {plan.status === 'approved' ? (
        <div className="relative flex gap-3 sm:gap-4">
          <div className="hidden w-24 shrink-0 sm:block" />
          <div className="flex w-10 shrink-0 justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-600 text-white">
              <Flag className="h-4 w-4" />
            </div>
          </div>
          <div className="flex-1 pb-2">
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
              فرآیند تأیید تکمیل شد
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  history?: WorkflowApprovalHistory | null;
  plan?: WorkflowApprovalPlan | null;
  loading?: boolean;
  error?: string | null;
  createdAt?: string | null;
  requesterName?: string | null;
};

export function WorkflowApprovalPlanTimeline({
  history,
  plan,
  loading,
  error,
  createdAt,
  requesterName,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        در حال بارگذاری جریان کار…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
        <p className="font-medium">تاریخچه تأیید</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  const sections =
    history?.sections ??
    (plan
      ? [{ ...plan, phaseLabel: plan.refType, isCurrent: true }]
      : []);

  if (!sections.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        تاریخچه تأییدی ثبت نشده است.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <div key={section.instanceId} className={cn(index > 0 && 'border-t border-dashed pt-6')}>
          <PlanTimeline
            plan={section}
            title={section.phaseLabel}
            isCurrent={section.isCurrent}
            createdAt={index === 0 ? createdAt : null}
            requesterName={index === 0 ? requesterName : null}
          />
        </div>
      ))}
    </div>
  );
}

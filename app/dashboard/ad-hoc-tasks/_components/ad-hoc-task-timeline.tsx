'use client';

import type { ReactNode } from 'react';
import type { AdHocTask, AdHocTaskStep } from '@/app/_types/ad-hoc-task.types';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { parseAttachmentsFromApi } from '@/app/utils/attachment-display.utils';
import { cn } from '@/lib/utils';
import {
  Check,
  Circle,
  Clock,
  Flag,
  MessageSquare,
  Send,
  UserRound,
} from 'lucide-react';
import { WorkflowTimelineAttachmentChips } from '@/app/dashboard/workflow/inbox/_components/workflow-timeline-attachment-chips';
import {
  formatEventDateTime,
  userInitials,
} from '@/app/dashboard/workflow/inbox/_components/workflow-timeline-utils';

function mapAttachments(attachments: AdHocTaskStep['attachments']) {
  return parseAttachmentsFromApi(attachments);
}

function TimelineConnector({ lineClass }: { lineClass: string }) {
  return <div className={cn('mt-1 w-0.5 flex-1 min-h-[2rem]', lineClass)} />;
}

function DateColumn({ time, fallback }: { time?: string | null; fallback?: string }) {
  return (
    <div className="hidden w-24 shrink-0 pt-2 text-left text-xs text-muted-foreground sm:block">
      {time ? formatEventDateTime(time) : fallback ?? '—'}
    </div>
  );
}

function NodeIcon({
  children,
  ring,
}: {
  children: ReactNode;
  ring: string;
}) {
  return (
    <div
      className={cn(
        'relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-sm',
        ring,
      )}
    >
      {children}
    </div>
  );
}

function CreatedEventRow({
  task,
  isLast,
}: {
  task: AdHocTask;
  isLast: boolean;
}) {
  const attachments = mapAttachments(task.attachments);

  return (
    <div className="relative flex gap-3 sm:gap-4">
      <DateColumn time={task.createdAt} />
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        <NodeIcon ring="border-sky-500 bg-sky-500 text-white">
          <Send className="h-4 w-4" />
        </NodeIcon>
        {!isLast ? <TimelineConnector lineClass="bg-sky-200" /> : null}
      </div>
      <div className="min-w-0 flex-1 pb-8">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-sky-100 text-xs font-semibold text-sky-800">
                  {userInitials(task.createdByName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="font-semibold text-foreground">ثبت کار</p>
                <p className="text-xs text-muted-foreground">
                  {task.createdByName ?? 'ایجادکننده'}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-900">
              شروع
            </span>
          </div>

          <p className="mb-3 text-xs text-muted-foreground sm:hidden">
            <Clock className="ml-1 inline h-3.5 w-3.5" />
            {task.createdAt ? formatEventDateTime(task.createdAt) : 'زمان ثبت نشده'}
          </p>

          {task.description ? (
            <div className="mb-3">
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                شرح کار
              </p>
              <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm leading-relaxed text-foreground dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="whitespace-pre-wrap">{task.description}</p>
              </div>
            </div>
          ) : null}

          <WorkflowTimelineAttachmentChips items={attachments} />
        </div>
      </div>
    </div>
  );
}

function StepEventRow({
  step,
  index,
  isLast,
}: {
  step: AdHocTaskStep;
  index: number;
  isLast: boolean;
}) {
  const attachments = mapAttachments(step.attachments);

  return (
    <div className="relative flex gap-3 sm:gap-4">
      <DateColumn time={step.createdAt} />
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        <NodeIcon ring="border-emerald-500 bg-emerald-500 text-white">
          <Check className="h-4 w-4" />
        </NodeIcon>
        {!isLast ? <TimelineConnector lineClass="bg-emerald-200" /> : null}
      </div>
      <div className="min-w-0 flex-1 pb-8">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {userInitials(step.authorName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="font-semibold text-foreground">اقدام {index + 1}</p>
                <p className="text-xs text-muted-foreground">{step.authorName ?? 'کاربر'}</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              ثبت‌شده
            </span>
          </div>

          <p className="mb-3 text-xs text-muted-foreground sm:hidden">
            <Clock className="ml-1 inline h-3.5 w-3.5" />
            {step.createdAt ? formatEventDateTime(step.createdAt) : 'زمان ثبت نشده'}
          </p>

          <div className="mb-3">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              توضیحات
            </p>
            <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm leading-relaxed text-foreground dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="whitespace-pre-wrap">{step.comment}</p>
            </div>
          </div>

          {step.assigneeName ? (
            <p className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
              <UserRound className="h-3.5 w-3.5 shrink-0 text-primary" />
              ارجاع به:{' '}
              <span className="font-medium text-primary">{step.assigneeName}</span>
            </p>
          ) : (
            <p className="mb-3 text-xs font-medium text-emerald-800">بستن کار (بدون ارجاع بعدی)</p>
          )}

          <WorkflowTimelineAttachmentChips items={attachments} />
        </div>
      </div>
    </div>
  );
}

function PendingAssigneeRow({ assigneeName, isLast }: { assigneeName: string; isLast: boolean }) {
  return (
    <div className="relative flex gap-3 sm:gap-4">
      <DateColumn fallback="در انتظار" />
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        <NodeIcon ring="border-primary bg-primary/10 text-primary animate-pulse">
          <Circle className="h-4 w-4" />
        </NodeIcon>
        {!isLast ? <TimelineConnector lineClass="bg-border" /> : null}
      </div>
      <div className="min-w-0 flex-1 pb-8">
        <div className="rounded-xl border border-primary/40 bg-card p-4 shadow-sm ring-2 ring-primary/15">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-900">
                  {userInitials(assigneeName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="font-semibold text-foreground">در انتظار اقدام</p>
                <p className="text-xs text-muted-foreground">مسئول فعلی: {assigneeName}</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
              باز
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">هنوز اقدامی در این مرحله ثبت نشده است.</p>
        </div>
      </div>
    </div>
  );
}

function ClosedEventRow() {
  return (
    <div className="relative flex gap-3 sm:gap-4">
      <div className="hidden w-24 shrink-0 sm:block" />
      <div className="flex w-10 shrink-0 justify-center">
        <NodeIcon ring="border-emerald-600 bg-emerald-600 text-white">
          <Flag className="h-4 w-4" />
        </NodeIcon>
      </div>
      <div className="flex-1 pb-2">
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
          کار بسته شد
        </p>
      </div>
    </div>
  );
}

type Props = {
  task: AdHocTask;
};

export function AdHocTaskTimeline({ task }: Props) {
  const steps = task.steps ?? [];
  const showPending = task.status === 'open' && Boolean(task.currentAssigneeName);
  const showClosed = task.status === 'closed';

  if (!task.createdAt && steps.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">تاریخچه‌ای ثبت نشده است.</p>
    );
  }

  return (
    <div className="space-y-1">
      <CreatedEventRow task={task} isLast={steps.length === 0 && !showPending && !showClosed} />

      {steps.map((step, index) => {
        const isLastStep = index === steps.length - 1;
        const isLast = isLastStep && !showPending && !showClosed;
        return (
          <StepEventRow key={step.id} step={step} index={index} isLast={isLast} />
        );
      })}

      {showPending && task.currentAssigneeName ? (
        <PendingAssigneeRow
          assigneeName={task.currentAssigneeName}
          isLast={!showClosed}
        />
      ) : null}

      {showClosed ? <ClosedEventRow /> : null}
    </div>
  );
}

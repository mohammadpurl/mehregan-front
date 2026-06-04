'use client';

import type { AdHocTask } from '@/app/_types/ad-hoc-task.types';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { cn } from '@/lib/utils';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { WorkflowInboxSummaryHeader } from '@/app/dashboard/workflow/inbox/_components/workflow-inbox-summary-header';
import { CommentWithVoice } from './comment-with-voice';
import { UserAssignSelect } from './user-assign-select';
import { AttachmentFileInput } from '@/app/components/attachments/attachment-file-input';
import { AdHocTaskTimeline } from './ad-hoc-task-timeline';
import { AdHocDueDatetimeField } from './ad-hoc-due-datetime-field';

type Props = {
  task: AdHocTask;
  canAct: boolean;
  busy: boolean;
  comment: string;
  onCommentChange: (v: string) => void;
  assigneeId: string;
  onAssigneeIdChange: (v: string) => void;
  dueDate: string;
  dueTime: string;
  onDueDateChange: (v: string) => void;
  onDueTimeChange: (v: string) => void;
  closeTask: boolean;
  onCloseTaskChange: (v: boolean) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onSubmitStep: () => void;
};

export function AdHocTaskDetailPanel({
  task,
  canAct,
  busy,
  comment,
  onCommentChange,
  assigneeId,
  onAssigneeIdChange,
  dueDate,
  dueTime,
  onDueDateChange,
  onDueTimeChange,
  closeTask,
  onCloseTaskChange,
  files,
  onFilesChange,
  onSubmitStep,
}: Props) {
  const statusTone = task.status === 'open' ? 'pending' : 'approved';
  const statusLabel = task.status === 'open' ? 'باز' : 'بسته';

  return (
    <div className="space-y-5">
      <WorkflowInboxSummaryHeader
        title={task.title}
        subtitle={task.description ? undefined : 'بدون شرح تکمیلی'}
        statusLabel={statusLabel}
        statusTone={statusTone}
        requesterName={task.createdByName}
        createdAt={task.createdAt}
        fields={[
          {
            label: 'گیرنده فعلی',
            value: task.currentAssigneeName ?? '—',
          },
          {
            label: 'مهلت انجام',
            value: task.dueAt
              ? formatJalaliDate(task.dueAt, { withTime: true, persianDigits: true })
              : '—',
          },
          {
            label: 'آخرین به‌روزرسانی',
            value: task.updatedAt
              ? formatJalaliDate(task.updatedAt, { withTime: true, persianDigits: true })
              : '—',
          },
          {
            label: 'تعداد اقدامات',
            value: String(task.steps?.length ?? 0),
          },
        ]}
      />

      <section className="rounded-xl border bg-muted/5 p-4 sm:p-5">
        <div className="mb-4 text-right">
          <h4 className="text-sm font-bold text-foreground">جریان کار</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            ثبت کار، اقدامات، ارجاع‌ها و پیوست‌های هر مرحله
          </p>
        </div>
        <AdHocTaskTimeline task={task} />
      </section>

      {canAct ? (
        <section
          className={cn(
            'rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 sm:p-5',
          )}
        >
          <p className="mb-3 text-sm font-semibold text-primary">اقدام شما</p>
          <div className="space-y-4">
            <CommentWithVoice
              label="متن اقدام"
              value={comment}
              onChange={onCommentChange}
              disabled={busy}
              rows={6}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="close-task"
                checked={closeTask}
                onCheckedChange={(v) => onCloseTaskChange(Boolean(v))}
                disabled={busy}
              />
              <Label htmlFor="close-task">بستن کار (بدون ارجاع بعدی)</Label>
            </div>
            {!closeTask ? (
              <>
                <UserAssignSelect
                  value={assigneeId}
                  onValueChange={onAssigneeIdChange}
                  label="گیرنده مرحله بعد"
                  disabled={busy}
                />
                <AdHocDueDatetimeField
                  date={dueDate}
                  time={dueTime}
                  onDateChange={onDueDateChange}
                  onTimeChange={onDueTimeChange}
                  disabled={busy}
                  label="مهلت انجام برای گیرنده بعد"
                />
              </>
            ) : null}
            <div className="space-y-2">
              <Label>پیوست این اقدام</Label>
              <AttachmentFileInput
                files={files}
                onFilesChange={onFilesChange}
                multiple
                disabled={busy}
              />
            </div>
            <Button onClick={onSubmitStep} disabled={busy}>
              ثبت اقدام
            </Button>
          </div>
        </section>
      ) : (
        <p className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {task.status === 'closed'
            ? 'این کار بسته شده است.'
            : 'فقط گیرنده فعلی می‌تواند اقدام ثبت کند.'}
        </p>
      )}
    </div>
  );
}

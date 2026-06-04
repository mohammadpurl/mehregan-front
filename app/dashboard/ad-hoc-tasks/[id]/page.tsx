'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSessionStore } from '@/app/_store/auth-store';
import { getNumericUserIdFromClientSession } from '@/app/dashboard/payment-request/_utils/payment-request-session';
import {
  addAdHocTaskStepAction,
  getAdHocTaskAction,
  uploadAdHocTaskStepAttachmentAction,
} from '@/app/_actions/ad-hoc-task-actions';
import type { AdHocTask } from '@/app/_types/ad-hoc-task.types';
import { AdHocTaskDetailPanel } from '../_components/ad-hoc-task-detail-panel';
import { combineDateAndTimeToIso, defaultDueDatetimeParts } from '@/app/utils/datetime-local';

export default function AdHocTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const session = useSessionStore((s) => s.session);
  const taskId = Number(params.id);
  const defaultDue = defaultDueDatetimeParts();
  const [task, setTask] = useState<AdHocTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState(defaultDue.date);
  const [dueTime, setDueTime] = useState(defaultDue.time);
  const [closeTask, setCloseTask] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(taskId)) return;
    setLoading(true);
    const res = await getAdHocTaskAction(taskId);
    if (res.success && res.data) setTask(res.data);
    else toast({ title: 'خطا', description: res.error, variant: 'destructive' });
    setLoading(false);
  }, [taskId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const myUserId = getNumericUserIdFromClientSession(session);
  const canAct =
    task?.status === 'open' &&
    myUserId > 0 &&
    task.currentAssigneeId === myUserId;

  const onSubmitStep = async () => {
    if (!task || !comment.trim()) {
      toast({ title: 'متن اقدام الزامی است', variant: 'destructive' });
      return;
    }
    if (!closeTask && !assigneeId) {
      toast({ title: 'گیرنده بعدی را انتخاب کنید یا «بستن کار» را بزنید', variant: 'destructive' });
      return;
    }
    let dueAt: string | null = null;
    if (!closeTask) {
      dueAt = combineDateAndTimeToIso(dueDate, dueTime);
      if (!dueAt) {
        toast({ title: 'مهلت انجام برای گیرنده بعدی الزامی است', variant: 'destructive' });
        return;
      }
    }
    setBusy(true);
    const res = await addAdHocTaskStepAction(task.id, {
      comment: comment.trim(),
      assigneeId: closeTask ? null : Number(assigneeId),
      dueAt,
      closeTask,
    });
    if (!res.success || !res.data) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      setBusy(false);
      return;
    }
    const lastStep = res.data.steps?.[res.data.steps.length - 1];
    if (lastStep && files.length > 0) {
      for (const file of files) {
        await uploadAdHocTaskStepAttachmentAction(task.id, lastStep.id, file);
      }
    }
    setComment('');
    setAssigneeId('');
    const nextDue = defaultDueDatetimeParts();
    setDueDate(nextDue.date);
    setDueTime(nextDue.time);
    setCloseTask(false);
    setFiles([]);
    setTask(res.data);
    setBusy(false);
    toast({ title: closeTask ? 'کار بسته شد' : 'ارجاع انجام شد' });
  };

  if (loading) {
    return (
      <DashboardPageShell>
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          در حال بارگذاری جزئیات کار…
        </div>
      </DashboardPageShell>
    );
  }

  if (!task) {
    return (
      <DashboardPageShell>
        <p>کار یافت نشد.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard/ad-hoc-tasks">بازگشت به لیست</Link>
        </Button>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/ad-hoc-tasks')}>
          <ArrowRight className="ml-1 h-4 w-4" />
          بازگشت به لیست
        </Button>
      </div>

      <AdHocTaskDetailPanel
        task={task}
        canAct={canAct}
        busy={busy}
        comment={comment}
        onCommentChange={setComment}
        assigneeId={assigneeId}
        onAssigneeIdChange={setAssigneeId}
        dueDate={dueDate}
        dueTime={dueTime}
        onDueDateChange={setDueDate}
        onDueTimeChange={setDueTime}
        closeTask={closeTask}
        onCloseTaskChange={setCloseTask}
        files={files}
        onFilesChange={setFiles}
        onSubmitStep={() => void onSubmitStep()}
      />
    </DashboardPageShell>
  );
}

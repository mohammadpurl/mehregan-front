'use client';

import { useState } from 'react';
import { AdvancedModal } from '@/app/components/Modal';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { createAdHocTaskAction, uploadAdHocTaskAttachmentAction } from '@/app/_actions/ad-hoc-task-actions';
import { useToast } from '@/hooks/use-toast';
import { UserAssignSelect } from './user-assign-select';
import { CommentWithVoice } from './comment-with-voice';
import { AttachmentFileInput } from '@/app/components/attachments/attachment-file-input';
import { AdHocDueDatetimeField } from './ad-hoc-due-datetime-field';
import { combineDateAndTimeToIso, defaultDueDatetimeParts } from '@/app/utils/datetime-local';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (taskId: number) => void;
};

export function AdHocTaskCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const defaultDue = defaultDueDatetimeParts();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState(defaultDue.date);
  const [dueTime, setDueTime] = useState(defaultDue.time);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    const nextDue = defaultDueDatetimeParts();
    setTitle('');
    setDescription('');
    setComment('');
    setAssigneeId('');
    setDueDate(nextDue.date);
    setDueTime(nextDue.time);
    setFiles([]);
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      toast({ title: 'عنوان الزامی است', variant: 'destructive' });
      return;
    }
    if (!assigneeId) {
      toast({ title: 'گیرنده را انتخاب کنید', variant: 'destructive' });
      return;
    }
    const dueAt = combineDateAndTimeToIso(dueDate, dueTime);
    if (!dueAt) {
      toast({ title: 'مهلت انجام کار را مشخص کنید', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const res = await createAdHocTaskAction({
      title: title.trim(),
      description: description.trim() || null,
      assigneeId: Number(assigneeId),
      dueAt,
      initialComment: comment.trim() || description.trim() || null,
    });
    if (!res.success || !res.data) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      setBusy(false);
      return;
    }
    for (const file of files) {
      const up = await uploadAdHocTaskAttachmentAction(res.data.id, file);
      if (!up.success) {
        toast({ title: 'هشدار', description: up.error, variant: 'destructive' });
      }
    }
    setBusy(false);
    toast({ title: 'کار ثبت و ارجاع شد' });
    reset();
    onOpenChange(false);
    onCreated(res.data.id);
  };

  return (
    <AdvancedModal
      open={open}
      onOpenChange={onOpenChange}
      title="کار پیش‌بینی‌نشده جدید"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            انصراف
          </Button>
          <Button onClick={() => void onSubmit()} disabled={busy}>
            ثبت و ارجاع
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <CommentWithVoice
          label="عنوان کار"
          value={title}
          onChange={setTitle}
          placeholder="موضوع کار"
          multiline={false}
        />
        <CommentWithVoice
          label="شرح کار"
          value={description}
          onChange={setDescription}
          placeholder="شرح کامل کار پیش‌بینی‌نشده..."
          rows={8}
        />
        <CommentWithVoice
          label="پیام اولیه (اختیاری)"
          value={comment}
          onChange={setComment}
          rows={6}
        />
        <UserAssignSelect value={assigneeId} onValueChange={setAssigneeId} />
        <AdHocDueDatetimeField
          date={dueDate}
          time={dueTime}
          onDateChange={setDueDate}
          onTimeChange={setDueTime}
          disabled={busy}
        />
        <div className="space-y-2">
          <Label>پیوست‌ها</Label>
          <AttachmentFileInput
            files={files}
            onFilesChange={setFiles}
            multiple
            disabled={busy}
          />
        </div>
      </div>
    </AdvancedModal>
  );
}

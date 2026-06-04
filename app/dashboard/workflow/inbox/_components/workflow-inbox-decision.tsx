'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { AdvancedModal } from '@/app/components/Modal';
import { AttachmentFileInput } from '@/app/components/attachments/attachment-file-input';

export type WorkflowRejectTarget = 'previous' | 'requester';

type Props = {
  approveComment: string;
  onApproveCommentChange: (value: string) => void;
  pendingStepOrder: number | null;
  attachmentFiles: File[];
  onAttachmentFilesChange: (files: File[]) => void;
  disabled?: boolean;
  showPaymentMethod?: boolean;
  paymentMethod?: string;
  onPaymentMethodChange?: (value: string) => void;
};

export function WorkflowInboxDecisionFields({
  approveComment,
  onApproveCommentChange,
  pendingStepOrder,
  attachmentFiles,
  onAttachmentFilesChange,
  disabled,
  showPaymentMethod,
  paymentMethod = 'transfer',
  onPaymentMethodChange,
}: Props) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/10 p-3 text-right">
      <p className="text-sm font-medium">یادداشت و پیوست مرحله</p>
      {pendingStepOrder != null ? (
        <p className="text-xs text-muted-foreground">
          پیوست‌های این بخش مخصوص مرحله {pendingStepOrder} هستند و از پیوست‌های اصلی درخواست جدا
          ثبت می‌شوند.
        </p>
      ) : null}
      {showPaymentMethod ? (
        <div className="space-y-1">
          <Label>روش پرداخت (الزامی)</Label>
          <Select
            value={paymentMethod}
            onValueChange={onPaymentMethodChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب روش پرداخت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transfer">حواله</SelectItem>
              <SelectItem value="check">چک</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="space-y-1">
        <Label htmlFor="wf-approve-comment">
          {showPaymentMethod ? 'توضیح روش پرداخت (الزامی)' : 'کامنت (اختیاری برای تأیید)'}
        </Label>
        <Textarea
          id="wf-approve-comment"
          value={approveComment}
          onChange={(e) => onApproveCommentChange(e.target.value)}
          disabled={disabled}
          rows={2}
          placeholder="توضیح تأیید…"
        />
      </div>
      <div className="space-y-1">
        <Label>پیوست مرحله</Label>
        <AttachmentFileInput
          multiple
          disabled={disabled}
          files={attachmentFiles}
          onFilesChange={onAttachmentFilesChange}
          hint="تصویر، PDF، Word، Excel — حداکثر ۲۵ مگابایت برای هر فایل"
        />
      </div>
    </div>
  );
}

type RejectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingStepOrder: number | null;
  canReturnToPrevious: boolean;
  loading?: boolean;
  onConfirm: (payload: { comment: string; returnTo: WorkflowRejectTarget }) => void;
};

export function WorkflowRejectModal({
  open,
  onOpenChange,
  pendingStepOrder,
  canReturnToPrevious,
  loading,
  onConfirm,
}: RejectModalProps) {
  const [comment, setComment] = useState('');
  const [returnTo, setReturnTo] = useState<WorkflowRejectTarget>('requester');

  const handleConfirm = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    onConfirm({ comment: trimmed, returnTo });
    setComment('');
    setReturnTo('requester');
  };

  return (
    <AdvancedModal
      open={open}
      onOpenChange={onOpenChange}
      title="رد درخواست"
      size="md"
      footer={
        <div className="flex flex-row-reverse flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            انصراف
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading || !comment.trim()}
            onClick={handleConfirm}
          >
            ثبت رد
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-right text-sm">
        {pendingStepOrder != null ? (
          <p className="text-muted-foreground">مرحله جاری: {pendingStepOrder}</p>
        ) : null}
        <div className="space-y-1">
          <Label>بازگشت به</Label>
          <Select
            value={returnTo}
            onValueChange={(v) => setReturnTo(v as WorkflowRejectTarget)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="requester">درخواست‌کننده (اصلاح و ارسال مجدد)</SelectItem>
              {canReturnToPrevious ? (
                <SelectItem value="previous">مرحله تأیید قبلی</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="wf-reject-comment">دلیل رد (الزامی)</Label>
          <Textarea
            id="wf-reject-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
            rows={3}
            placeholder="دلیل رد را بنویسید…"
          />
        </div>
      </div>
    </AdvancedModal>
  );
}

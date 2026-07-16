'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { AdvancedModal } from '@/app/components/Modal';
import { AttachmentFileInput } from '@/app/components/attachments/attachment-file-input';
import { RequiredFieldsHint, RequiredMark } from '@/app/components/ui/required-mark';

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
  /** مرحله سرپرست مالی: تأیید ثبت در سپیدار */
  showSepidarConfirm?: boolean;
  sepidarConfirmed?: boolean;
  onSepidarConfirmedChange?: (value: boolean) => void;
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
  showSepidarConfirm,
  sepidarConfirmed = false,
  onSepidarConfirmedChange,
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
      {showSepidarConfirm ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-background p-3">
          <Checkbox
            id="wf-sepidar-confirm"
            checked={sepidarConfirmed}
            onCheckedChange={(v) => onSepidarConfirmedChange?.(v === true)}
            disabled={disabled}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="wf-sepidar-confirm" className="cursor-pointer font-medium leading-relaxed">
              در نرم‌افزار سپیدار ثبت شده است
              <RequiredMark />
            </Label>
            <p className="text-xs text-muted-foreground">
              سپیدار نرم‌افزار جداست. پس از بررسی ثبت در سپیدار، این تیک را بزنید و تأیید کنید.
            </p>
          </div>
        </div>
      ) : null}
      {showPaymentMethod ? (
        <div className="space-y-1">
          <Label>
            روش پرداخت
            <RequiredMark />
          </Label>
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
          {showPaymentMethod ? (
            <>
              توضیح روش پرداخت
              <RequiredMark />
            </>
          ) : (
            'کامنت (اختیاری برای تأیید)'
          )}
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
  const [returnTo, setReturnTo] = useState<WorkflowRejectTarget>(
    canReturnToPrevious ? 'previous' : 'requester',
  );

  const handleConfirm = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    // اگر مرحله قبل هست همیشه previous؛ مرحله ۱ فقط به درخواست‌کننده
    const resolvedReturnTo: WorkflowRejectTarget = canReturnToPrevious ? 'previous' : 'requester';
    onConfirm({ comment: trimmed, returnTo: resolvedReturnTo });
    setComment('');
    setReturnTo(canReturnToPrevious ? 'previous' : 'requester');
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
        <RequiredFieldsHint />
        {pendingStepOrder != null ? (
          <p className="text-muted-foreground">مرحله جاری: {pendingStepOrder}</p>
        ) : null}
        <div className="space-y-1">
          <Label>بازگشت به</Label>
          <Select
            value={canReturnToPrevious ? 'previous' : 'requester'}
            onValueChange={(v) => setReturnTo(v as WorkflowRejectTarget)}
            disabled={loading || canReturnToPrevious}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {canReturnToPrevious ? (
                <SelectItem value="previous">مرحله تأیید قبلی</SelectItem>
              ) : (
                <SelectItem value="requester">درخواست‌کننده (اصلاح و ارسال مجدد)</SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {canReturnToPrevious
              ? 'با رد، درخواست به مرحله تأیید قبلی برمی‌گردد.'
              : 'این اولین مرحله است؛ با رد، درخواست به درخواست‌کننده برمی‌گردد.'}
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="wf-reject-comment">
            دلیل رد
            <RequiredMark />
          </Label>
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

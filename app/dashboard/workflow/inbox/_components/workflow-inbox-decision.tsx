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
import { Input } from '@/app/components/ui/input';
import { AdvancedModal } from '@/app/components/Modal';
import { AttachmentFileInput } from '@/app/components/attachments/attachment-file-input';
import { RequiredFieldsHint, RequiredMark } from '@/app/components/ui/required-mark';
import { JalaliDateInput } from '@/app/components/ui/jalali-date-input';

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
  /** مرحله approve_proforma — محل پرداخت و جزئیات چک */
  showProformaPaymentFields?: boolean;
  paymentLocation?: string;
  onPaymentLocationChange?: (value: string) => void;
  checkNumber?: string;
  onCheckNumberChange?: (value: string) => void;
  checkDueDate?: string;
  onCheckDueDateChange?: (value: string) => void;
  checkBank?: string;
  onCheckBankChange?: (value: string) => void;
  /** مرحله کارشناس مالی: تیک «ثبت شد» قبل از دکمه سپیدار */
  showMarkRegistered?: boolean;
  markRegistered?: boolean;
  onMarkRegisteredChange?: (value: boolean) => void;
  /** مرحله سرپرست مالی: تأیید ثبت در سپیدار */
  showSepidarConfirm?: boolean;
  sepidarConfirmed?: boolean;
  onSepidarConfirmedChange?: (value: boolean) => void;
  /** برچسب سفارشی برای تیک سپیدار */
  sepidarConfirmLabel?: string;
  /** مخفی کردن آپلود پیوست مرحله (مثلاً اسناد مالی فقط توسط ثبت‌کننده) */
  hideStepAttachments?: boolean;
  /** برچسب آپلود پیوست مرحله */
  stepAttachmentLabel?: string;
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
  showProformaPaymentFields,
  paymentLocation = '',
  onPaymentLocationChange,
  checkNumber = '',
  onCheckNumberChange,
  checkDueDate = '',
  onCheckDueDateChange,
  checkBank = '',
  onCheckBankChange,
  showMarkRegistered,
  markRegistered = false,
  onMarkRegisteredChange,
  showSepidarConfirm,
  sepidarConfirmed = false,
  onSepidarConfirmedChange,
  sepidarConfirmLabel,
  hideStepAttachments,
  stepAttachmentLabel,
}: Props) {
  const isCheckPayment = paymentMethod === 'check';
  return (
    <div className="space-y-3 rounded-lg border bg-muted/10 p-3 text-right">
      <p className="text-sm font-medium">
        {hideStepAttachments ? 'یادداشت مرحله' : 'یادداشت و پیوست مرحله'}
      </p>
      {pendingStepOrder != null && !hideStepAttachments ? (
        <p className="text-xs text-muted-foreground">
          پیوست‌های این بخش مخصوص مرحله {pendingStepOrder} هستند و از پیوست‌های اصلی درخواست جدا
          ثبت می‌شوند.
        </p>
      ) : null}
      {showMarkRegistered ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-background p-3">
          <Checkbox
            id="wf-mark-registered"
            checked={markRegistered}
            onCheckedChange={(v) => onMarkRegisteredChange?.(v === true)}
            disabled={disabled}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="wf-mark-registered" className="cursor-pointer font-medium leading-relaxed">
              ثبت شد
              <RequiredMark />
            </Label>
            <p className="text-xs text-muted-foreground">
              پس از ثبت سند در نرم‌افزار سپیدار، این تیک را بزنید و سپس دکمه «در نرم‌افزار سپیدار ثبت
              شد» را بزنید.
            </p>
          </div>
        </div>
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
              {sepidarConfirmLabel ?? 'در نرم‌افزار سپیدار ثبت شده است'}
              <RequiredMark />
            </Label>
            <p className="text-xs text-muted-foreground">
              سپیدار نرم‌افزار جداست. پس از بررسی ثبت در سپیدار، این تیک را بزنید و تأیید کنید.
            </p>
          </div>
        </div>
      ) : null}
      {showPaymentMethod || showProformaPaymentFields ? (
        <div className="space-y-3">
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
          {showProformaPaymentFields ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="wf-payment-location">
                  محل پرداخت
                  <RequiredMark />
                </Label>
                <Input
                  id="wf-payment-location"
                  value={paymentLocation}
                  onChange={(e) => onPaymentLocationChange?.(e.target.value)}
                  disabled={disabled}
                  placeholder="مثلاً حساب شرکت / صندوق…"
                />
              </div>
              {isCheckPayment ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="wf-check-number">
                      شماره چک
                      <RequiredMark />
                    </Label>
                    <Input
                      id="wf-check-number"
                      value={checkNumber}
                      onChange={(e) => onCheckNumberChange?.(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wf-check-bank">
                      بانک
                      <RequiredMark />
                    </Label>
                    <Input
                      id="wf-check-bank"
                      value={checkBank}
                      onChange={(e) => onCheckBankChange?.(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>
                      تاریخ سررسید چک
                      <RequiredMark />
                    </Label>
                    <JalaliDateInput
                      value={checkDueDate}
                      onChange={(v) => onCheckDueDateChange?.(v)}
                      disabled={disabled}
                    />
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-1">
        <Label htmlFor="wf-approve-comment">
          {showPaymentMethod || showProformaPaymentFields ? (
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
      {!hideStepAttachments ? (
        <div className="space-y-1">
          <Label>{stepAttachmentLabel ?? 'پیوست مرحله'}</Label>
          <AttachmentFileInput
            multiple
            disabled={disabled}
            files={attachmentFiles}
            onFilesChange={onAttachmentFilesChange}
            hint="تصویر، PDF، Word، Excel — حداکثر ۲۵ مگابایت برای هر فایل"
          />
        </div>
      ) : null}
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

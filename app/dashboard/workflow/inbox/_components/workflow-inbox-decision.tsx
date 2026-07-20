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
import { CompanyBankAccountSelect } from '@/app/dashboard/payment-request/_components/bank-account/company-bank-account-select';
import {
  WorkflowProformaCheckPlan,
  type ProformaCheckPlanRow,
} from './workflow-proforma-check-plan';

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
  /** مرحله approve_proforma — محل پرداخت، حساب بانکی، برنامه چک */
  showProformaPaymentFields?: boolean;
  paymentLocation?: string;
  onPaymentLocationChange?: (value: string) => void;
  payerCompanyAccountId?: number;
  onPayerCompanyAccountIdChange?: (value: number) => void;
  checkPlanRows?: ProformaCheckPlanRow[];
  onCheckPlanRowsChange?: (rows: ProformaCheckPlanRow[]) => void;
  proformaExpectedTotal?: number | null;
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
  paymentMethod = 'cash',
  onPaymentMethodChange,
  showProformaPaymentFields,
  paymentLocation = '',
  onPaymentLocationChange,
  payerCompanyAccountId = 0,
  onPayerCompanyAccountIdChange,
  checkPlanRows = [],
  onCheckPlanRowsChange,
  proformaExpectedTotal,
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
  const isBankLocation = paymentLocation === 'bank';
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
      {showProformaPaymentFields ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>
              محل پرداخت
              <RequiredMark />
            </Label>
            <Select
              value={paymentLocation || undefined}
              onValueChange={onPaymentLocationChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="بانک یا تنخواه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">بانک</SelectItem>
                <SelectItem value="petty_cash">تنخواه</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isBankLocation ? (
            <div className="space-y-1">
              <Label>
                حساب بانکی شرکت
                <RequiredMark />
              </Label>
              <CompanyBankAccountSelect
                value={payerCompanyAccountId}
                onChange={(id) => onPayerCompanyAccountIdChange?.(id)}
                disabled={disabled}
                placeholder="انتخاب حساب بانکی شرکت"
              />
            </div>
          ) : null}
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
                <SelectItem value="cash">نقدی</SelectItem>
                <SelectItem value="check">چک</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isCheckPayment ? (
            <WorkflowProformaCheckPlan
              rows={checkPlanRows}
              onChange={(rows) => onCheckPlanRowsChange?.(rows)}
              expectedTotal={proformaExpectedTotal}
              disabled={disabled}
            />
          ) : null}
        </div>
      ) : showPaymentMethod ? (
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

  const handleConfirm = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    const resolvedReturnTo: WorkflowRejectTarget = canReturnToPrevious ? 'previous' : 'requester';
    onConfirm({ comment: trimmed, returnTo: resolvedReturnTo });
    setComment('');
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
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">بعد از رد، درخواست برمی‌گردد به</p>
          <p className="mt-1 font-medium">
            {canReturnToPrevious
              ? 'مرحله تأیید قبلی'
              : 'درخواست‌کننده (برای اصلاح و ارسال مجدد)'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            این مقصد به‌صورت خودکار تعیین می‌شود و قابل تغییر نیست.
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

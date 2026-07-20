'use client';

import type { ReactNode } from 'react';
import type { WorkflowApprovalHistory } from '@/app/_types/workflow-approval-plan.types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';
import { ChevronDown, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowApprovalPlanTimeline } from './workflow-approval-plan';
import { WorkflowInboxSummaryHeader, type WorkflowSummaryField } from './workflow-inbox-summary-header';
import { WorkflowInboxDecisionFields } from './workflow-inbox-decision';
import type { ProformaCheckPlanRow } from './workflow-proforma-check-plan';
import { WorkflowSameAssigneeAlert } from '@/app/dashboard/workflow/_components/workflow-same-assignee-alert';
import { RequiredFieldsHint } from '@/app/components/ui/required-mark';
import type { WorkflowStepActionGuide } from '../_utils/workflow-step-action-guide';

type Props = {
  title: string;
  subtitle?: string | null;
  statusLabel?: string;
  statusTone?: 'pending' | 'approved' | 'rejected' | 'neutral';
  requesterName?: string | null;
  createdAt?: string | null;
  summaryFields?: WorkflowSummaryField[];
  approvalHistory: WorkflowApprovalHistory | null;
  planLoading: boolean;
  planError: string | null;
  formError?: string | null;
  detailsContent?: ReactNode;
  relatedRequestsContent?: ReactNode;
  showSameAssigneeAlert?: boolean;
  canDecide?: boolean;
  approveComment: string;
  onApproveCommentChange: (v: string) => void;
  pendingStepOrder: number | null;
  attachmentFiles: File[];
  onAttachmentFilesChange: (files: File[]) => void;
  actionPending?: boolean;
  showPaymentMethod?: boolean;
  paymentMethod?: string;
  onPaymentMethodChange?: (value: string) => void;
  showProformaPaymentFields?: boolean;
  paymentLocation?: string;
  onPaymentLocationChange?: (value: string) => void;
  payerCompanyAccountId?: number;
  onPayerCompanyAccountIdChange?: (value: number) => void;
  checkPlanRows?: ProformaCheckPlanRow[];
  onCheckPlanRowsChange?: (rows: ProformaCheckPlanRow[]) => void;
  proformaExpectedTotal?: number | null;
  showMarkRegistered?: boolean;
  markRegistered?: boolean;
  onMarkRegisteredChange?: (value: boolean) => void;
  showSepidarConfirm?: boolean;
  sepidarConfirmed?: boolean;
  onSepidarConfirmedChange?: (value: boolean) => void;
  sepidarConfirmLabel?: string;
  hideStepAttachments?: boolean;
  stepAttachmentLabel?: string;
  /** راهنمای وظیفه این مرحله — همیشه نمایش داده می‌شود */
  stepGuide?: WorkflowStepActionGuide | null;
  /** متن تکمیلی برای وضعیت‌های خاص (مثل فیش خرید) */
  operationalNoticeExtra?: string | null;
  primaryButtonLabel?: string;
};

export function WorkflowInboxReviewPanel({
  title,
  subtitle,
  statusLabel,
  statusTone,
  requesterName,
  createdAt,
  summaryFields,
  approvalHistory,
  planLoading,
  planError,
  formError,
  detailsContent,
  relatedRequestsContent,
  showSameAssigneeAlert,
  canDecide,
  approveComment,
  onApproveCommentChange,
  pendingStepOrder,
  attachmentFiles,
  onAttachmentFilesChange,
  actionPending,
  showPaymentMethod,
  paymentMethod,
  onPaymentMethodChange,
  showProformaPaymentFields,
  paymentLocation,
  onPaymentLocationChange,
  payerCompanyAccountId,
  onPayerCompanyAccountIdChange,
  checkPlanRows,
  onCheckPlanRowsChange,
  proformaExpectedTotal,
  showMarkRegistered,
  markRegistered,
  onMarkRegisteredChange,
  showSepidarConfirm,
  sepidarConfirmed,
  onSepidarConfirmedChange,
  sepidarConfirmLabel,
  hideStepAttachments,
  stepAttachmentLabel,
  stepGuide,
  operationalNoticeExtra,
  primaryButtonLabel,
}: Props) {
  const prioritizeAction = Boolean(stepGuide?.prioritizeAction && canDecide);

  const taskCard =
    stepGuide != null ? (
      <div className="rounded-xl border border-sky-300/70 bg-sky-50 p-4 text-right dark:border-sky-800 dark:bg-sky-950/40">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-sky-800 dark:text-sky-200">وظیفه شما در این مرحله</p>
            <p className="text-sm font-semibold text-sky-950 dark:text-sky-50">{stepGuide.taskTitle}</p>
          </div>
          <span className="shrink-0 rounded-md border border-sky-300 bg-white/80 px-2.5 py-1 text-xs font-medium text-sky-900 dark:border-sky-700 dark:bg-sky-900/50 dark:text-sky-100">
            {stepGuide.actionLabel}
          </span>
        </div>
        {stepGuide.steps.length > 0 ? (
          <ol className="mt-3 space-y-1.5 text-sm text-sky-950/90 dark:text-sky-100/90">
            {stepGuide.steps.map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-200/80 text-[11px] font-bold text-sky-900 dark:bg-sky-800 dark:text-sky-100">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {operationalNoticeExtra ? (
          <p className="mt-3 border-t border-sky-200/80 pt-3 text-xs leading-relaxed text-sky-900/80 dark:border-sky-800 dark:text-sky-200/90">
            {operationalNoticeExtra}
          </p>
        ) : null}
        {primaryButtonLabel ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-sky-800 dark:text-sky-200">
            <ListOrdered className="h-3.5 w-3.5 shrink-0" />
            دکمه نهایی پایین صفحه: «{primaryButtonLabel}» — برای رد از دکمه قرمز «رد» استفاده کنید.
          </p>
        ) : null}
      </div>
    ) : null;

  const decisionSection =
    canDecide ? (
      <section
        className={cn('rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4')}
      >
        <div className="mb-3 space-y-1">
          <p className="text-sm font-semibold text-primary">
            {prioritizeAction ? '۱) اقدام شما در این مرحله' : 'اقدام شما در این مرحله'}
          </p>
          <p className="text-xs text-muted-foreground">
            فیلدهای لازم را اینجا کامل کنید؛ سپس از دکمه‌های پایین مودال تأیید یا رد را بزنید.
          </p>
        </div>
        <RequiredFieldsHint className="mb-3" />
        <WorkflowInboxDecisionFields
          approveComment={approveComment}
          onApproveCommentChange={onApproveCommentChange}
          pendingStepOrder={pendingStepOrder}
          attachmentFiles={attachmentFiles}
          onAttachmentFilesChange={onAttachmentFilesChange}
          disabled={actionPending}
          showPaymentMethod={showPaymentMethod}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={onPaymentMethodChange}
          showProformaPaymentFields={showProformaPaymentFields}
          paymentLocation={paymentLocation}
          onPaymentLocationChange={onPaymentLocationChange}
          payerCompanyAccountId={payerCompanyAccountId}
          onPayerCompanyAccountIdChange={onPayerCompanyAccountIdChange}
          checkPlanRows={checkPlanRows}
          onCheckPlanRowsChange={onCheckPlanRowsChange}
          proformaExpectedTotal={proformaExpectedTotal}
          showMarkRegistered={showMarkRegistered}
          markRegistered={markRegistered}
          onMarkRegisteredChange={onMarkRegisteredChange}
          showSepidarConfirm={showSepidarConfirm}
          sepidarConfirmed={sepidarConfirmed}
          onSepidarConfirmedChange={onSepidarConfirmedChange}
          sepidarConfirmLabel={sepidarConfirmLabel}
          hideStepAttachments={hideStepAttachments}
          stepAttachmentLabel={stepAttachmentLabel}
        />
      </section>
    ) : null;

  const detailsSection = detailsContent ? (
    <Collapsible defaultOpen className="rounded-xl border bg-muted/10">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
        <span className="text-right">
          <span className="block font-semibold">
            {prioritizeAction ? '۲) جزئیات درخواست' : 'جزئیات درخواست'}
          </span>
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            اطلاعات ثبت‌شده را اینجا ببینید
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-4 py-3">{detailsContent}</CollapsibleContent>
    </Collapsible>
  ) : null;

  return (
    <div className="space-y-5">
      <WorkflowInboxSummaryHeader
        title={title}
        subtitle={subtitle}
        statusLabel={statusLabel}
        statusTone={statusTone}
        actionLabel={stepGuide?.actionLabel}
        requesterName={requesterName}
        createdAt={createdAt}
        fields={summaryFields}
      />

      {formError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      {taskCard}

      <WorkflowSameAssigneeAlert show={Boolean(showSameAssigneeAlert)} />

      {prioritizeAction ? (
        <>
          {decisionSection}
          {detailsSection}
        </>
      ) : (
        <>
          {detailsSection}
          {decisionSection}
        </>
      )}

      {relatedRequestsContent}

      <Collapsible defaultOpen className="rounded-xl border bg-muted/5">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium sm:px-5">
          <span className="text-right">
            <span className="block font-bold text-foreground">روال و مراحل تأیید</span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              ببینید الان در کدام مرحله هستید و قبل از شما چه کسانی تأیید کرده‌اند
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t px-4 py-3 sm:px-5 sm:py-4">
          <WorkflowApprovalPlanTimeline
            history={approvalHistory}
            loading={planLoading}
            error={planError}
            createdAt={createdAt}
            requesterName={requesterName}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

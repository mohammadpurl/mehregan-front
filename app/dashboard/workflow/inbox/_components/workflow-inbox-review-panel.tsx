'use client';

import type { ReactNode } from 'react';
import type { WorkflowApprovalHistory } from '@/app/_types/workflow-approval-plan.types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowApprovalPlanTimeline } from './workflow-approval-plan';
import { WorkflowInboxSummaryHeader, type WorkflowSummaryField } from './workflow-inbox-summary-header';
import { WorkflowInboxDecisionFields } from './workflow-inbox-decision';
import { WorkflowSameAssigneeAlert } from '@/app/dashboard/workflow/_components/workflow-same-assignee-alert';
import { RequiredFieldsHint } from '@/app/components/ui/required-mark';

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
  checkNumber?: string;
  onCheckNumberChange?: (value: string) => void;
  checkDueDate?: string;
  onCheckDueDateChange?: (value: string) => void;
  checkBank?: string;
  onCheckBankChange?: (value: string) => void;
  showMarkRegistered?: boolean;
  markRegistered?: boolean;
  onMarkRegisteredChange?: (value: boolean) => void;
  showSepidarConfirm?: boolean;
  sepidarConfirmed?: boolean;
  onSepidarConfirmedChange?: (value: boolean) => void;
  sepidarConfirmLabel?: string;
  hideStepAttachments?: boolean;
  stepAttachmentLabel?: string;
  operationalNotice?: string | null;
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
  checkNumber,
  onCheckNumberChange,
  checkDueDate,
  onCheckDueDateChange,
  checkBank,
  onCheckBankChange,
  showMarkRegistered,
  markRegistered,
  onMarkRegisteredChange,
  showSepidarConfirm,
  sepidarConfirmed,
  onSepidarConfirmedChange,
  sepidarConfirmLabel,
  hideStepAttachments,
  stepAttachmentLabel,
  operationalNotice,
}: Props) {
  return (
    <div className="space-y-5">
      <WorkflowInboxSummaryHeader
        title={title}
        subtitle={subtitle}
        statusLabel={statusLabel}
        statusTone={statusTone}
        requesterName={requesterName}
        createdAt={createdAt}
        fields={summaryFields}
      />

      {formError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      {operationalNotice ? (
        <p className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {operationalNotice}
        </p>
      ) : null}

      <WorkflowSameAssigneeAlert show={Boolean(showSameAssigneeAlert)} />

      {detailsContent ? (
        <Collapsible defaultOpen className="rounded-xl border bg-muted/10">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
            <span>جزئیات درخواست</span>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t px-4 py-3">{detailsContent}</CollapsibleContent>
        </Collapsible>
      ) : null}

      {relatedRequestsContent}

      <Collapsible defaultOpen={false} className="rounded-xl border bg-muted/5">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium sm:px-5">
          <span className="text-right">
            <span className="block font-bold text-foreground">روال و مراحل تأیید</span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              هر مرحله با زمان، توضیحات و پیوست‌های همان مرحله
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

      {canDecide ? (
        <section
          className={cn(
            'rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4',
          )}
        >
          <p className="mb-3 text-sm font-semibold text-primary">اقدام شما در این مرحله</p>
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
            checkNumber={checkNumber}
            onCheckNumberChange={onCheckNumberChange}
            checkDueDate={checkDueDate}
            onCheckDueDateChange={onCheckDueDateChange}
            checkBank={checkBank}
            onCheckBankChange={onCheckBankChange}
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
      ) : null}
    </div>
  );
}

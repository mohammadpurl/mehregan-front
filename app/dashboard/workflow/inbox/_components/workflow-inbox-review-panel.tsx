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
        <Collapsible defaultOpen={false} className="rounded-xl border bg-muted/10">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
            <span>جزئیات درخواست</span>
            <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t px-4 py-3">{detailsContent}</CollapsibleContent>
        </Collapsible>
      ) : null}

      {relatedRequestsContent}

      <section className="rounded-xl border bg-muted/5 p-4 sm:p-5">
        <div className="mb-4 text-right">
          <h4 className="text-sm font-bold text-foreground">جریان تأیید</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            هر مرحله با زمان، توضیحات و پیوست‌های همان مرحله
          </p>
        </div>
        <WorkflowApprovalPlanTimeline
          history={approvalHistory}
          loading={planLoading}
          error={planError}
          createdAt={createdAt}
          requesterName={requesterName}
        />
      </section>

      {canDecide ? (
        <section
          className={cn(
            'rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4',
          )}
        >
          <p className="mb-3 text-sm font-semibold text-primary">اقدام شما در این مرحله</p>
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
          />
        </section>
      ) : null}
    </div>
  );
}

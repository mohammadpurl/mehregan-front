export type WorkflowStepPlanStatus = 'pending' | 'approved' | 'rejected';

export interface WorkflowApprovalDecision {
  stepId: number;
  stepOrder?: number | null;
  decision: string;
  comment: string | null;
  approvedBy: number | null;
  approvedByName: string | null;
  createdAt: string | null;
}

export interface WorkflowStepAttachment {
  id: number;
  fileName: string;
  workflowStepId: number | null;
  stepOrder: number | null;
  attachmentScope?: 'workflow_step' | 'request' | 'proforma' | 'invoice' | string;
  downloadUrl?: string | null;
  uploadedBy?: number | null;
  createdAt?: string | null;
}

export interface WorkflowApprovalPlanStep {
  id?: number;
  order: number;
  status: WorkflowStepPlanStatus;
  /** عنوان مرحله از تعریف workflow */
  label?: string | null;
  roleId: number;
  roleName: string | null;
  assignedUserId: number | null;
  assignedUserName: string | null;
  approvedBy: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  /** مرحله‌ای که همان تأییدکننده مرحله قبل به‌صورت خودکار تأیید کرده */
  autoSkippedSameApprover?: boolean;
  /** نوع اقدام: approval | mark_payment | confirm_sepidar | upload_proforma | … */
  stepAction?: string | null;
}

export interface WorkflowApprovalPlan {
  instanceId: number;
  refType: string;
  refId: number;
  status: string;
  steps: WorkflowApprovalPlanStep[];
  decisions?: WorkflowApprovalDecision[];
  stepAttachments?: WorkflowStepAttachment[];
}

export interface WorkflowApprovalHistorySection extends WorkflowApprovalPlan {
  phaseLabel: string;
  isCurrent?: boolean;
}

export interface WorkflowApprovalHistory {
  currentInstanceId: number;
  sections: WorkflowApprovalHistorySection[];
}

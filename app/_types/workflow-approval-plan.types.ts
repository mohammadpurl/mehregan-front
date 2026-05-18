export type WorkflowStepPlanStatus = 'pending' | 'approved' | 'rejected';

export interface WorkflowApprovalPlanStep {
  order: number;
  status: WorkflowStepPlanStatus;
  roleId: number;
  roleName: string | null;
  assignedUserId: number | null;
  assignedUserName: string | null;
  approvedBy: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  /** مرحله‌ای که همان تأییدکننده مرحله قبل به‌صورت خودکار تأیید کرده */
  autoSkippedSameApprover?: boolean;
}

export interface WorkflowApprovalPlan {
  instanceId: number;
  refType: string;
  refId: number;
  status: string;
  steps: WorkflowApprovalPlanStep[];
}

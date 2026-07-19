export type MissionRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REPORT_PENDING_APPROVAL'
  | 'COMPLETED';

export type MissionRequestResponse = {
  id: number;
  requesterId: number;
  requesterName?: string | null;
  title?: string | null;
  destination: string;
  reason: string;
  vehicle: string;
  status: MissionRequestStatus;
  reportText?: string | null;
  reportedAt?: string | null;
  workflowInstanceId?: number | null;
  attachmentCount?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MissionRequestCreateInput = {
  title: string;
  destination: string;
  reason: string;
  vehicle: string;
};

export type MissionListScope = 'mine' | 'team' | 'all' | 'approver' | 'participated';

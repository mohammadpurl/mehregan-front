export type MissionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export type MissionRequestResponse = {
  id: number;
  requesterId: number;
  requesterName?: string | null;
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
  destination: string;
  reason: string;
  vehicle: string;
};

export type MissionListScope = 'mine' | 'team' | 'all' | 'approver' | 'participated';

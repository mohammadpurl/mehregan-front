export type PettyCashStatus = 'pending' | 'approved' | 'rejected' | string;

export type PettyCashSettlementStatus =
  | 'pending_settlement'
  | 'PENDING_SETTLEMENT'
  | 'pending_settlement_approval'
  | 'PENDING_SETTLEMENT_APPROVAL'
  | 'settled'
  | 'SETTLED'
  | string;

export interface PettyCashAttachment {
  id?: string | number;
  fileName?: string;
  fileUrl?: string;
}

export interface PettyCashExpenseLine {
  id?: number;
  description: string;
  amount: number;
  date?: string | null;
}

export interface PettyCashResponse {
  id: number;
  amount: number;
  reason: string;
  description?: string | null;
  status: PettyCashStatus;
  settlementStatus?: PettyCashSettlementStatus | null;
  workflowInstanceId?: number | null;
  requesterId?: string | null;
  requesterName?: string | null;
  expenseLines?: PettyCashExpenseLine[];
  totalExpenses?: number;
  remainingAmount?: number;
  requestedDate?: string | null;
  sepidarRegisteredAt?: string | null;
  sepidarRegisteredBy?: number | null;
  sepidarConfirmedAt?: string | null;
  sepidarConfirmedBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
  documentsUrls?: string[];
  attachments?: PettyCashAttachment[];
  attachmentCount?: number;
  expenseLineCount?: number;
}

export interface PettyCashEligibility {
  canCreate: boolean;
  message?: string;
  reason?: string;
  blockingPettyCashId?: number | null;
}

export interface PettyCashCreateInput {
  amount: number;
  reason: string;
  description?: string;
}

export interface PettyCashExpenseLineInput {
  description: string;
  amount: number;
  date?: string;
}

export type PettyCashStatus = 'pending' | 'approved' | 'rejected' | string;

export type PettyCashSettlementStatus =
  | 'pending_settlement'
  | 'PENDING_SETTLEMENT'
  | 'settled'
  | 'SETTLED'
  | string;

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
  createdAt?: string;
  updatedAt?: string;
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

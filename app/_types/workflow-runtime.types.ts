/** ref_type فرم‌های کسب‌وکار متصل به workflow */
export type WorkflowBusinessRefType =
  | 'workflow_form'
  | 'payment_request'
  | 'payment_order'
  | 'financial_document'
  | 'petty_cash'
  | 'mission_request'
  | 'warehouse_form'
  | 'request'
  | 'purchase_request'
  | 'procurement_proforma';

export type AssigneesByOrder = Record<string, number>;

export interface WorkflowInstance {
  id: number;
  ref_type: WorkflowBusinessRefType;
  ref_id: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowStep {
  id: number;
  instance_id: number;
  order: number;
  role_id: number;
  assigned_user_id?: number | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface WorkflowInstanceDetail extends WorkflowInstance {
  steps?: WorkflowStep[];
}

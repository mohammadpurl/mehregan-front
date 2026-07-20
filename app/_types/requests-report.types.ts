export type RequestReportRefType =
  | 'payment_request'
  | 'payment_order'
  | 'petty_cash'
  | 'petty_cash_settlement'
  | 'financial_document'
  | 'purchase_request'
  | 'request'
  | 'procurement_proforma'
  | 'mission_request'
  | 'mission_report'
  | 'warehouse_form'
  | 'workflow_form'
  | 'ad_hoc_task'
  | string;

export interface RequestReportTypeOption {
  value: string;
  label: string;
}

export interface RequestReportItem {
  id: number;
  refType: string;
  refLabel: string;
  title: string;
  requesterId?: number | null;
  requesterName?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  workflowStatus?: string | null;
  workflowStatusLabel?: string | null;
  amount?: number | null;
  createdAt?: string | null;
  workflowInstanceId?: number | null;
  businessRefId?: number | null;
}

export interface RequestsReport {
  items: RequestReportItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RequestsReportFilters {
  refType?: string;
  requesterId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

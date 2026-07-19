export interface PurchaseLine {
  id?: number;
  itemId?: number | null;
  itemName: string;
  quantity: number;
  description?: string | null;
  /** موجودی انبار ثبت‌شده در مرحله fill_stock */
  stockOnHand?: number | null;
}

export interface ProcurementPaymentSummary {
  id: number;
  amount: number;
  status: string;
  paymentType?: string | null;
  workflowInstanceId?: number | null;
}

export interface PurchaseOrderSummary {
  id: number;
  orderNo?: string | null;
  status?: string | null;
}

export interface WorkflowProgressStep {
  order: number;
  label: string;
  status: string;
  role?: string | null;
  assignedUserName?: string | null;
}

export interface WorkflowProgressPhase {
  phase: 'phase1' | 'phase2' | 'purchase';
  instanceId: number;
  instanceStatus: string;
  steps: WorkflowProgressStep[];
}

export interface PurchaseRequest {
  id: number;
  type: string;
  status: string;
  requesterId: number;
  requesterName?: string | null;
  title?: string | null;
  reason?: string | null;
  items: PurchaseLine[];
  workflowInstanceId?: number | null;
  workflowProgress?: WorkflowProgressPhase[];
  paymentRequestId?: number | null;
  purchaseOrderId?: number | null;
  payment?: ProcurementPaymentSummary | null;
  purchaseOrder?: PurchaseOrderSummary | null;
  createdAt?: string | null;
  attachments?: { id?: number; fileName?: string; fileUrl?: string }[];
  invoices?: { id?: number; fileName?: string; fileUrl?: string; downloadUrl?: string }[];
  approvedPaymentMethod?: string | null;
  approvedPaymentComment?: string | null;
  approvedPaymentLocation?: string | null;
  approvedCheckNumber?: string | null;
  approvedCheckDueDate?: string | null;
  approvedCheckBank?: string | null;
  invoicePaidAt?: string | null;
  destinationWarehouseId?: number | null;
  destinationWarehouseName?: string | null;
  bolAttachments?: { id?: number; fileName?: string; fileUrl?: string; downloadUrl?: string }[];
}

export interface PurchaseProforma {
  id: number;
  requestId: number;
  supplierId: number;
  supplierName?: string | null;
  amount: number;
  notes?: string | null;
  status: string;
  uploadedBy: number;
  createdAt?: string | null;
  fileName?: string | null;
  downloadUrl?: string | null;
}

export interface CreatePurchaseRequestPayload {
  title?: string;
  reason?: string;
  lines: { itemId?: number; itemName: string; quantity: number; description?: string }[];
}

export interface PaginatedPurchaseRequests {
  items: PurchaseRequest[];
  total: number;
  page: number;
  pageSize: number;
}

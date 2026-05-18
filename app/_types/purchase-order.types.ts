export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'sent' | 'closed' | 'cancelled';

export interface PurchaseOrder {
  id: number;
  order_no?: string | null;
  request_id?: string | null;
  supplier_name: string;
  item_name?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  expected_date?: string | null;
  status: PurchaseOrderStatus;
  description?: string | null;
}

export interface CreatePurchaseOrderModel {
  request_id?: string;
  supplier_name: string;
  item_name?: string;
  quantity?: number;
  unit_price?: number;
  expected_date?: string;
  status?: PurchaseOrderStatus;
  description?: string;
}

export interface UpdatePurchaseOrderModel {
  request_id?: string;
  supplier_name?: string;
  item_name?: string;
  quantity?: number;
  unit_price?: number;
  expected_date?: string;
  status?: PurchaseOrderStatus;
  description?: string;
}


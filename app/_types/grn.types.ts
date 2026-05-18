export type GrnStatus = 'draft' | 'received' | 'inspected' | 'posted' | 'cancelled';

export interface Grn {
  id: number;
  grn_no?: string | null;
  po_id?: string | null;
  supplier_name?: string | null;
  item_name?: string | null;
  received_qty?: number | null;
  warehouse_name?: string | null;
  receipt_date?: string | null;
  status: GrnStatus;
  description?: string | null;
}

export interface CreateGrnModel {
  po_id?: string;
  supplier_name?: string;
  item_name?: string;
  received_qty?: number;
  warehouse_name?: string;
  receipt_date?: string;
  status?: GrnStatus;
  description?: string;
}

export interface UpdateGrnModel {
  po_id?: string;
  supplier_name?: string;
  item_name?: string;
  received_qty?: number;
  warehouse_name?: string;
  receipt_date?: string;
  status?: GrnStatus;
  description?: string;
}


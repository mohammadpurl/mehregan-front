export type GrnStatus = 'draft' | 'posted' | 'cancelled';

export interface GoodsReceiptLine {
  id?: number;
  requestItemId?: number | null;
  itemId: number;
  itemName?: string | null;
  quantityReceived: number;
  unitPrice?: number | null;
}

export interface Grn {
  id: number;
  grnNo?: string | null;
  requestId: number;
  supplierId: number;
  supplierName?: string | null;
  warehouseId: number;
  warehouseName?: string | null;
  proformaId?: number | null;
  status: GrnStatus;
  invoiceNotes?: string | null;
  receiptDate?: string | null;
  createdAt?: string | null;
  postedAt?: string | null;
  lines: GoodsReceiptLine[];
  requestStatus?: string | null;
  fileName?: string | null;
  downloadUrl?: string | null;
}

export interface CreateGrnModel {
  requestId: number;
  warehouseId: number;
  supplierId?: number;
  receiptDate?: string;
  invoiceNotes?: string;
  lines?: {
    requestItemId?: number;
    itemId?: number;
    itemName?: string;
    quantityReceived: number;
    unitPrice?: number;
  }[];
}

export interface UpdateGrnModel {
  warehouseId?: number;
  receiptDate?: string;
  invoiceNotes?: string;
  lines?: CreateGrnModel['lines'];
}

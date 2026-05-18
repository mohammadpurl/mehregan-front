/**
 * Types for Product Request Form (فرم درخواست کالا)
 */

export enum ProductType {
  EQUIPMENT = 'equipment', // تجهیزات
  MATERIAL = 'material', // مواد اولیه
  OFFICE_SUPPLIES = 'office_supplies', // ملزومات اداری
  OTHER = 'other' // سایر
}

export interface ProductRequestFormData {
  id?: string;
  productType: ProductType;
  requesterId: string;
  requesterName?: string;
  reason: string; // دلیل درخواست
  description?: string; // کادر توضیحات
  preInvoice?: File; // پیش فاکتور
  preInvoiceUrl?: string;
  documents?: File[]; // مستندات
  documentsUrls?: string[];
  items?: ProductRequestItem[];
  status?: 'pending' | 'approved' | 'rejected' | 'purchased';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRequestItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  description?: string;
}

export interface ProductRequestResponse {
  id: string;
  productType: ProductType;
  requesterId: string;
  requesterName: string;
  reason: string;
  description?: string;
  preInvoiceUrl?: string;
  documentsUrls: string[];
  items: ProductRequestItem[];
  status: 'pending' | 'approved' | 'rejected' | 'purchased';
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequestListResponse {
  items: ProductRequestResponse[];
  total: number;
  page: number;
  pageSize: number;
}

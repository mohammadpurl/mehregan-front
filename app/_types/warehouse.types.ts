/**
 * Types for Warehouse Form (فرم انبار)
 */

export enum WarehouseFormType {
  ENTRY = 'entry', // ورود
  EXIT = 'exit', // خروج
  TRANSFER = 'transfer' // انتقال
}

export interface WarehouseLocation {
  id: string;
  name: string;
  address?: string;
}

export interface WarehouseFormData {
  id?: string;
  type: WarehouseFormType;
  source: WarehouseLocation; // مبداء
  destination: WarehouseLocation; // مقصد
  date: string; // تاریخ ورود/خروج/انتقال
  receiverName: string; // شخص دریافت کننده
  description?: string; // کادر توضیحات
  items?: WarehouseItem[];
  requesterId: string;
  requesterName?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt?: string;
  updatedAt?: string;
}

export interface WarehouseItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string; // واحد اندازه‌گیری
  description?: string;
}

export interface WarehouseResponse {
  id: string;
  type: WarehouseFormType;
  source: WarehouseLocation;
  destination: WarehouseLocation;
  date: string;
  receiverName: string;
  description?: string;
  items: WarehouseItem[];
  requesterId: string;
  requesterName: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseListResponse {
  items: WarehouseResponse[];
  total: number;
  page: number;
  pageSize: number;
}

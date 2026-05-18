export interface Warehouse {
  id: number;
  name: string;
  code?: string | null;
  address?: string | null;
  is_active?: boolean;
  description?: string | null;
}

export interface CreateWarehouseModel {
  name: string;
  code?: string;
  address?: string;
  is_active?: boolean;
  description?: string;
}

export interface UpdateWarehouseModel {
  name?: string;
  code?: string;
  address?: string;
  is_active?: boolean;
  description?: string;
}


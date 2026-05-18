export interface Supplier {
  id: number;
  name: string;
  code?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active?: boolean;
  description?: string | null;
}

export interface CreateSupplierModel {
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
  description?: string;
}

export interface UpdateSupplierModel {
  name?: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
  description?: string;
}


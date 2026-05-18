export interface Item {
  id: number;
  name: string;
  sku?: string | null;
  unit?: string | null;
  is_active?: boolean;
  description?: string | null;
  category_id?: number | null;
  category_name?: string | null;
}

export interface CreateItemModel {
  name: string;
  sku?: string;
  unit?: string;
  is_active?: boolean;
  description?: string;
  category_id?: number | null;
}

export interface UpdateItemModel {
  name?: string;
  sku?: string;
  unit?: string;
  is_active?: boolean;
  description?: string;
  category_id?: number | null;
}


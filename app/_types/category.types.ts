export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  parent_name?: string | null;
  children_count: number;
  items_count: number;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  parent_id: number | null;
  children: CategoryTreeNode[];
}

export interface CreateCategoryModel {
  name: string;
  parent_id?: number | null;
}

export interface UpdateCategoryModel {
  name?: string;
  parent_id?: number | null;
}

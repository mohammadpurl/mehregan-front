export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  is_active?: boolean;
  role_id?: number | null;
  /** اگر API برگرداند */
  role_name?: string | null;
  role_display_name?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  manager_id?: number | null;
  manager_name?: string | null;
  card_number?: string | null;
  sheba_number?: string | null;
}

export interface CreateUserModel {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active?: boolean;
  role_id?: number;
  department_id?: number;
  manager_id?: number;
  card_number?: string;
  sheba_number?: string;
}

export interface ManagerLookupItem {
  id: number;
  label: string;
}

export interface UpdateUserModel {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active?: boolean;
  role_id?: number;
  department_id?: number;
  manager_id?: number;
  card_number?: string;
  sheba_number?: string;
}

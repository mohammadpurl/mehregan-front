export interface Permission {
  id: number;
  name: string;
  code: string; 
}

export interface CreatePermissionModel {
  code: string;
  name: string;
}

export interface UpdatePermissionModel {
  id: number;
  name: string;
  code: string;
}


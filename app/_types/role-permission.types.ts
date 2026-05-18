export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
}

export interface RolePermissionReplaceModel {
  role_id: number;
  permission_ids: number[];
}


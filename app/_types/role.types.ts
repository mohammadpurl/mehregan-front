export interface Role {
  id: number;
  name: string;
  displayName?: string | null;
  isSingleton?: boolean;
}

export function roleLabel(role: Role): string {
  const label = role.displayName?.trim();
  return label || role.name;
}

export interface CreateRoleModel {
  name: string;
  displayName: string;
  isSingleton?: boolean;
}

export interface UpdateRoleModel {
  name: string;
  displayName: string;
  isSingleton?: boolean;
}


'use server';

import { createDataWithAuth, readDataWithAuth } from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import { RolePermission, RolePermissionReplaceModel } from '@/app/_types/role-permission.types';

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[ROLE-PERMISSION-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

function toRolePermission(item: unknown, roleId: number, index: number): RolePermission | null {
  if (typeof item === 'number' && Number.isFinite(item)) {
    return { id: index, role_id: roleId, permission_id: item };
  }
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;
  const permissionId = o.permission_id ?? o.permissionId ?? o.id;
  if (permissionId == null || !Number.isFinite(Number(permissionId))) return null;
  return {
    id: Number(o.id ?? index),
    role_id: Number(o.role_id ?? roleId),
    permission_id: Number(permissionId),
  };
}

/** API ممکن است آرایه، items، یا permission_ids برگرداند */
function normalizeRolePermissionsResponse(data: unknown, roleId: number): RolePermission[] {
  if (data == null) return [];

  if (Array.isArray(data)) {
    return data
      .map((item, index) => toRolePermission(item, roleId, index))
      .filter((x): x is RolePermission => x != null);
  }

  if (typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.items)) return normalizeRolePermissionsResponse(o.items, roleId);
    if (Array.isArray(o.permissions)) return normalizeRolePermissionsResponse(o.permissions, roleId);
    if (Array.isArray(o.data)) return normalizeRolePermissionsResponse(o.data, roleId);
    if (Array.isArray(o.permission_ids)) {
      return o.permission_ids
        .map((id, index) => toRolePermission(id, roleId, index))
        .filter((x): x is RolePermission => x != null);
    }
  }

  return [];
}

export async function getRolePermissionsAction(roleId: number) {
  try {
    const raw = await readDataWithAuth<unknown>(`/roles/${roleId}/permissions`);
    const data = normalizeRolePermissionsResponse(raw, roleId);
    return { success: true as const, data };
  } catch (err: unknown) {
    const message = extractActionErrorMessage(err, 'خطا در دریافت مجوزهای نقش');
    log('error', 'getRolePermissionsAction failed', { error: message, roleId });
    return { success: false, error: message };
  }
}

export async function replaceRolePermissionsAction(model: RolePermissionReplaceModel) {
  try {
    await createDataWithAuth<RolePermissionReplaceModel, { success: boolean }>(
      `/roles/${model.role_id}/permissions/replace`,
      model
    );
    return { success: true };
  } catch (err: unknown) {
    const message = extractActionErrorMessage(err, 'خطا در ذخیره دسترسی‌های نقش');
    log('error', 'replaceRolePermissionsAction failed', { error: message, roleId: model.role_id });
    return { success: false, error: message };
  }
}


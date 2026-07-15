import type { AdminUser } from '@/app/_types/user.types';
import type { ProfileDto } from '@/app/_types/profile.types';

function pickStr(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
}

/** نرمال‌سازی آیتم لیست کاربران — snake_case و camelCase */
export function normalizeAdminUser(raw: unknown): AdminUser {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: Number(r.id),
    username: String(r.username ?? ''),
    email: String(r.email ?? ''),
    first_name: (r.first_name ?? r.firstName) as string | null | undefined,
    last_name: (r.last_name ?? r.lastName) as string | null | undefined,
    full_name: (r.full_name ?? r.fullName) as string | null | undefined,
    phone: (r.phone ?? r.mobile) as string | null | undefined,
    is_active: r.is_active !== undefined ? Boolean(r.is_active) : r.isActive !== undefined ? Boolean(r.isActive) : true,
    role_id: (r.role_id ?? r.roleId) as number | null | undefined,
    role_name: (r.role_name ?? r.roleName ?? r.role_display_name ?? r.roleDisplayName) as
      | string
      | null
      | undefined,
    department_id: (r.department_id ?? r.departmentId) as number | null | undefined,
    department_name: (r.department_name ?? r.departmentName) as string | null | undefined,
    manager_id: (r.manager_id ?? r.managerId) as number | null | undefined,
    manager_name: (r.manager_name ?? r.managerName) as string | null | undefined,
    account_number: pickStr(r, 'account_number', 'accountNumber') ?? null,
    card_number: pickStr(r, 'card_number', 'cardNumber') ?? null,
    sheba_number: pickStr(r, 'sheba_number', 'shebaNumber') ?? null,
  };
}

export function normalizeAdminUserList(items: unknown[]): AdminUser[] {
  return items.map(normalizeAdminUser);
}

/** نرمال‌سازی پاسخ GET /auth/me */
export function normalizeProfileFromApi(raw: unknown): ProfileDto {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const first = String(r.first_name ?? r.firstName ?? '');
  const last = String(r.last_name ?? r.lastName ?? '');
  const full =
    String(r.full_name ?? r.fullName ?? '').trim() ||
    [first, last].filter(Boolean).join(' ').trim() ||
    String(r.username ?? '');

  return {
    id: Number(r.id),
    username: String(r.username ?? ''),
    email: String(r.email ?? ''),
    mobile: String(r.mobile ?? r.phone ?? ''),
    first_name: first,
    last_name: last,
    national_id: String(r.national_id ?? r.nationalId ?? ''),
    father_name: String(r.father_name ?? r.fatherName ?? ''),
    pic: String(r.pic ?? r.picUrl ?? ''),
    full_name: full,
    account_number: pickStr(r, 'account_number', 'accountNumber', 'bank_account_number', 'bankAccountNumber'),
    card_number: pickStr(r, 'card_number', 'cardNumber'),
    sheba_number: pickStr(r, 'sheba_number', 'shebaNumber'),
    bank_account_number: pickStr(
      r,
      'account_number',
      'accountNumber',
      'bank_account_number',
      'bankAccountNumber',
    ),
  };
}

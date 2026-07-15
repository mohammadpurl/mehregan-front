import type { AdminUserCreateFormValues, AdminUserUpdateFormValues } from '../_types/user.schema';
import type { AdminUser, CreateUserModel, UpdateUserModel } from '@/app/_types/user.types';

export function roleIdFromForm(val: string | undefined): number | undefined {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** در ویرایش، مقدار خالی یعنی حذف (ارسال 0 به API) */
export function optionalIdFromForm(
  val: string | undefined,
  opts?: { clearOnEmpty?: boolean },
): number | undefined {
  const id = roleIdFromForm(val);
  if (id !== undefined) return id;
  if (opts?.clearOnEmpty && val !== undefined && String(val).trim() === '') return 0;
  return undefined;
}

/** @deprecated use optionalIdFromForm */
export const departmentIdFromForm = optionalIdFromForm;

export function parseFiniteId(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** نمایش نام کامل در جدول — اول full_name از API، بعد ترکیب نام و نام خانوادگی */
export function displayUserFullName(
  user: Pick<AdminUser, 'full_name' | 'first_name' | 'last_name'>,
): string {
  const fromApi = user.full_name?.trim();
  if (fromApi) return fromApi;
  const fromParts = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return fromParts || '—';
}

function splitFullName(fullName?: string | null): { first_name: string; last_name: string } {
  const trimmed = fullName?.trim() ?? '';
  if (!trimmed) return { first_name: '', last_name: '' };
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) return { first_name: trimmed, last_name: '' };
  return {
    first_name: trimmed.slice(0, spaceIndex),
    last_name: trimmed.slice(spaceIndex + 1).trim(),
  };
}

function bankingFromForm(account?: string, card?: string, sheba?: string) {
  const account_number = account?.replace(/\s|-/g, '').trim() || undefined;
  const card_number = card?.replace(/\s|-/g, '').trim() || undefined;
  let sheba_number = sheba?.replace(/\s/g, '').trim().toUpperCase();
  if (sheba_number && !sheba_number.startsWith('IR')) sheba_number = `IR${sheba_number}`;
  if (!sheba_number) sheba_number = undefined;
  return { account_number, card_number, sheba_number };
}

export function createFormToModel(data: AdminUserCreateFormValues): CreateUserModel {
  const banking = bankingFromForm(data.account_number, data.card_number, data.sheba_number);
  return {
    username: data.username,
    email: data.email,
    password: data.password,
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    phone: data.phone || undefined,
    is_active: data.is_active === 'true',
    role_id: roleIdFromForm(data.role_id),
    department_id: optionalIdFromForm(data.department_id),
    manager_id: optionalIdFromForm(data.manager_id),
    ...banking,
  };
}

export function updateFormToModel(data: AdminUserUpdateFormValues): UpdateUserModel {
  const banking = bankingFromForm(data.account_number, data.card_number, data.sheba_number);
  return {
    username: data.username,
    email: data.email,
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    phone: data.phone || undefined,
    is_active: data.is_active === 'true',
    role_id: roleIdFromForm(data.role_id),
    department_id: optionalIdFromForm(data.department_id, { clearOnEmpty: true }),
    manager_id: optionalIdFromForm(data.manager_id, { clearOnEmpty: true }),
    ...banking,
    ...(data.password?.trim() ? { password: data.password.trim() } : {}),
  };
}

type SelectOption = { label: string; value: string };

/** اگر مقدار فعلی در لیست گزینه‌ها نیست، یک گزینه اضافه می‌کند (برای نمایش در ویرایش) */
export function ensureSelectOption(
  options: SelectOption[],
  value: string | undefined,
  fallbackLabel: string | undefined,
): SelectOption[] {
  const v = value?.trim();
  if (!v) return options;
  if (options.some((o) => o.value === v)) return options;
  const label = fallbackLabel?.trim() || `شناسه ${v}`;
  return [...options, { label, value: v }];
}

export function userToFormDefaults(user?: Partial<AdminUser>): AdminUserCreateFormValues {
  const fromParts =
    user?.first_name != null || user?.last_name != null
      ? { first_name: user.first_name ?? '', last_name: user.last_name ?? '' }
      : splitFullName(user?.full_name);

  return {
    username: user?.username ?? '',
    email: user?.email ?? '',
    first_name: fromParts.first_name,
    last_name: fromParts.last_name,
    phone: user?.phone ?? '',
    password: '',
    role_id: user?.role_id != null ? String(user.role_id) : '',
    department_id: user?.department_id != null ? String(user.department_id) : '',
    manager_id: user?.manager_id != null ? String(user.manager_id) : '',
    is_active: user?.is_active === false ? 'false' : 'true',
    account_number: user?.account_number ?? '',
    card_number: user?.card_number ?? '',
    sheba_number: user?.sheba_number ?? '',
  };
}

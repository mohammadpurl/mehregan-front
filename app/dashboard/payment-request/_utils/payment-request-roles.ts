/** alias نقش‌هایی که اجازه تعیین حساب مبدأ (مدیر مالی) دارند */
export const FINANCE_ROLE_ALIASES = [
  'مدیر مالی',
  'financial_manager',
  'finance',
  'finance_manager',
] as const;

/** مدیر عامل — همراه مدیر مالی می‌تواند حساب مبدأ را در فرم ثبت ببیند */
export const CEO_ROLE_ALIASES = [
  'ceo',
  'مدیرعامل',
  'مدیر عامل',
  'chief_executive',
] as const;

/** تأییدکننده: شرایط وام/مساعده + (در صورت نقش مالی) حساب مبدأ */
export const APPROVER_ROLE_ALIASES = [
  ...FINANCE_ROLE_ALIASES,
  'admin',
  'super-admin',
  'مدیر سیستم',
  'system_admin',
] as const;

function matchRole(roles: string[] | undefined, aliases: readonly string[]): boolean {
  if (!roles?.length) return false;
  const lower = roles.map((r) => r.trim().toLowerCase());
  return aliases.some((alias) => lower.some((r) => r === alias.toLowerCase() || r.includes(alias.toLowerCase())));
}

export function isFinanceRole(roles: string[] | undefined): boolean {
  return matchRole(roles, FINANCE_ROLE_ALIASES);
}

/** مرحلهٔ جاری workflow از روی نام نقش (مثلاً finance_manager / مدیر مالی) */
export function isFinanceWorkflowStepRole(roleName: string | null | undefined): boolean {
  if (!roleName?.trim()) return false;
  const r = roleName.trim().toLowerCase().replace(/\s+/g, '_');
  return FINANCE_ROLE_ALIASES.some((alias) => {
    const a = alias.toLowerCase().replace(/\s+/g, '_');
    return r === a || r.includes(a) || a.includes(r);
  });
}

export function isApproverRole(roles: string[] | undefined): boolean {
  return matchRole(roles, APPROVER_ROLE_ALIASES);
}

export function isCeoRole(roles: string[] | undefined): boolean {
  return matchRole(roles, CEO_ROLE_ALIASES);
}

/** نمایش/تکمیل فیلد حساب مبدأ در فرم ثبت دستور پرداخت */
export function canSetPayerAccountRole(roles: string[] | undefined): boolean {
  return isFinanceRole(roles) || isCeoRole(roles);
}

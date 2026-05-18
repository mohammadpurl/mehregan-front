/**
 * تطابق مجوز با پشتیبانی از * و wildcard مثل item.*
 * (هم‌راستا با app/services/permission.py در بک‌اند)
 */
export function permissionMatches(
  have: string[] | undefined,
  need: string
): boolean {
  if (!need) return true;
  const set = new Set(have ?? []);
  if (set.has("*")) return true;
  if (set.has(need)) return true;
  for (const p of set) {
    if (p.endsWith(".*")) {
      const prefix = p.slice(0, -2);
      if (need === prefix || need.startsWith(`${prefix}.`)) {
        return true;
      }
    }
  }
  return false;
}

export function hasAnyPermission(
  have: string[] | undefined,
  required: string[] | undefined
): boolean {
  if (!required || required.length === 0) return true;
  return required.some((code) => permissionMatches(have, code));
}

export function hasAnyRole(
  have: string[] | undefined,
  required: string[] | undefined
): boolean {
  if (!required || required.length === 0) return true;
  const set = new Set(have ?? []);
  return required.some((role) => set.has(role));
}

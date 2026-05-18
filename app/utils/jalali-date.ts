import jalaali from 'jalaali-js';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** ارقام فارسی → لاتین */
export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (ch) => String(FA_DIGITS.indexOf(ch)));
}

/** ارقام لاتین → فارسی */
export function toPersianDigits(input: string): string {
  return input.replace(/\d/g, (d) => FA_DIGITS[Number(d)] ?? d);
}

/** تاریخ امروز میلادی برای API (YYYY-MM-DD) */
export function todayGregorianIso(): string {
  return jsDateToGregorianIso(new Date());
}

/** ISO میلادی → Date (محلی، ظهر) برای date-picker */
export function gregorianIsoToJsDate(iso: string | null | undefined): Date | undefined {
  const parts = iso ? parseGregorianParts(iso) : null;
  if (!parts) return undefined;
  return new Date(parts.y, parts.m - 1, parts.d, 12, 0, 0, 0);
}

/** Date → ISO میلادی YYYY-MM-DD */
export function jsDateToGregorianIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseGregorianParts(iso: string): { y: number; m: number; d: number } | null {
  const raw = iso.trim();
  if (!raw) return null;
  const datePart = raw.includes('T') ? raw.split('T')[0]! : raw.split(' ')[0]!;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(datePart);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return { y, m: mo, d };
}

/** ISO میلادی → نمایش شمسی 1404/02/26 (با ارقام فارسی) */
export function gregorianIsoToJalaliDisplay(iso: string | null | undefined, persianDigits = true): string {
  const parts = iso ? parseGregorianParts(iso) : null;
  if (!parts) return '';
  try {
    const j = jalaali.toJalaali(parts.y, parts.m, parts.d);
    const s = `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
    return persianDigits ? toPersianDigits(s) : s;
  } catch {
    return '';
  }
}

/** ورودی شمسی کاربر → ISO میلادی برای ذخیره در API */
export function jalaliInputToGregorianIso(input: string): string | null {
  const normalized = toLatinDigits(input.trim()).replace(/-/g, '/');
  if (!normalized) return null;

  let jy: number;
  let jm: number;
  let jd: number;

  const slash = normalized.split('/').filter(Boolean);
  if (slash.length === 3) {
    jy = Number(slash[0]);
    jm = Number(slash[1]);
    jd = Number(slash[2]);
  } else if (/^\d{8}$/.test(normalized)) {
    jy = Number(normalized.slice(0, 4));
    jm = Number(normalized.slice(4, 6));
    jd = Number(normalized.slice(6, 8));
  } else {
    return null;
  }

  if (!jalaali.isValidJalaaliDate(jy, jm, jd)) return null;
  const g = jalaali.toGregorian(jy, jm, jd);
  return `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`;
}

/** نمایش تاریخ (میلادی یا شمسی یا ISO) به شمسی */
export function formatJalaliDate(
  value: string | Date | null | undefined,
  options?: { withTime?: boolean; fallback?: string; persianDigits?: boolean },
): string {
  const fallback = options?.fallback ?? '—';
  if (value == null || value === '') return fallback;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback;
    const iso = `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
    const datePart = gregorianIsoToJalaliDisplay(iso, options?.persianDigits !== false);
    if (!options?.withTime) return datePart || fallback;
    const time = value.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    return datePart ? `${datePart} ${toPersianDigits(time)}` : fallback;
  }

  const str = String(value).trim();
  if (!str) return fallback;

  const jalaliIso = jalaliInputToGregorianIso(str);
  if (jalaliIso && str.includes('/')) {
    return gregorianIsoToJalaliDisplay(jalaliIso, options?.persianDigits !== false) || fallback;
  }

  const parts = parseGregorianParts(str);
  if (parts) {
    const datePart = gregorianIsoToJalaliDisplay(str, options?.persianDigits !== false);
    if (!options?.withTime) return datePart || fallback;
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return datePart || fallback;
    const time = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    return datePart ? `${datePart} ${toPersianDigits(time)}` : fallback;
  }

  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    return formatJalaliDate(d, options);
  }

  return fallback;
}

/** متن تاریخ شمسی برای ذخیره در فیلدهای توضیحی (reason و …) */
export function formatJalaliDateForStorage(iso: string | null | undefined): string {
  const display = gregorianIsoToJalaliDisplay(iso, true);
  return display || String(iso ?? '').trim();
}

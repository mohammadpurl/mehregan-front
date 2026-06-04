import { gregorianIsoToJsDate, jsDateToGregorianIso } from '@/app/utils/jalali-date';

/** فردا ساعت ۱۷:۰۰ — پیش‌فرض مهلت انجام */
export function defaultDueDatetimeParts(): { date: string; time: string } {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(17, 0, 0, 0);
  return {
    date: jsDateToGregorianIso(d),
    time: '17:00',
  };
}

/** تاریخ میلادی YYYY-MM-DD + ساعت HH:mm → ISO برای API */
export function combineDateAndTimeToIso(dateIso: string, time: string): string | null {
  if (!dateIso?.trim() || !time?.trim()) return null;
  const parts = time.trim().split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  const base = gregorianIsoToJsDate(dateIso);
  if (!base || !Number.isFinite(h) || !Number.isFinite(m)) return null;
  base.setHours(h, m, 0, 0);
  return base.toISOString();
}

/** ISO → بخش تاریخ و ساعت برای فرم */
export function isoToDateAndTime(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return defaultDueDatetimeParts();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return defaultDueDatetimeParts();
  return {
    date: jsDateToGregorianIso(d),
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  };
}

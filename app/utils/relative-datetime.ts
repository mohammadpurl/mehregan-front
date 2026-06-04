import { formatJalaliDate } from '@/app/utils/jalali-date';

/** تاریخ/زمان API را به UTC تبدیل می‌کند (بک‌اند معمولاً naive UTC می‌فرستد). */
export function parseApiUtcDate(input: string | null | undefined): Date | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T00:00:00.000Z`);
  }

  const hasTz = /[zZ]$/.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw);
  const normalized = hasTz ? raw : raw.includes('T') ? `${raw}Z` : `${raw.replace(' ', 'T')}Z`;
  const d = new Date(normalized);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function formatRelativeTimeFa(from: Date, to: Date = new Date()): string {
  const diffMs = to.getTime() - from.getTime();
  if (diffMs < 0) return 'همین حالا';
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'همین حالا';
  if (diffMin < 60) return `${diffMin} دقیقه پیش`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ساعت پیش`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} روز پیش`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} ماه پیش`;
  return formatJalaliDate(from, { withTime: true });
}

export type NotificationTimeMeta = {
  receivedRelative: string;
  receivedAbsolute: string;
  requestRelative?: string;
  requestAbsolute?: string;
};

export function formatNotificationTimeMeta(
  createdAt: string | null | undefined,
  requestCreatedAt?: string | null,
): NotificationTimeMeta {
  const received = parseApiUtcDate(createdAt);
  const receivedRelative = received ? formatRelativeTimeFa(received) : '';
  const receivedAbsolute = received
    ? formatJalaliDate(received, { withTime: true })
    : '';

  const request = parseApiUtcDate(requestCreatedAt);
  if (!request) {
    return { receivedRelative, receivedAbsolute };
  }

  return {
    receivedRelative,
    receivedAbsolute,
    requestRelative: formatRelativeTimeFa(request),
    requestAbsolute: formatJalaliDate(request, { withTime: true }),
  };
}

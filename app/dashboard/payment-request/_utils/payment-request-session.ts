import type { UserSession } from '@/app/(auth)/_types/auth.types';

type SessionWithIds = UserSession & { sub?: string; id?: string | number };

export function getNumericUserIdFromClientSession(session: UserSession | null | undefined): number {
  const n = Number(getRequesterIdFromClientSession(session));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function getRequesterIdFromClientSession(session: UserSession | null | undefined): string {
  if (!session) return '';
  const s = session as SessionWithIds;
  return String(
    s.userId ?? s.sub ?? (s.id != null && s.id !== '' ? String(s.id) : undefined) ?? s.userName ?? '',
  ).trim();
}

/** تطابق شناسه درخواست‌کننده با سشن (عددی یا رشته) */
export function isPaymentRequestOwner(
  record: { requesterId?: string },
  session: UserSession | null | undefined,
): boolean {
  const ownerId = String(record.requesterId ?? '').trim();
  if (!ownerId) return true;
  const me = getRequesterIdFromClientSession(session);
  if (me && me === ownerId) return true;
  const s = session as SessionWithIds | null | undefined;
  const altIds = [s?.userId, s?.sub, s?.id != null ? String(s.id) : ''].map((x) => String(x ?? '').trim()).filter(Boolean);
  return altIds.some((id) => id === ownerId);
}

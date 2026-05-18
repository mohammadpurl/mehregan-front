import type { UserSession } from '@/app/(auth)/_types/auth.types';
import { getSession } from '@/app/utils/session';

type SessionWithIds = UserSession & { sub?: string; id?: string | number };

/**
 * Maps the encrypted app session to requester fields expected by workflow / warehouse / request APIs.
 * Prefer JWT `userId` when present; otherwise `sub` / `id`; fallback to `userName`.
 */
export async function getRequesterFromSession(): Promise<{ requesterId: string; requesterName: string }> {
  const session = await getSession();
  if (!session) {
    return { requesterId: '', requesterName: '' };
  }
  const s = session as SessionWithIds;
  const requesterId = String(
    s.userId ?? s.sub ?? (s.id != null && s.id !== '' ? String(s.id) : undefined) ?? s.userName ?? '',
  ).trim();
  const requesterName = String(s.fullName ?? s.userName ?? '').trim();
  return { requesterId, requesterName };
}

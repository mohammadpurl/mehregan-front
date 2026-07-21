import { uploadDataWithAuth } from '@/app/core/http-service/http-service';
import type { ProfileDto } from '@/app/_types/profile.types';
import type { UserSession } from '@/app/(auth)/_types/auth.types';
import { encryptSession, getSession } from '@/app/utils/session';
import {
  authCookieOptions,
  ERP_ACCESS_TOKEN_COOKIE,
  ERP_SESSION_COOKIE,
} from '@/app/utils/auth-cookie';
import { validateAvatarFile } from '@/app/utils/validate-avatar';
import { normalizeProfileBankFields } from '@/app/utils/profile-bank';
import { normalizeProfileFromApi } from '@/app/utils/user-mapper';
import { cookies } from 'next/headers';
import { API_URL } from '@/configs/global';

export function extractProfileErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  const error = err as {
    message?: string;
    response?: { data?: { message?: string; detail?: string } };
  };
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    'خطای نامشخص'
  );
}

export async function syncSessionProfileFields(profile: ProfileDto) {
  const session = await getSession();
  if (!session) return;

  const fullName =
    profile.full_name?.trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
    session.fullName;

  const { accesstoken, ...rest } = session;
  const updated: UserSession = {
    ...rest,
    fullName,
    pic: profile.pic ?? session.pic,
  };

  const encryptedSession = await encryptSession(updated);
  const cookieStore = await cookies();
  const opts = authCookieOptions();
  cookieStore.set(ERP_SESSION_COOKIE, encryptedSession, opts);
  if (accesstoken?.trim()) {
    cookieStore.set(ERP_ACCESS_TOKEN_COOKIE, accesstoken, opts);
  }
}

export async function uploadProfileAvatarFile(file: File): Promise<ProfileDto> {
  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new Error(validationError);
  }
  const form = new FormData();
  form.append('file', file);
  const raw = await uploadDataWithAuth<unknown>('/auth/profile/avatar', form);
  const data = normalizeProfileBankFields(normalizeProfileFromApi(raw));
  await syncSessionProfileFields(data);
  return data;
}

export async function deleteProfileAvatarRemote(): Promise<ProfileDto> {
  const session = await getSession();
  if (!session?.accesstoken) {
    throw new Error('لطفاً دوباره وارد شوید');
  }

  const apiBase = API_URL.replace(/\/$/, '');
  const backendRes = await fetch(`${apiBase}/auth/profile/avatar`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.accesstoken}` },
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    let detail = 'خطا در حذف تصویر';
    try {
      const body = (await backendRes.json()) as { detail?: string; message?: string };
      detail = body.detail || body.message || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const raw = await backendRes.json().catch(() => null);
  const data = normalizeProfileBankFields(normalizeProfileFromApi(raw ?? {}));
  await syncSessionProfileFields(data);
  return data;
}

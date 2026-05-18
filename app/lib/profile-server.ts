import {
  deleteDataWithAuth,
  readDataWithAuth,
  uploadDataWithAuth,
} from '@/app/core/http-service/http-service';
import type { ProfileDto } from '@/app/_types/profile.types';
import type { UserSession } from '@/app/(auth)/_types/auth.types';
import { encryptSession, getSession } from '@/app/utils/session';
import { validateAvatarFile } from '@/app/utils/validate-avatar';
import { cookies } from 'next/headers';

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

  const updated: UserSession = {
    ...session,
    fullName,
    pic: profile.pic ?? session.pic,
  };

  const encryptedSession = await encryptSession(updated);
  const cookieStore = await cookies();
  cookieStore.set('erp-session', encryptedSession, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    path: '/',
  });
}

export async function uploadProfileAvatarFile(file: File): Promise<ProfileDto> {
  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const body = new FormData();
  body.append('file', file);

  const data = await uploadDataWithAuth<ProfileDto>('/auth/profile/avatar', body);
  await syncSessionProfileFields(data);
  return data;
}

export async function deleteProfileAvatarRemote(): Promise<ProfileDto> {
  await deleteDataWithAuth('/auth/profile/avatar');
  const me = await readDataWithAuth<ProfileDto>('/auth/me');
  await syncSessionProfileFields({ ...me, pic: '' });
  return me;
}

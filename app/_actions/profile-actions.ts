'use server';

import { patchDataWithAuth, readDataWithAuth } from '@/app/core/http-service/http-service';
import type { UpdateProfileModel } from '@/app/_types/profile.types';
import {
  deleteProfileAvatarRemote,
  extractProfileErrorMessage,
  syncSessionProfileFields,
  uploadProfileAvatarFile,
} from '@/app/lib/profile-server';
import { normalizeProfileBankFields } from '@/app/utils/profile-bank';
import { normalizeProfileFromApi } from '@/app/utils/user-mapper';

const log = (level: 'info' | 'error', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`[PROFILE-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function getProfileAction() {
  try {
    log('info', 'getProfileAction request');
    const data = normalizeProfileBankFields(
      normalizeProfileFromApi(await readDataWithAuth<unknown>('/auth/me')),
    );
    log('info', 'getProfileAction success', { id: data.id });
    return { success: true as const, data };
  } catch (err: unknown) {
    log('error', 'getProfileAction failed', { error: extractProfileErrorMessage(err) });
    return { success: false as const, error: extractProfileErrorMessage(err) || 'خطا در دریافت پروفایل' };
  }
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

function sanitizeProfileUpdate(model: UpdateProfileModel): UpdateProfileModel {
  const account = model.account_number?.replace(/\s|-/g, '').trim() || null;
  const card = model.card_number?.replace(/\s|-/g, '').trim() || null;
  let sheba = model.sheba_number?.replace(/\s/g, '').trim().toUpperCase() || '';
  if (sheba && !sheba.startsWith('IR')) sheba = `IR${sheba}`;
  return {
    email: model.email.trim(),
    mobile: model.mobile.trim(),
    first_name: model.first_name.trim(),
    last_name: model.last_name.trim(),
    national_id: emptyToUndefined(model.national_id),
    father_name: emptyToUndefined(model.father_name),
    account_number: account,
    card_number: card,
    sheba_number: sheba || null,
  };
}

export async function updateProfileAction(model: UpdateProfileModel) {
  try {
    const payload = sanitizeProfileUpdate(model);
    log('info', 'updateProfileAction request', { email: payload.email });
    const data = normalizeProfileBankFields(
      normalizeProfileFromApi(
        await patchDataWithAuth<UpdateProfileModel, unknown>('/auth/profile', payload),
      ),
    );
    await syncSessionProfileFields(data);
    log('info', 'updateProfileAction success', { id: data.id });
    return { success: true as const, data };
  } catch (err: unknown) {
    log('error', 'updateProfileAction failed', { error: extractProfileErrorMessage(err) });
    return { success: false as const, error: extractProfileErrorMessage(err) || 'خطا در به‌روزرسانی پروفایل' };
  }
}

/** ترجیحاً از `/api/profile/avatar` در کلاینت استفاده شود (بدون محدودیت ۱MB اکشن) */
export async function uploadProfileAvatarAction(formData: FormData) {
  try {
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return { success: false as const, error: 'فایل تصویر یافت نشد' };
    }
    const data = await uploadProfileAvatarFile(file);
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractProfileErrorMessage(err) || 'خطا در آپلود تصویر' };
  }
}

export async function deleteProfileAvatarAction() {
  try {
    const data = await deleteProfileAvatarRemote();
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractProfileErrorMessage(err) || 'خطا در حذف تصویر' };
  }
}

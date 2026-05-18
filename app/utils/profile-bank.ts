import type { ProfileDto } from '@/app/_types/profile.types';

/** نام صاحب حساب = خود کاربر */
export function profileDisplayName(profile: ProfileDto): string {
  const fromParts = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
  return profile.full_name?.trim() || fromParts || profile.username?.trim() || '';
}

export function profileCardNumber(profile: ProfileDto): string {
  return String(profile.card_number ?? '').replace(/\s|-/g, '');
}

export function profileShebaNumber(profile: ProfileDto): string {
  const raw = String(profile.sheba_number ?? profile.bank_account_number ?? '')
    .trim()
    .replace(/\s/g, '')
    .toUpperCase();
  if (!raw) return '';
  return raw.startsWith('IR') ? raw : `IR${raw}`;
}

/** شماره واریز: اولویت شبا، سپس کارت */
export function profilePayoutAccountNumber(profile: ProfileDto): string {
  return profileShebaNumber(profile) || profileCardNumber(profile);
}

export function normalizeProfileBankFields(profile: ProfileDto): ProfileDto {
  const card = profileCardNumber(profile) || profile.card_number;
  const sheba = profileShebaNumber(profile) || profile.sheba_number;
  return {
    ...profile,
    card_number: card || undefined,
    sheba_number: sheba || undefined,
  };
}

import { z } from 'zod';

const trimStr = z.string().trim();

const optionalCard = trimStr.max(24, 'شماره کارت حداکثر ۲۴ رقم').optional().or(z.literal(''));

const optionalSheba = trimStr.max(26, 'شماره شبا حداکثر ۲۶ کاراکتر').optional().or(z.literal(''));

export const ProfileUpdateSchema = z.object({
  email: z.string().trim().email('ایمیل معتبر وارد کنید'),
  mobile: trimStr.min(1, 'شماره موبایل الزامی است'),
  first_name: trimStr.min(1, 'نام الزامی است'),
  last_name: trimStr.min(1, 'نام خانوادگی الزامی است'),
  national_id: trimStr,
  father_name: trimStr,
  card_number: optionalCard,
  sheba_number: optionalSheba,
});

export type ProfileUpdateFormValues = z.infer<typeof ProfileUpdateSchema>;

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
export const AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const;

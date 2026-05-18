import { AVATAR_EXTENSIONS, AVATAR_MAX_BYTES } from '@/app/_types/profile.schema';

export function formatBytesFa(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}

/** اعتبارسنجی فایل آواتار — قابل استفاده در کلاینت و سرور */
export function validateAvatarFile(file: File): string | null {
  if (!file || file.size === 0) return 'فایلی انتخاب نشده است';

  if (file.size > AVATAR_MAX_BYTES) {
    return `حجم تصویر (${formatBytesFa(file.size)}) بیش از حد مجاز است. حداکثر ${formatBytesFa(AVATAR_MAX_BYTES)}`;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeOk =
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) ||
    AVATAR_EXTENSIONS.includes(ext as (typeof AVATAR_EXTENSIONS)[number]);

  if (!mimeOk) return 'فرمت مجاز: jpg، png، webp، gif';
  return null;
}

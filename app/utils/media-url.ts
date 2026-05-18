import { API_URL } from '@/configs/global';

/** تبدیل مسیر نسبی تصویر پروفایل به URL کامل */
export function resolveMediaUrl(path?: string | null): string | null {
  if (!path || path.trim() === '') return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = API_URL.replace(/\/api\/?$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

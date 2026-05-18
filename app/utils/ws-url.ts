import { API_URL } from '@/configs/global';

/** آدرس پایه WebSocket (بدون مسیر /api). */
export function getWebSocketBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || API_URL || 'http://localhost:8000').trim();
  const withoutApi = raw.replace(/\/api\/?$/i, '').replace(/\/$/, '');
  if (withoutApi.startsWith('https://')) {
    return withoutApi.replace(/^https:\/\//i, 'wss://');
  }
  if (withoutApi.startsWith('http://')) {
    return withoutApi.replace(/^http:\/\//i, 'ws://');
  }
  return `ws://${withoutApi}`;
}

export function buildUserWebSocketUrl(userId: number | string): string {
  return `${getWebSocketBaseUrl()}/ws/${userId}`;
}

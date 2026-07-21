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

/**
 * اتصال WS بدون توکن در query — احراز هویت با کوکی httpOnly `erp-access-token`
 * (مرورگر روی همان دامنه، کوکی را در handshake می‌فرستد).
 */
export function buildAuthenticatedWebSocketUrl(): string {
  return `${getWebSocketBaseUrl()}/ws`;
}

/** مسیر legacy بر اساس userId — همچنان بدون token در URL */
export function buildUserWebSocketUrl(userId: number | string): string {
  return `${getWebSocketBaseUrl()}/ws/${userId}`;
}

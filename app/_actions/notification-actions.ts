'use server';

import { readDataWithAuth, updateDataWithAuth } from '@/app/core/http-service/http-service';
import { NotificationCenterListResponse } from '@/app/_types/notification-center.types';
import { normalizeNotificationItem } from '@/app/utils/normalize-notification';

export async function getNotificationFeedAction(limit = 8) {
  try {
    const data = await readDataWithAuth<{
      inbox?: unknown[];
      notifications?: unknown[];
      inboxUnread?: number;
      notificationUnread?: number;
    }>(`/notification-center/feed?limit=${limit}`);
    const inboxRaw = Array.isArray(data.inbox) ? data.inbox : [];
    const notifRaw = Array.isArray(data.notifications) ? data.notifications : [];
    return {
      success: true as const,
      inbox: inboxRaw,
      notifications: notifRaw.map((item) =>
        normalizeNotificationItem(item as Record<string, unknown>),
      ),
      inboxUnread: Number(data.inboxUnread ?? 0),
      notificationUnread: Number(data.notificationUnread ?? 0),
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return {
      success: false as const,
      error: error?.message || 'خطا در دریافت اعلان‌ها',
    };
  }
}

export async function getNotificationsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  unreadOnly?: boolean;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.search) query.set('search', params.search);
  if (params?.unreadOnly) query.set('unreadOnly', 'true');

  const url = `/notifications?${query.toString()}`;
  try {
    const data = await readDataWithAuth<NotificationCenterListResponse>(url);
    const rawItems = Array.isArray(data.items) ? data.items : [];
    const enriched: NotificationCenterListResponse = {
      ...data,
      items: rawItems
        .map((item) => {
          try {
            return normalizeNotificationItem(item as unknown as Record<string, unknown>);
          } catch {
            return null;
          }
        })
        .filter((item): item is NotificationCenterListResponse['items'][0] => item != null),
    };
    return { success: true, data: enriched };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { success: false, error: error?.message || 'خطا در دریافت اعلان‌ها' };
  }
}

export async function getNotificationUnreadCountAction() {
  try {
    const data = await readDataWithAuth<{ count: number }>('/notifications/unread-count');
    return { success: true as const, count: data.count ?? 0 };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { success: false as const, error: error?.message || 'خطا در شمارش اعلان‌ها', count: 0 };
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    const data = await updateDataWithAuth<{ is_read: true }, { success: boolean }>(`/notifications/${id}`, { is_read: true });
    return { success: true, data };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { success: false, error: error?.message || 'خطا در تغییر وضعیت اعلان' };
  }
}


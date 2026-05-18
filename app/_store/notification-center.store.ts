import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getInboxAction, getInboxUnreadCountAction } from '@/app/_actions/inbox-actions';
import { getNotificationsAction, getNotificationUnreadCountAction } from '@/app/_actions/notification-actions';
import type { NotificationCenterItem } from '@/app/_types/notification-center.types';
import {
  inboxItemToNotificationCenterItem,
  mergeNotificationFeedItems,
} from '@/app/utils/inbox-to-notification-item';

type State = {
  items: NotificationCenterItem[];
  /** اعلان‌های خوانده‌نشده (کل، نه فقط صفحهٔ جاری) */
  notificationUnread: number;
  /** کارهای جدید/خوانده‌نشده در inbox */
  inboxUnread: number;
  loading: boolean;
  error: string | null;
  loadedAt?: number;
  fetchLatest: (limit?: number) => Promise<void>;
  refreshBadgeCounts: () => Promise<void>;
  setReadLocal: (id: string) => void;
};

export const useNotificationCenterStore = create<State>()(
  devtools((set, get) => ({
    items: [],
    notificationUnread: 0,
    inboxUnread: 0,
    loading: false,
    error: null,
    loadedAt: undefined,

    refreshBadgeCounts: async () => {
      const [notifRes, inboxRes] = await Promise.all([
        getNotificationUnreadCountAction(),
        getInboxUnreadCountAction(),
      ]);
      set({
        notificationUnread: notifRes.success ? notifRes.count : get().notificationUnread,
        inboxUnread: inboxRes.success ? inboxRes.count : get().inboxUnread,
      });
    },

    fetchLatest: async (limit = 6) => {
      set({ loading: true, error: null });
      try {
        const [notifRes, inboxRes, notifCountRes, inboxCountRes] = await Promise.all([
          getNotificationsAction({ page: 1, pageSize: limit }),
          getInboxAction({ page: 1, pageSize: limit, sortBy: 'created_at', sortOrder: 'desc' }),
          getNotificationUnreadCountAction(),
          getInboxUnreadCountAction(),
        ]);

        const notificationItems =
          notifRes.success && notifRes.data ? notifRes.data.items ?? [] : [];
        const inboxItems =
          inboxRes.success && inboxRes.data
            ? (inboxRes.data.items ?? []).map(inboxItemToNotificationCenterItem)
            : [];

        const merged = mergeNotificationFeedItems(inboxItems, notificationItems, limit);

        const errors: string[] = [];
        if (!notifRes.success && notifRes.error) errors.push(notifRes.error);
        if (!inboxRes.success && inboxRes.error) errors.push(inboxRes.error);

        set({
          items: merged,
          notificationUnread: notifCountRes.success ? notifCountRes.count : 0,
          inboxUnread: inboxCountRes.success ? inboxCountRes.count : 0,
          loadedAt: Date.now(),
          error: errors.length && merged.length === 0 ? errors.join(' — ') : null,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'خطا در بارگذاری اعلان‌ها';
        set({ error: message });
      } finally {
        set({ loading: false });
      }
    },

    setReadLocal: (id) => {
      set((state) => {
        const target = state.items.find((i) => i.id === id);
        const wasUnread = target && !target.is_read;
        const isInbox = id.startsWith('inbox-');
        const next = state.items.map((i) => (i.id === id ? { ...i, is_read: true } : i));
        return {
          items: next,
          inboxUnread:
            wasUnread && isInbox ? Math.max(0, state.inboxUnread - 1) : state.inboxUnread,
          notificationUnread:
            wasUnread && !isInbox
              ? Math.max(0, state.notificationUnread - 1)
              : state.notificationUnread,
        };
      });
    },
  })),
);

/** تعداد نمایشی روی آیکون زنگ — کارتابل + اعلان */
export function selectHeaderBadgeCount(state: State): number {
  return state.inboxUnread + state.notificationUnread;
}

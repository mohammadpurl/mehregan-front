import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  getBellUnreadCountAction,
  getNotificationFeedAction,
} from '@/app/_actions/notification-actions';
import type { NotificationCenterItem } from '@/app/_types/notification-center.types';
import type { InboxItem } from '@/app/_types/inbox.types';
import {
  inboxItemToNotificationCenterItem,
  mergeNotificationFeedItems,
} from '@/app/utils/inbox-to-notification-item';

const FEED_CACHE_MS = 25_000;

type State = {
  items: NotificationCenterItem[];
  notificationUnread: number;
  inboxUnread: number;
  /** شمارش badge بدون دوبل‌شماری inbox+notification یکسان */
  totalUnread: number;
  loading: boolean;
  error: string | null;
  loadedAt?: number;
  fetchLatest: (limit?: number, force?: boolean) => Promise<void>;
  refreshBadgeCounts: () => Promise<void>;
  setReadLocal: (id: string) => void;
};

export const useNotificationCenterStore = create<State>()(
  devtools((set, get) => ({
    items: [],
    notificationUnread: 0,
    inboxUnread: 0,
    totalUnread: 0,
    loading: false,
    error: null,
    loadedAt: undefined,

    refreshBadgeCounts: async () => {
      try {
        const res = await getBellUnreadCountAction();
        if (res.success) {
          set({ totalUnread: res.count });
        }
      } catch {
        // نادیده بگیر — مثلاً هنگام ناوبری به /login یا قطع سشن
      }
    },

    fetchLatest: async (limit = 6, force = false) => {
      const state = get();
      if (
        !force &&
        state.loadedAt &&
        Date.now() - state.loadedAt < FEED_CACHE_MS &&
        state.items.length > 0
      ) {
        return;
      }

      set({ loading: true, error: null });
      try {
        const feedRes = await getNotificationFeedAction(limit);
        if (!feedRes.success) {
          set({ error: feedRes.error || 'خطا در بارگذاری اعلان‌ها' });
          return;
        }

        const inboxItems = (feedRes.inbox ?? []).map((row) =>
          inboxItemToNotificationCenterItem(row as InboxItem),
        );
        const notificationItems = feedRes.notifications ?? [];
        const merged = mergeNotificationFeedItems(inboxItems, notificationItems, limit);

        set({
          items: merged,
          notificationUnread: feedRes.notificationUnread,
          inboxUnread: feedRes.inboxUnread,
          totalUnread: feedRes.totalUnread,
          loadedAt: Date.now(),
          error: null,
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
        const next = state.items.map((i) => {
          if (i.id === id) return { ...i, is_read: true };
          // آیتم‌های merge شده‌ی همان workflow را هم محلی بخوان
          if (
            target &&
            target.entity === 'workflow' &&
            target.entity_id != null &&
            i.entity === 'workflow' &&
            i.entity_id === target.entity_id
          ) {
            return { ...i, is_read: true };
          }
          return i;
        });
        return {
          items: next,
          totalUnread: wasUnread ? Math.max(0, state.totalUnread - 1) : state.totalUnread,
          inboxUnread: state.inboxUnread,
          notificationUnread: state.notificationUnread,
        };
      });
    },
  })),
);

export function selectHeaderBadgeCount(state: State): number {
  return state.totalUnread;
}

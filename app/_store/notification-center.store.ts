import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getInboxUnreadCountAction } from '@/app/_actions/inbox-actions';
import {
  getNotificationFeedAction,
  getNotificationUnreadCountAction,
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
          loadedAt: Date.now(),
          error: merged.length === 0 ? null : null,
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

export function selectHeaderBadgeCount(state: State): number {
  return state.inboxUnread + state.notificationUnread;
}

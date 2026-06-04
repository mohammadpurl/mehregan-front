
'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNavigationAccount } from '../TopNavigationAccout';
import MobileSidebarToggle from '../MobileSidebarToggle';
import { markInboxReadAction } from '@/app/_actions/inbox-actions';
import { markNotificationReadAction } from '@/app/_actions/notification-actions';
import { inboxIdFromFeedItemId } from '@/app/utils/inbox-to-notification-item';
import {
  selectHeaderBadgeCount,
  useNotificationCenterStore,
} from '@/app/_store/notification-center.store';
import { formatJalaliDate } from '@/app/utils/jalali-date';

const Header = () => {
  return (
    <div className="flex shrink-0 flex-col">
      <header className="z-30 flex min-h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-3 py-2 backdrop-blur-md pt-[max(0.5rem,env(safe-area-inset-top,0px))] sm:min-h-16 sm:px-4 md:px-6 md:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <MobileSidebarToggle />
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-4 md:gap-6">
          <TopNavigationAccount />
          <NotificationBell />
        </div>
      </header>
    </div>
  );
};

function formatRelativeDate(input: string): string {
  const created = new Date(input).getTime();
  if (!Number.isFinite(created)) return '';
  const diffMs = Date.now() - created;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'همین حالا';
  if (diffMin < 60) return `${diffMin} دقیقه پیش`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ساعت پیش`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} روز پیش`;
  return formatJalaliDate(input);
}

function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = useNotificationCenterStore((s) => s.items);
  const badgeCount = useNotificationCenterStore(selectHeaderBadgeCount);
  const notificationUnread = useNotificationCenterStore((s) => s.notificationUnread);
  const inboxUnread = useNotificationCenterStore((s) => s.inboxUnread);
  const loading = useNotificationCenterStore((s) => s.loading);
  const feedError = useNotificationCenterStore((s) => s.error);
  const fetchLatest = useNotificationCenterStore((s) => s.fetchLatest);
  const setReadLocal = useNotificationCenterStore((s) => s.setReadLocal);

  const refreshBadgeCounts = useNotificationCenterStore((s) => s.refreshBadgeCounts);

  useEffect(() => {
    void refreshBadgeCounts();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshBadgeCounts();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [refreshBadgeCounts]);

  const handleBellToggle = () => {
    if (!open) {
      void fetchLatest(8, true);
    }
    setOpen((wasOpen) => !wasOpen);
  };

  const handleItemClick = async (id: string, href?: string | null) => {
    setReadLocal(id);
    const inboxId = inboxIdFromFeedItemId(id);
    if (inboxId != null) {
      void markInboxReadAction(inboxId);
    } else {
      void markNotificationReadAction(id);
    }
    setOpen(false);
    if (href) {
      router.push(href);
      return;
    }
    router.push(inboxUnread > 0 ? '/dashboard/workflow/inbox' : '/dashboard/notifications');
  };

  const emptyMessage =
    feedError ??
    (inboxUnread > 0
      ? 'کارهای کارتابل از اینجا بارگذاری نشد — از منوی «کارهای من» استفاده کنید.'
      : 'اعلانی وجود ندارد');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleBellToggle}
        className="relative flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 touch-manipulation hover:bg-muted active:bg-muted/80"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={badgeCount > 0 ? `${badgeCount} اعلان و کار جدید` : 'اعلان‌ها'}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {badgeCount > 0 && (
          <span
            className="absolute -top-0.5 start-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-card"
            aria-hidden
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-12 z-50 w-[min(100vw-1.5rem,20rem)] max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-card shadow-2xl animate-slide-in overflow-hidden sm:w-80">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">اعلان‌ها و کارتابل</h3>
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                {badgeCount > 0 ? `${badgeCount} جدید` : 'بدون مورد جدید'}
                {inboxUnread > 0 && notificationUnread > 0
                  ? ` (${inboxUnread} کارتابل، ${notificationUnread} اعلان)`
                  : inboxUnread > 0
                    ? ` (${inboxUnread} کارتابل)`
                    : notificationUnread > 0
                      ? ` (${notificationUnread} اعلان)`
                      : ''}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">در حال بارگذاری...</div>
              ) : items.length < 1 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">{emptyMessage}</div>
              ) : (
                items.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => void handleItemClick(n.id, n.href)}
                    className={`w-full text-right px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                      !n.is_read ? 'bg-accent/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && <div className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{n.title || n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{formatRelativeDate(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="flex flex-col gap-2 p-3 text-center">
              <Link
                href="/dashboard/workflow/inbox"
                className="text-sm text-accent hover:underline"
                onClick={() => setOpen(false)}
              >
                کارهای من (کارتابل)
              </Link>
              <Link
                href="/dashboard/notifications"
                className="text-sm text-muted-foreground hover:underline"
                onClick={() => setOpen(false)}
              >
                همه اعلان‌ها
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Header;

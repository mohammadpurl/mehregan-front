'use client';

import { type FC } from 'react';

import { useNotificationStore } from '@/app/_store/notification.store';
import { NotificationToast } from './notification-toast';

export const Notifications: FC = () => {
  const notifications = useNotificationStore((state) => state.notifications);

  if (notifications.length < 1) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex justify-center p-3 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:justify-end sm:p-0"
      aria-live="polite"
      aria-relevant="additions text"
    >
      <div
        className="pointer-events-auto flex max-h-[min(46dvh,22rem)] w-full max-w-md flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-lg px-0.5 sm:max-h-[min(64dvh,30rem)] sm:max-w-sm"
        style={{
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        {notifications.map((p) => (
          <NotificationToast key={p.id} notification={p} />
        ))}
      </div>
    </div>
  );
};

'use client';

import { useEffect, useState } from 'react';
import { getProfileAction } from '@/app/_actions/profile-actions';
import { useNotificationWebSocket } from '@/app/hooks/use-notification-websocket';

/** اتصال WebSocket اعلان‌ها برای کاربر جاری (فقط در داشبورد). */
export function NotificationRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await getProfileAction();
      if (!active) return;
      if (res.success && res.data?.id) {
        const id = Number(res.data.id);
        setUserId(Number.isFinite(id) && id > 0 ? id : null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useNotificationWebSocket(userId);

  return <>{children}</>;
}

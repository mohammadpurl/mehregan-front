'use client';

import type { ReactNode } from 'react';
import { ConfirmDeleteProvider } from '@/app/components/confirm-delete-provider';
import { NotificationRealtimeProvider } from '@/app/components/notification/notification-realtime-provider';

export function DashboardClientShell({ children }: { children: ReactNode }) {
  return (
    <NotificationRealtimeProvider>
      <ConfirmDeleteProvider>{children}</ConfirmDeleteProvider>
    </NotificationRealtimeProvider>
  );
}

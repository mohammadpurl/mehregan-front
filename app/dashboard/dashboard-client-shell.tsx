'use client';

import type { ReactNode } from 'react';
import { ConfirmDeleteProvider } from '@/app/components/confirm-delete-provider';
import { NotificationRealtimeProvider } from '@/app/components/notification/notification-realtime-provider';
import { QueryProvider } from '@/app/providers/query-provider';

export function DashboardClientShell({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <NotificationRealtimeProvider>
        <ConfirmDeleteProvider>{children}</ConfirmDeleteProvider>
      </NotificationRealtimeProvider>
    </QueryProvider>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { buildUserWebSocketUrl } from '@/app/utils/ws-url';
import { useNotificationCenterStore } from '@/app/_store/notification-center.store';
import { useNotificationStore } from '@/app/_store/notification.store';

type WorkflowWsPayload = {
  type?: string;
  title?: string;
  message?: string;
  instance_id?: number;
  instanceId?: number;
};

const RECONNECT_MS = 5000;

export function useNotificationWebSocket(userId: number | null | undefined) {
  const fetchLatest = useNotificationCenterStore((s) => s.fetchLatest);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId || userId < 1) return;

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const url = buildUserWebSocketUrl(userId);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        void fetchLatest(6);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as WorkflowWsPayload;
          if (data.type === 'workflow.next_step' || data.type === 'workflow') {
            void fetchLatest(6);
            const title = data.title || 'کار جدید در کارتابل';
            const body = data.message || 'یک درخواست منتظر بررسی شماست.';
            useNotificationStore.getState().showNotification({
              type: 'info',
              message: `${title}\n${body}`,
            });
          } else if (data.type === 'workflow.rejected') {
            void fetchLatest(6);
            useNotificationStore.getState().showNotification({
              type: 'error',
              message: `${data.title || 'درخواست رد شد'}\n${data.message || 'درخواست شما توسط تأییدکننده رد شد.'}`,
            });
          } else if (data.type === 'sla.escalated') {
            void fetchLatest(6);
            useNotificationStore.getState().showNotification({
              type: 'warning',
              message: `${data.title || 'تأخیر SLA'}\n${data.message || 'اقدام فوری لازم است.'}`,
            });
          }
        } catch {
          void fetchLatest(6);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!cancelled) {
          reconnectTimer.current = setTimeout(connect, RECONNECT_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [userId, fetchLatest]);
}

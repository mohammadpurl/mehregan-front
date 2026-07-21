'use client';

import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/app/_store/auth-store';
import { buildAuthenticatedWebSocketUrl } from '@/app/utils/ws-url';
import { useNotificationCenterStore } from '@/app/_store/notification-center.store';
import { useNotificationStore } from '@/app/_store/notification.store';

type WorkflowWsPayload = {
  type?: string;
  title?: string;
  message?: string;
  instance_id?: number;
  instanceId?: number;
  requestTitle?: string;
  request_title?: string;
  meta?: { requestTitle?: string; request_title?: string };
};

const RECONNECT_MS = 5000;

export function useNotificationWebSocket(userId: number | null | undefined) {
  const status = useSessionStore((s) => s.status);
  const refreshBadgeCounts = useNotificationCenterStore((s) => s.refreshBadgeCounts);
  const fetchLatest = useNotificationCenterStore((s) => s.fetchLatest);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId || userId < 1) return;
    if (status !== 'authenticated') return;

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      // کوکی httpOnly توسط مرورگر در handshake ارسال می‌شود (بدون token در URL)
      const ws = new WebSocket(buildAuthenticatedWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        void refreshBadgeCounts();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as WorkflowWsPayload;
          const resolveTitle = (fallback: string) =>
            data.title?.trim() ||
            data.requestTitle?.trim() ||
            data.request_title?.trim() ||
            data.meta?.requestTitle?.trim() ||
            data.meta?.request_title?.trim() ||
            fallback;

          if (data.type === 'workflow.next_step' || data.type === 'workflow') {
            void refreshBadgeCounts();
            void fetchLatest(6, true);
            const title = resolveTitle('کار جدید در کارتابل');
            const body = data.message || 'یک درخواست منتظر بررسی شماست.';
            useNotificationStore.getState().showNotification({
              type: 'info',
              message: `${title}\n${body}`,
            });
          } else if (
            data.type === 'workflow.rejected' ||
            data.type === 'workflow.step_approved' ||
            data.type === 'workflow.approved'
          ) {
            void refreshBadgeCounts();
            void fetchLatest(6, true);
            const isReject = data.type === 'workflow.rejected';
            useNotificationStore.getState().showNotification({
              type: isReject ? 'error' : 'success',
              message: `${resolveTitle(isReject ? 'درخواست رد شد' : 'تأیید مرحله')}\n${
                data.message ||
                (isReject
                  ? 'درخواست شما توسط تأییدکننده رد شد.'
                  : 'یک مرحله از درخواست شما تأیید شد.')
              }`,
            });
          } else if (data.type === 'sla.escalated') {
            void refreshBadgeCounts();
            void fetchLatest(6, true);
            useNotificationStore.getState().showNotification({
              type: 'warning',
              message: `${resolveTitle('تأخیر SLA')}\n${data.message || 'اقدام فوری لازم است.'}`,
            });
          }
        } catch {
          void refreshBadgeCounts();
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
  }, [userId, status, fetchLatest, refreshBadgeCounts]);
}

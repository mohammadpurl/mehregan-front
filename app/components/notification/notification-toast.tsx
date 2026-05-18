'use client';

import { useNotificationStore } from '@/app/_store/notification.store';
import type { NotificationType } from '@/types/notification.interface';
import { type FC, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  Info,
  MessageSquare,
  X,
} from 'lucide-react';
import type { NotificationToastProps } from './notification.types';
import { cn } from '@/lib/utils';

const TYPE_TITLE: Record<NotificationType, string> = {
  error: 'خطا در اجرای عملیات',
  success: 'عملیات با موفقیت انجام شد',
  warning: 'توجه',
  info: 'اعلان',
};

/** درخشش رنگی از لبهٔ راست (مثل نمونه) — موفق سبز، خطا قرمز، … */
const EDGE_GLOW: Record<NotificationType, string> = {
  error: 'from-destructive/0 via-destructive/25 to-transparent',
  success: 'from-success/0 via-success/25 to-transparent',
  warning: 'from-amber-500/0 via-amber-500/22 to-transparent',
  info: 'from-sky-500/0 via-sky-500/22 to-transparent',
};

const ICON_WRAP: Record<NotificationType, string> = {
  error: 'bg-destructive/20 text-destructive ring-destructive/35',
  success: 'bg-success/20 text-success ring-success/40',
  warning: 'bg-amber-500/20 text-amber-800 ring-amber-500/35 dark:text-amber-200',
  info: 'bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300',
};

function toNotificationText(message: unknown): string {
  if (message == null) return '';
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) {
    return message.map((m) => toNotificationText(m)).filter(Boolean).join('\n');
  }
  if (typeof message === 'object') {
    const o = message as { message?: unknown; msg?: unknown; detail?: unknown };
    if (o.message != null) return toNotificationText(o.message);
    if (o.msg != null) return toNotificationText(o.msg);
    if (o.detail != null) return toNotificationText(o.detail);
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
  return String(message);
}

function parseToastContent(message: unknown): { title: string; description: string } {
  const t = toNotificationText(message).trim();
  const nl = t.indexOf('\n');
  if (nl !== -1) {
    return {
      title: t.slice(0, nl).trim(),
      description: t.slice(nl + 1).trim(),
    };
  }
  const pipe = t.indexOf('|');
  if (pipe !== -1) {
    return {
      title: t.slice(0, pipe).trim(),
      description: t.slice(pipe + 1).trim(),
    };
  }
  return { title: '', description: t };
}

function TypeIcon({ type }: { type: NotificationType }) {
  const cls = 'h-4 w-4 shrink-0';
  switch (type) {
    case 'success':
      return <Check className={cls} strokeWidth={2.25} aria-hidden />;
    case 'error':
      return <MessageSquare className={cls} strokeWidth={2.25} aria-hidden />;
    case 'warning':
      return <AlertTriangle className={cls} strokeWidth={2.25} aria-hidden />;
    default:
      return <Info className={cls} strokeWidth={2.25} aria-hidden />;
  }
}

export const NotificationToast: FC<NotificationToastProps> = ({
  notification: { id, message, type, duration: durationProp = 5000 },
}) => {
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);
  const duration = Math.max(800, durationProp);

  useEffect(() => {
    const timer = setTimeout(() => dismissNotification(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, dismissNotification]);

  const { title: parsedTitle, description } = parseToastContent(message);
  const title = parsedTitle || TYPE_TITLE[type];
  const body = parsedTitle ? description : toNotificationText(message).trim();

  const liveRole = type === 'error' ? 'alert' : 'status';

  return (
    <div
      role={liveRole}
      aria-atomic="true"
      dir="rtl"
      className={cn(
        'show-notification relative isolate w-full min-w-0 max-w-sm overflow-hidden rounded-xl border border-border/50 shadow-lg',
        /* شیشه‌ای — نزدیک تم قبلی، خوانا روی navbar */
        'bg-card/80 backdrop-blur-xl supports-backdrop-filter:bg-card/65',
        'dark:border-zinc-600/50 dark:bg-zinc-950/75 dark:supports-backdrop-filter:bg-zinc-950/60',
        'ring-1 ring-inset ring-white/10 dark:ring-white/5',
      )}
    >
      {/* هالهٔ رنگی از راست */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-[min(45%,11rem)] bg-linear-to-l',
          EDGE_GLOW[type],
        )}
        aria-hidden
      />

      <div className="relative flex items-start gap-3 px-3 py-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 backdrop-blur-sm',
            ICON_WRAP[type],
          )}
          aria-hidden
        >
          <TypeIcon type={type} />
        </div>

        <div className="min-w-0 flex-1 text-right">
          <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground">{title}</h3>
          {body ? (
            <p className="mt-1 text-xs font-normal leading-relaxed text-muted-foreground">{body}</p>
          ) : null}
        </div>

        <button
          type="button"
          className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          onClick={() => dismissNotification(id)}
          aria-label="بستن اعلان"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

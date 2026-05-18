import type { ReactNode } from 'react';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import { useNotificationStore } from '@/app/_store/notification.store';
import type { NotificationType } from '@/types/notification.interface';

function pushNotification(type: NotificationType, message: string, duration?: number) {
  useNotificationStore.getState().showNotification({
    type,
    message,
    duration: duration ?? (type === 'error' ? 6000 : 5000),
  });
}

/** نوتیفیکیشن موفقیت پس از ذخیره/ثبت فرم */
export function notifyFormSuccess(message: string, duration?: number) {
  pushNotification('success', message, duration);
}

/** نوتیفیکیشن خطا پس از عملیات فرم */
export function notifyFormError(message: unknown, duration?: number) {
  pushNotification(
    'error',
    extractActionErrorMessage(message, 'عملیات ناموفق بود'),
    duration,
  );
}

/** نگاشت toast قدیمی به نوع اعلان سراسری */
export function resolveToastNotificationType(
  variant: string | null | undefined,
  title?: ReactNode,
  description?: ReactNode,
): NotificationType {
  if (variant === 'destructive') return 'error';
  const text = [title, description]
    .filter((p) => p != null && String(p).trim() !== '')
    .map(String)
    .join(' ');
  if (/خطا|ناموفق|failed|invalid/i.test(text)) return 'error';
  if (/موفق|ذخیره|انجام شد|با موفقیت|success/i.test(text)) return 'success';
  return 'info';
}

export function mirrorToastToFormNotification(props: {
  variant?: string | null;
  title?: ReactNode;
  description?: ReactNode;
}) {
  const message = [props.title, props.description]
    .filter((p) => p != null && String(p).trim() !== '')
    .map(String)
    .join(' — ')
    .trim();
  if (!message) return;
  const type = resolveToastNotificationType(props.variant, props.title, props.description);
  pushNotification(type, message);
}

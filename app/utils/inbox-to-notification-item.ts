import type { InboxItem } from '@/app/_types/inbox.types';
import type { NotificationCenterItem, NotificationEntity } from '@/app/_types/notification-center.types';

function inboxEntity(refType: string | undefined): NotificationEntity {
  const rt = String(refType ?? '').toLowerCase();
  if (rt === 'ad_hoc_task') return 'ad_hoc_task';
  if (rt === 'workflow') return 'workflow';
  return 'workflow';
}

/** کلید یکتا برای حذف تکراری inbox+notification یک رویداد */
export function notificationFeedDedupeKey(item: NotificationCenterItem): string {
  const id = item.entity_id != null ? String(item.entity_id) : '';
  const entity = String(item.entity ?? '').toLowerCase();
  const event = String(item.eventType ?? '').toLowerCase();

  if (entity === 'ad_hoc_task' && id) return `ad_hoc_task-${id}`;
  if (event.startsWith('ad_hoc_task') && id) return `ad_hoc_task-${id}`;
  if (entity === 'workflow' && id) return `workflow-${id}`;
  if (item.href?.includes('ad-hoc-tasks/') || item.href?.includes('adHocTaskId=')) {
    const m =
      item.href.match(/ad-hoc-tasks\/([^/?#]+)/) || item.href.match(/adHocTaskId=([^&]+)/);
    if (m?.[1]) return `ad_hoc_task-${decodeURIComponent(m[1])}`;
  }
  if (item.href?.includes('instanceId=')) {
    const m = item.href.match(/instanceId=([^&]+)/);
    if (m?.[1]) return `workflow-${decodeURIComponent(m[1])}`;
  }
  return item.href || item.id;
}

export function inboxItemToNotificationCenterItem(inbox: InboxItem): NotificationCenterItem {
  const isRead = Boolean(inbox.is_read ?? inbox.read ?? false);
  const extended = inbox as InboxItem & {
    request_created_at?: string;
    requestCreatedAt?: string;
    request_type_label?: string;
    requestTypeLabel?: string;
    requester_name?: string;
    requesterName?: string;
    business_ref_id?: number;
    businessRefId?: number;
  };
  const entity = inboxEntity(inbox.ref_type);
  const isAdHoc = entity === 'ad_hoc_task';
  return {
    id: `inbox-${inbox.id}`,
    title: inbox.title?.trim() || 'کار در کارتابل',
    message: inbox.message?.trim() || 'درخواستی منتظر بررسی و تأیید شماست.',
    level: 'info',
    eventType: isAdHoc ? 'ad_hoc_task.assigned' : 'workflow.next_step',
    entity,
    entity_id: inbox.ref_id,
    is_read: isRead,
    created_at: inbox.created_at ?? new Date().toISOString(),
    request_created_at:
      extended.request_created_at ?? extended.requestCreatedAt ?? null,
    request_type_label:
      extended.request_type_label ?? extended.requestTypeLabel ?? null,
    requester_name: extended.requester_name ?? extended.requesterName ?? null,
    business_ref_id: extended.business_ref_id ?? extended.businessRefId ?? null,
    href: isAdHoc
      ? `/dashboard/ad-hoc-tasks/${encodeURIComponent(String(inbox.ref_id))}`
      : `/dashboard/workflow/inbox?instanceId=${encodeURIComponent(String(inbox.ref_id))}`,
  };
}

export function mergeNotificationFeedItems(
  inboxItems: NotificationCenterItem[],
  notificationItems: NotificationCenterItem[],
  limit: number,
): NotificationCenterItem[] {
  const seen = new Set<string>();
  const merged: NotificationCenterItem[] = [];
  // کارتابل اول — بعد اعلان‌های تکراری همان ref حذف می‌شوند
  for (const item of [...inboxItems, ...notificationItems]) {
    const key = notificationFeedDedupeKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}

export function isInboxFeedItemId(id: string): boolean {
  return id.startsWith('inbox-');
}

export function inboxIdFromFeedItemId(id: string): number | null {
  if (!isInboxFeedItemId(id)) return null;
  const n = Number(id.slice('inbox-'.length));
  return Number.isFinite(n) && n > 0 ? n : null;
}

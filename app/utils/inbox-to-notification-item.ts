import type { InboxItem } from '@/app/_types/inbox.types';
import type { NotificationCenterItem } from '@/app/_types/notification-center.types';

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
  return {
    id: `inbox-${inbox.id}`,
    title: inbox.title?.trim() || 'کار در کارتابل',
    message: inbox.message?.trim() || 'درخواستی منتظر بررسی و تأیید شماست.',
    level: 'info',
    eventType: 'workflow.next_step',
    entity: 'workflow',
    entity_id: inbox.ref_id,
    is_read: isRead,
    created_at: inbox.created_at ?? new Date().toISOString(),
    request_created_at:
      extended.request_created_at ?? extended.requestCreatedAt ?? null,
    request_type_label:
      extended.request_type_label ?? extended.requestTypeLabel ?? null,
    requester_name: extended.requester_name ?? extended.requesterName ?? null,
    business_ref_id: extended.business_ref_id ?? extended.businessRefId ?? null,
    href:
      inbox.ref_type === 'ad_hoc_task'
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
  for (const item of [...inboxItems, ...notificationItems]) {
    const wfKey =
      item.entity === 'workflow' && item.entity_id != null
        ? `workflow-${item.entity_id}`
        : null;
    const key = wfKey ?? item.href ?? item.id;
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

import type { NotificationCenterItem } from '@/app/_types/notification-center.types';
import { buildNotificationHref } from '@/app/utils/notification-href';

type RawNotification = Record<string, unknown>;

function mapRefTypeToEntity(refType: unknown): NotificationCenterItem['entity'] {
  const rt = String(refType ?? '').toLowerCase();
  if (rt === 'workflow') return 'workflow';
  if (rt === 'payment_request' || rt === 'payment-request') return 'payment-request';
  if (rt === 'product_request' || rt === 'product-request') return 'product-request';
  return 'other';
}

export function normalizeNotificationItem(raw: RawNotification): NotificationCenterItem {
  const refType = raw.ref_type ?? raw.refType;
  const refId = raw.ref_id ?? raw.refId ?? raw.entity_id ?? raw.entityId;
  const entity = (raw.entity as NotificationCenterItem['entity']) ?? mapRefTypeToEntity(refType);

  const eventType = String(raw.type ?? raw.event_type ?? raw.eventType ?? '').trim() || null;
  let level = (raw.level as NotificationCenterItem['level']) ?? 'info';
  if (eventType === 'workflow.rejected') level = 'error';
  if (eventType === 'sla.escalated') level = 'warning';

  const requestCreatedAt = raw.request_created_at ?? raw.requestCreatedAt;
  const requestTypeLabel = raw.request_type_label ?? raw.requestTypeLabel;

  const item: NotificationCenterItem = {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    level,
    eventType,
    entity,
    entity_id: refId != null ? (refId as string | number) : null,
    is_read: Boolean(raw.is_read ?? raw.isRead ?? false),
    created_at: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    request_created_at:
      requestCreatedAt != null ? String(requestCreatedAt) : null,
    request_type_label:
      requestTypeLabel != null ? String(requestTypeLabel) : null,
    requester_name:
      raw.requester_name != null
        ? String(raw.requester_name)
        : raw.requesterName != null
          ? String(raw.requesterName)
          : null,
    business_ref_id: raw.business_ref_id ?? raw.businessRefId ?? null,
    href: typeof raw.href === 'string' ? raw.href : null,
  };

  return {
    ...item,
    href: buildNotificationHref(item),
  };
}

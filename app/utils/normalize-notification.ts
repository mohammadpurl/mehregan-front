import type { NotificationCenterItem } from '@/app/_types/notification-center.types';
import { buildNotificationHref } from '@/app/utils/notification-href';

type RawNotification = Record<string, unknown>;

function coerceRefId(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return null;
}

function mapRefTypeToEntity(refType: unknown): NotificationCenterItem['entity'] {
  const rt = String(refType ?? '').toLowerCase();
  if (rt === 'workflow') return 'workflow';
  if (rt === 'ad_hoc_task' || rt === 'ad-hoc-task') return 'ad_hoc_task';
  if (rt === 'payment_request' || rt === 'payment-request' || rt === 'payment_order') {
    return 'payment-request';
  }
  if (rt === 'product_request' || rt === 'product-request') return 'product-request';
  if (rt === 'petty_cash' || rt === 'petty-cash' || rt === 'petty_cash_settlement') {
    return 'petty_cash';
  }
  if (rt === 'mission_request' || rt === 'mission_report') return 'mission_request';
  if (rt === 'financial_document') return 'financial_document';
  if (rt === 'purchase_request' || rt === 'request' || rt === 'procurement_proforma') {
    return 'request';
  }
  return 'other';
}

export function normalizeNotificationItem(raw: RawNotification): NotificationCenterItem {
  const refType = raw.ref_type ?? raw.refType;
  const refId = raw.ref_id ?? raw.refId ?? raw.entity_id ?? raw.entityId;
  const entity = (raw.entity as NotificationCenterItem['entity']) ?? mapRefTypeToEntity(refType);

  const eventType = String(raw.type ?? raw.event_type ?? raw.eventType ?? '').trim() || null;
  let level = (raw.level as NotificationCenterItem['level']) ?? 'info';
  if (eventType === 'workflow.rejected') level = 'error';
  if (eventType === 'workflow.step_approved' || eventType === 'workflow.approved') {
    level = 'success';
  }
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
    business_ref_id: coerceRefId(raw.business_ref_id ?? raw.businessRefId),
    href: typeof raw.href === 'string' ? raw.href : null,
  };

  return {
    ...item,
    href: buildNotificationHref(item),
  };
}

import type { NotificationCenterItem } from '@/app/_types/notification-center.types';

function asStringId(input: string | number | null | undefined): string | null {
  if (input === undefined || input === null) return null;
  const s = String(input).trim();
  return s.length > 0 ? s : null;
}

export function buildNotificationHref(item: NotificationCenterItem): string | null {
  if (item.href && item.href.trim().length > 0) return item.href;

  const id = asStringId(item.entity_id);
  switch (item.entity) {
    case 'workflow':
      return id
        ? `/dashboard/workflow/inbox?instanceId=${encodeURIComponent(id)}`
        : '/dashboard/workflow/inbox';
    case 'product-request':
    case 'request':
    case 'procurement_proforma':
      return id
        ? `/dashboard/procurement/requests?requestId=${encodeURIComponent(id)}`
        : '/dashboard/procurement/requests';
    case 'item':
      return id ? `/dashboard/master/items?itemId=${encodeURIComponent(id)}` : '/dashboard/master/items';
    case 'warehouse':
      return id ? `/dashboard/master/warehouses?warehouseId=${encodeURIComponent(id)}` : '/dashboard/master/warehouses';
    case 'supplier':
      return id ? `/dashboard/master/suppliers?supplierId=${encodeURIComponent(id)}` : '/dashboard/master/suppliers';
    case 'payment-request':
      return id ? `/dashboard/payment-request?paymentId=${encodeURIComponent(id)}` : '/dashboard/payment-request';
    case 'petty-cash':
    case 'petty_cash':
    case 'petty_cash_settlement':
    case 'petty-cash-settlement':
      return id
        ? `/dashboard/petty-cash/settlement?pettyCashId=${encodeURIComponent(id)}`
        : '/dashboard/petty-cash/settlement';
    case 'financial_document':
    case 'financial-document':
      return id
        ? `/dashboard/financial-documents?financialDocumentId=${encodeURIComponent(id)}`
        : '/dashboard/financial-documents';
    case 'mission_request':
    case 'mission-request':
    case 'mission_report':
    case 'mission-report':
      return id
        ? `/dashboard/mission-requests?missionRequestId=${encodeURIComponent(id)}`
        : '/dashboard/mission-requests';
    case 'ad_hoc_task':
      return id
        ? `/dashboard/workflow/inbox?adHocTaskId=${encodeURIComponent(id)}`
        : '/dashboard/workflow/inbox';
    default:
      return '/dashboard/notifications';
  }
}


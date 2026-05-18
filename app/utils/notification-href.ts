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
      return id ? `/dashboard/product-request?requestId=${encodeURIComponent(id)}` : '/dashboard/product-request';
    case 'item':
      return id ? `/dashboard/master/items?itemId=${encodeURIComponent(id)}` : '/dashboard/master/items';
    case 'warehouse':
      return id ? `/dashboard/master/warehouses?warehouseId=${encodeURIComponent(id)}` : '/dashboard/master/warehouses';
    case 'supplier':
      return id ? `/dashboard/master/suppliers?supplierId=${encodeURIComponent(id)}` : '/dashboard/master/suppliers';
    case 'payment-request':
      return id ? `/dashboard/payment-request?paymentId=${encodeURIComponent(id)}` : '/dashboard/payment-request';
    default:
      return '/dashboard/notifications';
  }
}


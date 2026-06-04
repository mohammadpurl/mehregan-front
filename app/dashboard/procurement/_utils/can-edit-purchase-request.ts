import type { PurchaseRequest } from '@/app/_types/purchase-request.types';

/** تا قبل از تأیید اولیه — هم‌تراز با `ensure_editable` در بک‌اند */
const EDITABLE_STATUSES = new Set(['pending', 'draft']);

export function canEditPurchaseRequest(record: Pick<PurchaseRequest, 'status'>): boolean {
  return EDITABLE_STATUSES.has(String(record.status ?? '').toLowerCase());
}

import type { WorkflowInstanceRow } from '@/app/_types/workflow.types';
import type { RelatedRequestItem } from '@/app/_types/related-requests.types';

/** مسیر صفحه جزئیات هر نوع درخواست */
export function workflowRefDetailHref(
  refType: string,
  refId: number,
  workflowInstanceId?: number | null,
): string {
  const rt = refType;
  const id = refId;
  if (rt === 'payment_request' || rt === 'payment_order') {
    return `/dashboard/payment-request?paymentId=${id}`;
  }
  if (rt === 'petty_cash') return `/dashboard/petty-cash?pettyCashId=${id}`;
  if (rt === 'mission_request') return `/dashboard/mission-requests?missionRequestId=${id}`;
  if (rt === 'financial_document') return `/dashboard/financial-documents?financialDocumentId=${id}`;
  if (
    rt === 'request' ||
    rt === 'procurement' ||
    rt === 'product_request' ||
    rt === 'purchase_request' ||
    rt === 'procurement_proforma'
  ) {
    return `/dashboard/procurement/requests?requestId=${id}`;
  }
  if (rt === 'purchase_order') return `/dashboard/procurement/purchase-orders?orderId=${id}`;
  if (rt === 'goods_receipt') return `/dashboard/procurement/grn?grnId=${id}`;
  if (workflowInstanceId) return `/dashboard/workflow/instances/${workflowInstanceId}`;
  return `/dashboard/workflow/tracking?instanceId=${workflowInstanceId ?? ''}`;
}

export function workflowRowDetailHref(row: Pick<WorkflowInstanceRow, 'ref_type' | 'ref_id' | 'id'>): string {
  return workflowRefDetailHref(row.ref_type, row.ref_id, row.id);
}

export function relatedItemDetailHref(item: RelatedRequestItem): string {
  if (item.workflowInstanceId) {
    return `/dashboard/workflow/instances/${item.workflowInstanceId}`;
  }
  const linkType = item.linkRefType ?? item.refType;
  const linkId = item.linkRefId ?? item.refId;
  return workflowRefDetailHref(linkType, linkId, item.workflowInstanceId);
}

export function relatedItemTrackingHref(item: RelatedRequestItem): string {
  if (item.workflowInstanceId) {
    return `/dashboard/workflow/instances/${item.workflowInstanceId}`;
  }
  return workflowRefDetailHref(item.refType, item.refId);
}

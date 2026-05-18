'use server';

import { getPaymentRequestAction, getPaymentRequestByWorkflowInstanceAction } from '@/app/_actions/payment-request-actions';
import { getPettyCashByIdAction, getPettyCashByWorkflowInstanceAction } from '@/app/_actions/petty-cash-actions';
import { getWorkflowApprovalPlanAction } from '@/app/_actions/workflow-runtime-actions';
import { getProductRequestAction } from '@/app/_actions/product-request-actions';
import { getWarehouseAction } from '@/app/_actions/warehouse-actions';
import { getWorkflowAction } from '@/app/_actions/workflow-actions';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import {
  buildPaymentRequestResolved,
  buildPettyCashResolved,
  REF_LABELS,
  type ResolvedWorkflowForm,
} from '@/app/utils/resolve-workflow-form.utils';

export type { ResolvedWorkflowForm } from '@/app/utils/resolve-workflow-form.utils';

/** بارگذاری فرم کسب‌وکار بر اساس ref_type و ref_id نمونه workflow */
export async function resolveWorkflowFormAction(
  refType: WorkflowBusinessRefType,
  refId: number,
): Promise<{ success: boolean; data?: ResolvedWorkflowForm; error?: string }> {
  const id = String(refId);

  switch (refType) {
    case 'workflow_form': {
      const r = await getWorkflowAction(id);
      if (!r.success || !r.data) return { success: false, error: r.error };
      return {
        success: true,
        data: {
          refType,
          refId,
          label: REF_LABELS[refType],
          summary: {
            عنوان: r.data.title,
            نوع: r.data.type,
            وضعیت: r.data.status,
            درخواست‌کننده: r.data.requesterName ?? '—',
          },
          raw: r.data,
        },
      };
    }
    case 'payment_request': {
      const r = await getPaymentRequestAction(id);
      if (!r.success || !r.data) return { success: false, error: r.error };
      return {
        success: true,
        data: buildPaymentRequestResolved(refType, refId, r.data),
      };
    }
    case 'petty_cash': {
      const r = await getPettyCashByIdAction(id);
      if (!r.success || !r.data) return { success: false, error: r.error };
      return {
        success: true,
        data: buildPettyCashResolved(refType, refId, r.data),
      };
    }
    case 'warehouse_form': {
      const r = await getWarehouseAction(id);
      if (!r.success || !r.data) return { success: false, error: r.error };
      return {
        success: true,
        data: {
          refType,
          refId,
          label: REF_LABELS[refType],
          summary: {
            نوع: r.data.type,
            دریافت‌کننده: r.data.receiverName,
            وضعیت: r.data.status,
            تاریخ: r.data.date,
          },
          raw: r.data,
        },
      };
    }
    case 'request': {
      const r = await getProductRequestAction(id);
      if (!r.success || !r.data) return { success: false, error: r.error };
      return {
        success: true,
        data: {
          refType,
          refId,
          label: REF_LABELS[refType],
          summary: {
            نوع: r.data.productType,
            درخواست‌کننده: r.data.requesterName,
            وضعیت: r.data.status,
            دلیل: r.data.reason,
          },
          raw: r.data,
        },
      };
    }
    default:
      return { success: false, error: 'نوع فرم ناشناخته است' };
  }
}

/** بارگذاری جزئیات از شناسه نمونه workflow (کارتابل) */
export async function resolveWorkflowFormFromInstanceAction(
  workflowInstanceId: number,
): Promise<{ success: boolean; data?: ResolvedWorkflowForm; error?: string; approvalPlanStatus?: string }> {
  const [paymentResult, pettyCashResult] = await Promise.all([
    getPaymentRequestByWorkflowInstanceAction(workflowInstanceId),
    getPettyCashByWorkflowInstanceAction(workflowInstanceId),
  ]);

  if (pettyCashResult.success && pettyCashResult.data) {
    const pc = pettyCashResult.data;
    return {
      success: true,
      data: buildPettyCashResolved('petty_cash', Number(pc.id), pc),
    };
  }

  if (paymentResult.success && paymentResult.data) {
    const pr = paymentResult.data;
    return {
      success: true,
      data: buildPaymentRequestResolved('payment_request', Number(pr.id), pr),
    };
  }

  const planResult = await getWorkflowApprovalPlanAction(workflowInstanceId);
  if (planResult.success && planResult.data) {
    const plan = planResult.data;
    const refType = String(plan.refType).toLowerCase() as WorkflowBusinessRefType;
    const formResult = await resolveWorkflowFormAction(refType, plan.refId);
    return { ...formResult, approvalPlanStatus: plan.status };
  }

  const parts: string[] = [];
  if (pettyCashResult.error) parts.push(`تنخواه: ${pettyCashResult.error}`);
  if (paymentResult.error) parts.push(`درخواست مالی: ${paymentResult.error}`);
  if (planResult.error) parts.push(`مسیر تأیید: ${planResult.error}`);
  return {
    success: false,
    error: parts.join(' — ') || 'جزئیات این کار در دسترس نیست',
  };
}

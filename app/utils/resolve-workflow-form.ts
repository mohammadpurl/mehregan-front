'use server';

import { getPaymentRequestAction, getPaymentRequestByWorkflowInstanceAction } from '@/app/_actions/payment-request-actions';
import { getFinancialDocumentByWorkflowInstanceAction } from '@/app/_actions/financial-document-actions';
import { getPettyCashByIdAction, getPettyCashByWorkflowInstanceAction } from '@/app/_actions/petty-cash-actions';
import {
  getMissionRequestByIdAction,
  getMissionRequestByWorkflowInstanceAction,
} from '@/app/_actions/mission-request-actions';
import { getWorkflowApprovalPlanAction } from '@/app/_actions/workflow-runtime-actions';
import {
  getPurchaseRequestAction,
  getPurchaseRequestByWorkflowInstanceAction,
} from '@/app/_actions/purchase-request-actions';
import { getWarehouseAction } from '@/app/_actions/warehouse-actions';
import { getWorkflowAction } from '@/app/_actions/workflow-actions';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import {
  buildPaymentRequestResolved,
  buildPettyCashResolved,
  buildMissionRequestResolved,
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
            نوع: String(r.data.type ?? '—'),
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
    case 'petty_cash':
    case 'petty_cash_settlement': {
      const r = await getPettyCashByIdAction(id);
      if (!r.success || !r.data) return { success: false, error: r.error };
      return {
        success: true,
        data: buildPettyCashResolved(refType, refId, r.data),
      };
    }
    case 'mission_request':
    case 'mission_report': {
      const r = await getMissionRequestByIdAction(id);
      if (!r.success || !r.data) return { success: false, error: r.error };
      return {
        success: true,
        data: buildMissionRequestResolved(refType, refId, r.data),
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
    case 'request':
    case 'purchase_request':
    case 'procurement_proforma': {
      const r = await getPurchaseRequestAction(id);
      if (!r.success || !r.data) return { success: false, error: r.error };
      const lines = r.data.items.map((i) => `${i.itemName}×${i.quantity}`).join('، ');
      return {
        success: true,
        data: {
          refType,
          refId,
          label: REF_LABELS[refType],
          summary: {
            درخواست‌کننده: r.data.requesterName ?? '—',
            وضعیت: r.data.status,
            اقلام: lines || '—',
            توضیح: r.data.reason ?? '—',
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
  const planResult = await getWorkflowApprovalPlanAction(workflowInstanceId);
  if (!planResult.success || !planResult.data) {
    return {
      success: false,
      error: planResult.error || 'مسیر تأیید بارگذاری نشد',
    };
  }

  const plan = planResult.data;
  const refType = String(plan.refType).toLowerCase() as WorkflowBusinessRefType;

  if (refType === 'financial_document') {
    const fdResult = await getFinancialDocumentByWorkflowInstanceAction(workflowInstanceId);
    if (fdResult.success && fdResult.data) {
      const d = fdResult.data;
      return {
        success: true,
        data: {
          refType,
          refId: Number(d.id),
          label: REF_LABELS[refType],
          summary: {
            نوع: d.documentType === 'check' ? 'چک' : 'سایر',
            مبلغ: d.amount != null ? String(d.amount) : '—',
            'ثبت‌کننده': d.requesterName ?? '—',
            شرح: d.description ?? '—',
            وضعیت: d.status,
            ...(d.sepidarRegisteredAt
              ? { 'ثبت در سپیدار (کارشناس)': d.sepidarRegisteredAt }
              : {}),
            ...(d.sepidarConfirmedAt
              ? { 'تأیید ثبت سپیدار (سرپرست)': d.sepidarConfirmedAt }
              : {}),
          },
          raw: d,
        },
        approvalPlanStatus: plan.status,
      };
    }
    return {
      success: false,
      error: fdResult.error || 'سند مالی برای این نمونه workflow یافت نشد',
      approvalPlanStatus: plan.status,
    };
  }

  if (refType === 'petty_cash' || refType === 'petty_cash_settlement') {
    const pettyCashResult = await getPettyCashByWorkflowInstanceAction(workflowInstanceId);
    if (pettyCashResult.success && pettyCashResult.data) {
      return {
        success: true,
        data: buildPettyCashResolved(refType, Number(pettyCashResult.data.id), pettyCashResult.data),
        approvalPlanStatus: plan.status,
      };
    }
    return {
      success: false,
      error: pettyCashResult.error || 'تنخواه برای این نمونه workflow یافت نشد',
      approvalPlanStatus: plan.status,
    };
  }

  if (refType === 'mission_request' || refType === 'mission_report') {
    const missionResult = await getMissionRequestByWorkflowInstanceAction(workflowInstanceId);
    if (missionResult.success && missionResult.data) {
      return {
        success: true,
        data: buildMissionRequestResolved(
          refType,
          Number(missionResult.data.id),
          missionResult.data,
        ),
        approvalPlanStatus: plan.status,
      };
    }
    return {
      success: false,
      error: missionResult.error || 'درخواست ماموریت برای این نمونه workflow یافت نشد',
      approvalPlanStatus: plan.status,
    };
  }

  if (refType === 'payment_request' || refType === 'payment_order') {
    const paymentResult = await getPaymentRequestByWorkflowInstanceAction(workflowInstanceId);
    if (paymentResult.success && paymentResult.data) {
      return {
        success: true,
        data: buildPaymentRequestResolved(
          refType,
          Number(paymentResult.data.id),
          paymentResult.data,
        ),
        approvalPlanStatus: plan.status,
      };
    }
    return {
      success: false,
      error: paymentResult.error || 'درخواست مالی برای این نمونه workflow یافت نشد',
      approvalPlanStatus: plan.status,
    };
  }

  if (refType === 'request' || refType === 'purchase_request' || refType === 'procurement_proforma') {
    const purchaseResult = await getPurchaseRequestByWorkflowInstanceAction(workflowInstanceId);
    if (purchaseResult.success && purchaseResult.data) {
      const lines = purchaseResult.data.items
        .map((i) => `${i.itemName}×${i.quantity}`)
        .join('، ');
      return {
        success: true,
        data: {
          refType,
          refId: plan.refId,
          label: REF_LABELS[refType],
          summary: {
            درخواست‌کننده: purchaseResult.data.requesterName ?? '—',
            وضعیت: purchaseResult.data.status,
            اقلام: lines || '—',
            توضیح: purchaseResult.data.reason ?? '—',
          },
          raw: purchaseResult.data,
        },
        approvalPlanStatus: plan.status,
      };
    }
    return {
      success: false,
      error: purchaseResult.error || 'درخواست خرید برای این نمونه workflow یافت نشد',
      approvalPlanStatus: plan.status,
    };
  }

  const formResult = await resolveWorkflowFormAction(refType, plan.refId);
  return { ...formResult, approvalPlanStatus: plan.status };
}

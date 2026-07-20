'use client';

import Link from 'next/link';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { ColumnDef, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { Check, Eye, X } from 'lucide-react';
import { AdvancedModal } from '@/app/components/Modal';
import type { InboxItem } from '@/app/_types/inbox.types';
import { getInboxAction, markInboxDoneAction, markInboxReadAction } from '@/app/_actions/inbox-actions';
import {
  approveWorkflowAction,
  getWorkflowApprovalHistoryAction,
  rejectWorkflowAction,
  uploadWorkflowStepAttachmentAction,
} from '@/app/_actions/workflow-runtime-actions';
import { resolveWorkflowFormFromInstanceAction } from '@/app/utils/resolve-workflow-form';
import type { ResolvedWorkflowForm } from '@/app/utils/resolve-workflow-form.utils';
import type { WorkflowApprovalHistory } from '@/app/_types/workflow-approval-plan.types';
import { useFormAction } from '@/app/hooks/use-form-action';
import { useSessionStore } from '@/app/_store/auth-store';
import { useNotificationCenterStore } from '@/app/_store/notification-center.store';
import type { PaymentRequestResponse } from '@/app/dashboard/payment-request/_types/payment-request.types';
import { PaymentRequestType } from '@/app/dashboard/payment-request/_types/payment-request.types';
import {
  isAdvanceTermsUnset,
  isLoanTermsUnset,
  isPaymentRequestPayerUnset,
} from '@/app/dashboard/payment-request/_utils/payment-request-mapper';
import { REQUESTER_DESTINATION_ACCOUNT_TITLE } from '@/app/dashboard/payment-request/_utils/payment-request-display.utils';
import {
  isFinanceRole,
  isFinanceWorkflowStepRole,
} from '@/app/dashboard/payment-request/_utils/payment-request-roles';
import { getNumericUserIdFromClientSession } from '@/app/dashboard/payment-request/_utils/payment-request-session';
import {
  WorkflowPaymentRequestReview,
  type WorkflowPaymentRequestReviewHandle,
} from './_components/workflow-payment-request-review';
import {
  WorkflowPettyCashReview,
  type WorkflowPettyCashReviewHandle,
} from './_components/workflow-petty-cash-review';
import {
  WorkflowFinancialDocumentReview,
  type WorkflowFinancialDocumentReviewHandle,
} from './_components/workflow-financial-document-review';
import type { FinancialDocumentResponse } from '@/app/dashboard/financial-documents/_types/financial-document.types';
import { WorkflowPurchaseRequestReview } from './_components/workflow-purchase-request-review';
import {
  WorkflowPurchaseFillStock,
  type WorkflowPurchaseFillStockHandle,
} from './_components/workflow-purchase-fill-stock';
import {
  WorkflowPurchaseUploadProforma,
  type WorkflowPurchaseUploadProformaHandle,
} from './_components/workflow-purchase-upload-proforma';
import {
  WorkflowPurchaseUploadInvoice,
  type WorkflowPurchaseUploadInvoiceHandle,
} from './_components/workflow-purchase-upload-invoice';
import {
  updatePurchaseStockLevelsAction,
  uploadPurchaseBolAction,
  uploadPurchasePaymentSlipAction,
} from '@/app/_actions/purchase-request-actions';
import { getWorkflowInstanceStatusLabel } from '@/app/constants/workflow-instance-status-labels';
import type { PurchaseRequest } from '@/app/_types/purchase-request.types';
import type { PettyCashResponse } from '@/app/dashboard/petty-cash/_types/petty-cash.types';
import type { MissionRequestResponse } from '@/app/dashboard/mission-requests/_types/mission-request.types';
import { MissionRequestDetailPanel } from '@/app/dashboard/mission-requests/_components/mission-request-detail-panel';
import { WorkflowInboxReviewPanel } from './_components/workflow-inbox-review-panel';
import { RelatedRequestsPanel } from '@/app/dashboard/workflow/_components/related-requests-panel';
import { WorkflowRejectModal } from './_components/workflow-inbox-decision';
import { getWorkflowStepActionGuide } from './_utils/workflow-step-action-guide';
import {
  createEmptyCheckPlanRows,
  type ProformaCheckPlanRow,
} from './_components/workflow-proforma-check-plan';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import type { WorkflowSummaryField } from './_components/workflow-inbox-summary-header';

function workflowStatusTone(
  status?: string,
): 'pending' | 'approved' | 'rejected' | 'neutral' {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved') return 'approved';
  if (s === 'rejected' || s === 'returned') return 'rejected';
  if (s === 'pending' || s === 'in_progress' || s === 'active') return 'pending';
  return 'neutral';
}

function inboxRefTypeLabel(refType: string | undefined): string {
  if (refType === 'ad_hoc_task') return 'کار پیش‌بینی‌نشده';
  if (refType === 'workflow') return 'گردش تأیید';
  if (refType === 'petty_cash') return 'تنخواه';
  if (refType === 'petty_cash_settlement') return 'تأیید خرج تنخواه';
  if (refType === 'payment_request') return 'درخواست پرداخت';
  if (refType === 'payment_order') return 'دستور پرداخت';
  if (refType === 'financial_document') return 'سند مالی';
  if (refType === 'mission_request') return 'درخواست ماموریت';
  if (refType === 'mission_report') return 'تأیید گزارش ماموریت';
  if (refType === 'purchase_request' || refType === 'request') return 'درخواست خرید';
  if (refType === 'procurement_proforma') return 'تأیید پیش‌فاکتور';
  return refType ?? '—';
}

export default function WorkflowInboxPage() {
  const { toast } = useToast();
  const { runAction } = useFormAction();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSessionStore((s) => s.session);
  const refreshBadgeCounts = useNotificationCenterStore((s) => s.refreshBadgeCounts);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [actionPending, setActionPending] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [sepidarConfirmed, setSepidarConfirmed] = useState(false);
  const [markRegistered, setMarkRegistered] = useState(false);
  const [paymentLocation, setPaymentLocation] = useState('');
  const [payerCompanyAccountId, setPayerCompanyAccountId] = useState(0);
  const [checkPlanRows, setCheckPlanRows] = useState<ProformaCheckPlanRow[]>(() =>
    createEmptyCheckPlanRows(1),
  );
  const [warehouseId, setWarehouseId] = useState('');
  const [stepAttachmentFiles, setStepAttachmentFiles] = useState<File[]>([]);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInbox, setSelectedInbox] = useState<InboxItem | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<WorkflowApprovalHistory | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [resolvedForm, setResolvedForm] = useState<ResolvedWorkflowForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const paymentReviewRef = useRef<WorkflowPaymentRequestReviewHandle>(null);
  const pettyCashReviewRef = useRef<WorkflowPettyCashReviewHandle>(null);
  const financialDocumentReviewRef = useRef<WorkflowFinancialDocumentReviewHandle>(null);
  const purchaseFillStockRef = useRef<WorkflowPurchaseFillStockHandle>(null);
  const purchaseUploadProformaRef = useRef<WorkflowPurchaseUploadProformaHandle>(null);
  const purchaseUploadInvoiceRef = useRef<WorkflowPurchaseUploadInvoiceHandle>(null);
  const deepLinkHandled = useRef(false);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    const sortBy = sorting[0]?.id ?? 'created_at';
    const sortOrder = sorting[0]?.desc === false ? 'asc' : 'desc';
    const result = await getInboxAction({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      sortBy,
      sortOrder,
    });
    if (result.success && result.data) {
      setItems(result.data.items || []);
      setTotal(result.data.total || 0);
    } else {
      toast({ title: 'خطا', description: result.error || 'خطا در دریافت کارتابل', variant: 'destructive' });
    }
    setLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, sorting, toast]);

  const triggerLoad = useCallback(() => {
    startTransition(() => void loadInbox());
  }, [loadInbox, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(timer);
  }, [triggerLoad]);

  const loadInstanceDetails = useCallback(async (instanceId: number) => {
    setPlanLoading(true);
    const [historyResult, formResult] = await Promise.all([
      getWorkflowApprovalHistoryAction(instanceId),
      resolveWorkflowFormFromInstanceAction(instanceId),
    ]);
    setPlanLoading(false);

    if (historyResult.success && historyResult.data) {
      setApprovalHistory(historyResult.data);
      setPlanError(null);
    } else {
      setApprovalHistory(null);
      setPlanError(historyResult.error || 'تاریخچه تأیید بارگذاری نشد');
    }

    if (formResult.success && formResult.data) {
      setResolvedForm(formResult.data);
      setFormError(null);
    } else {
      setResolvedForm(null);
      setFormError(formResult.error || 'جزئیات درخواست برای این کار یافت نشد.');
    }

    return { historyResult, formResult };
  }, []);

  const openAdHocTask = useCallback(
    (row: InboxItem) => {
      void markInboxReadAction(row.id).then(() => void refreshBadgeCounts());
      router.push(`/dashboard/ad-hoc-tasks/${row.ref_id}`);
    },
    [router, refreshBadgeCounts],
  );

  const closeDetailsAfterDecision = useCallback(() => {
    setDetailsOpen(false);
    setSelectedInbox(null);
    setApprovalHistory(null);
    setResolvedForm(null);
    setPlanError(null);
    setFormError(null);
    setApproveComment('');
    setPaymentMethod('cash');
    setSepidarConfirmed(false);
    setMarkRegistered(false);
    setPaymentLocation('');
    setPayerCompanyAccountId(0);
    setCheckPlanRows(createEmptyCheckPlanRows(1));
    setWarehouseId('');
    setStepAttachmentFiles([]);
  }, []);

  const openWorkflowDetails = useCallback(
    async (row: InboxItem) => {
      setSelectedInbox(row);
      setDetailsOpen(true);
      setApprovalHistory(null);
      setResolvedForm(null);
      setPlanError(null);
      setFormError(null);
      setApproveComment('');
      setPaymentMethod('cash');
      setSepidarConfirmed(false);
      setMarkRegistered(false);
      setPaymentLocation('');
      setPayerCompanyAccountId(0);
      setCheckPlanRows(createEmptyCheckPlanRows(1));
      setWarehouseId('');
      setStepAttachmentFiles([]);
      void markInboxReadAction(row.id).then(() => void refreshBadgeCounts());
      await loadInstanceDetails(row.ref_id);
    },
    [loadInstanceDetails, refreshBadgeCounts],
  );

  const openInboxItem = useCallback(
    (row: InboxItem) => {
      if (row.ref_type === 'ad_hoc_task') {
        openAdHocTask(row);
        return;
      }
      void openWorkflowDetails(row);
    },
    [openAdHocTask, openWorkflowDetails],
  );

  useEffect(() => {
    if (deepLinkHandled.current || loading || items.length === 0) return;

    const adHocTaskIdParam = searchParams.get('adHocTaskId');
    if (adHocTaskIdParam) {
      const taskId = Number(adHocTaskIdParam);
      if (!Number.isFinite(taskId)) return;
      const match = items.find((i) => i.ref_type === 'ad_hoc_task' && i.ref_id === taskId);
      if (match) {
        deepLinkHandled.current = true;
        const timer = window.setTimeout(() => openAdHocTask(match), 0);
        return () => window.clearTimeout(timer);
      }
    }

    const instanceIdParam = searchParams.get('instanceId');
    if (!instanceIdParam) return;
    const instanceId = Number(instanceIdParam);
    if (!Number.isFinite(instanceId)) return;
    const match = items.find((i) => i.ref_type !== 'ad_hoc_task' && i.ref_id === instanceId);
    if (match) {
      deepLinkHandled.current = true;
      const timer = window.setTimeout(() => {
        void openWorkflowDetails(match);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [searchParams, items, loading, openAdHocTask, openWorkflowDetails]);

  const paymentRecord =
    resolvedForm?.refType === 'payment_request' || resolvedForm?.refType === 'payment_order'
      ? (resolvedForm.raw as PaymentRequestResponse)
      : null;
  const pettyCashRecord =
    resolvedForm?.refType === 'petty_cash' || resolvedForm?.refType === 'petty_cash_settlement'
      ? (resolvedForm.raw as PettyCashResponse)
      : null;
  const missionRecord =
    resolvedForm?.refType === 'mission_request' || resolvedForm?.refType === 'mission_report'
      ? (resolvedForm.raw as MissionRequestResponse)
      : null;
  const financialDocumentRecord =
    resolvedForm?.refType === 'financial_document'
      ? (resolvedForm.raw as FinancialDocumentResponse)
      : null;
  const purchaseRecord =
    resolvedForm?.refType === 'request' ||
    resolvedForm?.refType === 'procurement_proforma' ||
    resolvedForm?.refType === 'purchase_request'
      ? (resolvedForm.raw as PurchaseRequest)
      : null;
  const proformaExpectedTotal = (() => {
    if (!purchaseRecord) return null;
    const active =
      purchaseRecord.proformas?.find(
        (p) => p.status === 'submitted' || p.status === 'approved',
      ) ?? purchaseRecord.proformas?.[0];
    const amount = active?.totalAmount ?? active?.amount;
    return amount != null && Number.isFinite(Number(amount)) ? Number(amount) : null;
  })();
  const currentSection =
    approvalHistory?.sections.find((s) => s.isCurrent) ??
    approvalHistory?.sections[approvalHistory.sections.length - 1];
  const pendingPlanStep = currentSection?.steps.find((s) => s.status === 'pending');
  const pendingStepId = pendingPlanStep?.id;
  const pendingOrder = pendingPlanStep?.order ?? 0;
  const canReturnRejectToPrevious = Boolean(
    pendingOrder > 0 &&
      currentSection?.steps.some((s) => typeof s.order === 'number' && s.order < pendingOrder),
  );

  const uploadPendingStepAttachments = async (instanceId: number) => {
    if (!pendingStepId || stepAttachmentFiles.length === 0) return;
    for (const file of stepAttachmentFiles) {
      const up = await uploadWorkflowStepAttachmentAction(instanceId, pendingStepId, file);
      if (!up.success) {
        toast({
          title: 'خطا در آپلود پیوست',
          description: up.error,
          variant: 'destructive',
        });
        throw new Error(up.error);
      }
    }
    setStepAttachmentFiles([]);
  };

  /** فیش/چک خرید باید روی entity فیش ذخیره شود (نه فقط پیوست مرحله) */
  const uploadPurchaseMarkPaymentFiles = async () => {
    if (!purchaseRecord || stepAttachmentFiles.length === 0) return;
    for (const file of stepAttachmentFiles) {
      const up = await uploadPurchasePaymentSlipAction(purchaseRecord.id, file);
      if (!up.success) {
        toast({
          title: 'خطا در آپلود فیش/چک',
          description: up.error,
          variant: 'destructive',
        });
        throw new Error(up.error);
      }
    }
    setStepAttachmentFiles([]);
  };

  /** بارنامه خرید روی entity بارنامه */
  const uploadPurchaseBolFiles = async () => {
    if (!purchaseRecord || stepAttachmentFiles.length === 0) return;
    for (const file of stepAttachmentFiles) {
      const up = await uploadPurchaseBolAction(purchaseRecord.id, file);
      if (!up.success) {
        toast({
          title: 'خطا در آپلود بارنامه',
          description: up.error,
          variant: 'destructive',
        });
        throw new Error(up.error);
      }
    }
    setStepAttachmentFiles([]);
  };
  const isFinanceApprovalStep = isFinanceWorkflowStepRole(pendingPlanStep?.roleName);
  const isFinanceContext = isFinanceRole(session?.roles) || isFinanceApprovalStep;

  const paymentNeedsFinancialTerms =
    paymentRecord != null &&
    isFinanceApprovalStep &&
    paymentRecord.status === 'pending' &&
    ((paymentRecord.type === PaymentRequestType.LOAN && isLoanTermsUnset(paymentRecord)) ||
      (paymentRecord.type === PaymentRequestType.ADVANCE && isAdvanceTermsUnset(paymentRecord)));

  const paymentNeedsPayer =
    paymentRecord != null &&
    isFinanceContext &&
    paymentRecord.status === 'pending' &&
    isPaymentRequestPayerUnset(paymentRecord);

  const paymentShowCompanyPayer =
    paymentNeedsPayer ||
    (paymentRecord?.type === PaymentRequestType.PAYMENT_ORDER && isFinanceContext) ||
    (paymentRecord != null &&
      isFinanceContext &&
      paymentRecord.status === 'pending' &&
      (paymentRecord.type === PaymentRequestType.LOAN || paymentRecord.type === PaymentRequestType.ADVANCE) &&
      (isPaymentRequestPayerUnset(paymentRecord) ||
        isLoanTermsUnset(paymentRecord) ||
        isAdvanceTermsUnset(paymentRecord)));

  const pendingStepAction = pendingPlanStep?.stepAction ?? null;
  const isFillStockStep = pendingStepAction === 'fill_stock';
  const isApproveProformaStep =
    pendingStepAction === 'approve_proforma' ||
    resolvedForm?.refType === 'procurement_proforma' ||
    (purchaseRecord?.status === 'proforma_review' &&
      (pendingStepAction == null ||
        pendingStepAction === 'approval' ||
        pendingStepAction === 'approve_proforma'));
  const isProformaApproval = isApproveProformaStep;
  const stepGuide = getWorkflowStepActionGuide(
    isApproveProformaStep ? 'approve_proforma' : pendingStepAction,
  );
  const isMarkPaymentStep = pendingStepAction === 'mark_payment';
  const isConfirmSepidarStep =
    pendingStepAction === 'confirm_sepidar' ||
    pendingStepAction === 'final_payment_approval';
  const isConfirmWarehouseSepidarStep = pendingStepAction === 'confirm_warehouse_sepidar';
  const isConfirmReceiptStep = pendingStepAction === 'confirm_receipt';
  const isUploadBolStep = pendingStepAction === 'upload_bol';
  const isUploadProformaStep = pendingStepAction === 'upload_proforma';
  const isUploadInvoiceStep = pendingStepAction === 'upload_invoice';
  const detailsReady = Boolean(
    resolvedForm ||
      paymentRecord ||
      pettyCashRecord ||
      financialDocumentRecord ||
      purchaseRecord,
  );
  const canActOnStep = detailsReady && !planLoading;
  /** نمایش فیلدهای اقدام (کامنت/چک‌باکس) — برای کارشناس و سرپرست هم فعال */
  const canDecide = canActOnStep;

  const workflowStatus = currentSection?.status ?? approvalHistory?.sections[0]?.status;
  const summaryFields: WorkflowSummaryField[] = [];
  if (purchaseRecord) {
    summaryFields.push({
      label: 'تعداد اقلام',
      value: `${purchaseRecord.items.length} قلم`,
    });
    if (purchaseRecord.reason) {
      summaryFields.push({ label: 'توضیح', value: purchaseRecord.reason });
    }
  }
  if (paymentRecord) {
    summaryFields.push({ label: 'نوع', value: paymentRecord.type });
    if (paymentRecord.amount != null) {
      summaryFields.push({ label: 'مبلغ', value: String(paymentRecord.amount) });
    }
    if (
      paymentRecord.type === PaymentRequestType.LOAN ||
      paymentRecord.type === PaymentRequestType.ADVANCE ||
      paymentRecord.type === PaymentRequestType.CASH
    ) {
      const dest =
        typeof resolvedForm?.summary[REQUESTER_DESTINATION_ACCOUNT_TITLE] === 'string'
          ? resolvedForm.summary[REQUESTER_DESTINATION_ACCOUNT_TITLE]
          : null;
      if (dest) {
        summaryFields.push({
          label: REQUESTER_DESTINATION_ACCOUNT_TITLE,
          value: dest,
        });
      }
    }
  }
  if (pettyCashRecord) {
    const dest =
      typeof resolvedForm?.summary[REQUESTER_DESTINATION_ACCOUNT_TITLE] === 'string'
        ? resolvedForm.summary[REQUESTER_DESTINATION_ACCOUNT_TITLE]
        : null;
    if (dest) {
      summaryFields.push({
        label: REQUESTER_DESTINATION_ACCOUNT_TITLE,
        value: dest,
      });
    }
  }

  const requesterName =
    (purchaseRecord?.requesterName && purchaseRecord.requesterName !== '—'
      ? purchaseRecord.requesterName
      : null) ??
    (paymentRecord?.requesterName && paymentRecord.requesterName !== '—'
      ? paymentRecord.requesterName
      : null) ??
    (pettyCashRecord?.requesterName && pettyCashRecord.requesterName !== '—'
      ? pettyCashRecord.requesterName
      : null) ??
    (missionRecord?.requesterName && missionRecord.requesterName !== '—'
      ? missionRecord.requesterName
      : null) ??
    (financialDocumentRecord?.requesterName && financialDocumentRecord.requesterName !== '—'
      ? financialDocumentRecord.requesterName
      : null) ??
    (typeof resolvedForm?.summary['درخواست‌کننده'] === 'string' &&
    resolvedForm.summary['درخواست‌کننده'] !== '—'
      ? resolvedForm.summary['درخواست‌کننده']
      : null) ??
    (typeof resolvedForm?.summary['ثبت‌کننده'] === 'string' &&
    resolvedForm.summary['ثبت‌کننده'] !== '—'
      ? resolvedForm.summary['ثبت‌کننده']
      : null) ??
    null;

  const recordCreatedAt =
    purchaseRecord?.createdAt ??
    paymentRecord?.createdAt ??
    null;

  const detailsContent =
    paymentRecord ||
    pettyCashRecord ||
    missionRecord ||
    financialDocumentRecord ||
    purchaseRecord ||
    resolvedForm ? (
      <>
        {paymentRecord && (
          <WorkflowPaymentRequestReview
            ref={paymentReviewRef}
            record={paymentRecord}
            needsPayer={paymentNeedsPayer}
            needsFinancialTerms={paymentNeedsFinancialTerms}
            showCompanyPayerSelect={paymentShowCompanyPayer}
          />
        )}
        {pettyCashRecord && <WorkflowPettyCashReview ref={pettyCashReviewRef} record={pettyCashRecord} />}
        {missionRecord && <MissionRequestDetailPanel data={missionRecord} />}
        {financialDocumentRecord && (
          <WorkflowFinancialDocumentReview
            ref={financialDocumentReviewRef}
            record={financialDocumentRecord}
            showApproverFields={!isMarkPaymentStep && !isConfirmSepidarStep}
          />
        )}
        {purchaseRecord && (
          <>
            <WorkflowPurchaseRequestReview
              record={purchaseRecord}
              refType={resolvedForm?.refType}
            />
            {isFillStockStep ? (
              <WorkflowPurchaseFillStock
                ref={purchaseFillStockRef}
                record={purchaseRecord}
                mode="fill_stock"
              />
            ) : null}
            {isUploadProformaStep ? (
              <WorkflowPurchaseUploadProforma
                ref={purchaseUploadProformaRef}
                record={purchaseRecord}
              />
            ) : null}
            {isUploadInvoiceStep ? (
              <WorkflowPurchaseUploadInvoice
                ref={purchaseUploadInvoiceRef}
                record={purchaseRecord}
              />
            ) : null}
            {isConfirmWarehouseSepidarStep ? (
              <WorkflowPurchaseFillStock
                ref={purchaseFillStockRef}
                record={purchaseRecord}
                mode="confirm_warehouse_sepidar"
                warehouseId={warehouseId}
                onWarehouseIdChange={setWarehouseId}
              />
            ) : null}
          </>
        )}
        {resolvedForm &&
          !paymentRecord &&
          !pettyCashRecord &&
          !missionRecord &&
          !financialDocumentRecord &&
          !purchaseRecord && (
          <div className="space-y-2 text-right text-sm">
            <p className="font-medium">{resolvedForm.label}</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Object.entries(resolvedForm.summary).map(([k, v]) => (
                <div key={k}>
                  <span className="text-muted-foreground">{k}:</span> {v}
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    ) : null;

  const sessionUserId = getNumericUserIdFromClientSession(session);
  const willAutoSkipNextStep =
    sessionUserId > 0 &&
    pendingPlanStep?.assignedUserId === sessionUserId &&
    (currentSection?.steps.some((s) => s.status === 'approved') ?? false);

  const handleApprove = async () => {
    if (!selectedInbox) return;

    const commentTrimmed = approveComment.trim();
    if (isProformaApproval) {
      if (!paymentLocation.trim()) {
        toast({
          title: 'محل پرداخت الزامی است',
          description: 'بانک یا تنخواه را انتخاب کنید.',
          variant: 'destructive',
        });
        return;
      }
      if (paymentLocation === 'bank' && !(payerCompanyAccountId > 0)) {
        toast({
          title: 'حساب بانکی شرکت الزامی است',
          description: 'یکی از حساب‌های بانکی شرکت را انتخاب کنید.',
          variant: 'destructive',
        });
        return;
      }
      if (!paymentMethod.trim() || (paymentMethod !== 'cash' && paymentMethod !== 'check')) {
        toast({
          title: 'روش پرداخت الزامی است',
          description: 'نقدی یا چک را انتخاب کنید.',
          variant: 'destructive',
        });
        return;
      }
      if (paymentMethod === 'check') {
        if (!checkPlanRows.length) {
          toast({
            title: 'برنامه چک الزامی است',
            description: 'حداقل یک سطر چک اضافه کنید.',
            variant: 'destructive',
          });
          return;
        }
        for (let i = 0; i < checkPlanRows.length; i++) {
          const row = checkPlanRows[i];
          if (!(row.amount > 0) || !row.dueDate.trim()) {
            toast({
              title: 'جزئیات چک ناقص است',
              description: `مبلغ و تاریخ سررسید سطر ${i + 1} را تکمیل کنید.`,
              variant: 'destructive',
            });
            return;
          }
        }
        const expected = proformaExpectedTotal;
        if (expected != null) {
          const total = checkPlanRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
          if (total !== expected) {
            toast({
              title: 'جمع مبالغ چک‌ها برابر پیش‌فاکتور نیست',
              description: 'جمع سطرها باید دقیقاً برابر مبلغ پیش‌فاکتور باشد.',
              variant: 'destructive',
            });
            return;
          }
        }
      }
      if (!commentTrimmed) {
        toast({
          title: 'توضیح روش پرداخت الزامی است',
          description: 'شرایط پرداخت را در کامنت بنویسید.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (isUploadBolStep && stepAttachmentFiles.length === 0) {
      const hasExistingBol =
        (purchaseRecord?.bolAttachments?.length ?? 0) > 0 ||
        (approvalHistory?.sections ?? [])
          .flatMap((s) => s.stepAttachments ?? [])
          .some(
            (a) =>
              a.attachmentScope === 'bol' ||
              a.attachmentScope === 'bill_of_lading' ||
              (pendingStepId != null &&
                a.workflowStepId === pendingStepId &&
                a.attachmentScope === 'workflow_step'),
          );
      if (!hasExistingBol) {
        toast({
          title: 'آپلود بارنامه الزامی است',
          description: 'فایل بارنامه را در بخش پیوست این مرحله بارگذاری کنید.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (isMarkPaymentStep && purchaseRecord) {
      const hasExistingSlips =
        (purchaseRecord.paymentSlips?.length ?? 0) > 0 ||
        (approvalHistory?.sections ?? [])
          .flatMap((s) => s.stepAttachments ?? [])
          .some(
            (a) =>
              a.attachmentScope === 'payment_slip' ||
              a.attachmentScope === 'payment-slip' ||
              (pendingStepId != null &&
                a.workflowStepId === pendingStepId &&
                (a.attachmentScope === 'workflow_step' || !a.attachmentScope)),
          );
      if (stepAttachmentFiles.length === 0 && !hasExistingSlips) {
        toast({
          title: 'آپلود فیش یا چک الزامی است',
          description:
            'تصویر فیش واریزی یا چک پرداخت‌شده را در بخش «فیش / چک پرداخت» همین فرم انتخاب کنید. فایل فاکتور کافی نیست.',
          variant: 'destructive',
        });
        return;
      }
    }

    let approvePayload: Parameters<typeof approveWorkflowAction>[1] | undefined;

    const needsApproverFinancialFields =
      !isMarkPaymentStep &&
      !isConfirmSepidarStep &&
      !isConfirmWarehouseSepidarStep &&
      !isFillStockStep &&
      !isUploadProformaStep &&
      !isUploadInvoiceStep &&
      !isApproveProformaStep &&
      !isConfirmReceiptStep &&
      !isUploadBolStep;

    if (paymentRecord && needsApproverFinancialFields) {
      const built = paymentReviewRef.current?.buildApprovePayload();
      if (!built?.ok) {
        toast({
          title: 'تکمیل اطلاعات الزامی است',
          description: built?.error ?? 'مبلغ و تاریخ پرداخت را بررسی کنید.',
          variant: 'destructive',
        });
        return;
      }
      approvePayload = built.payload;
    } else if (pettyCashRecord && needsApproverFinancialFields) {
      const built = pettyCashReviewRef.current?.buildApprovePayload();
      if (!built?.ok) {
        toast({
          title: 'تکمیل اطلاعات الزامی است',
          description: built?.error ?? 'مبلغ و تاریخ پرداخت را بررسی کنید.',
          variant: 'destructive',
        });
        return;
      }
      approvePayload = built.payload;
    } else if (financialDocumentRecord && needsApproverFinancialFields) {
      const built = financialDocumentReviewRef.current?.buildApprovePayload();
      if (!built?.ok) {
        toast({
          title: 'تکمیل اطلاعات الزامی است',
          description: built?.error ?? 'مبلغ و تاریخ پرداخت را بررسی کنید.',
          variant: 'destructive',
        });
        return;
      }
      approvePayload = built.payload;
    } else if (
      purchaseRecord &&
      (isFillStockStep || isConfirmWarehouseSepidarStep)
    ) {
      const built = purchaseFillStockRef.current?.buildApprovePayload();
      if (!built?.ok) {
        toast({
          title: 'تکمیل اطلاعات الزامی است',
          description: built?.error ?? 'اطلاعات مرحله را تکمیل کنید.',
          variant: 'destructive',
        });
        return;
      }
      if (isFillStockStep && built.stockUpdates?.length) {
        setActionPending(true);
        const stockRes = await updatePurchaseStockLevelsAction(
          purchaseRecord.id,
          built.stockUpdates,
        );
        if (!stockRes.success) {
          setActionPending(false);
          toast({
            title: 'ثبت موجودی انبار ناموفق بود',
            description: stockRes.error,
            variant: 'destructive',
          });
          return;
        }
      }
      approvePayload = built.payload;
    }

    if (isUploadProformaStep && purchaseRecord) {
      setActionPending(true);
      const inboxId = selectedInbox.id;
      const instanceId = selectedInbox.ref_id;
      runAction(
        async () => {
          await uploadPendingStepAttachments(instanceId);
          const result = await purchaseUploadProformaRef.current?.submitProforma();
          if (!result?.ok) {
            return {
              success: false as const,
              error: result?.error ?? 'ثبت پیش‌فاکتور ناموفق بود',
            };
          }
          return { success: true as const };
        },
        {
          successMessage: 'پیش‌فاکتور ثبت و برای تأیید ارسال شد',
          errorMessage: 'ثبت پیش‌فاکتور ناموفق بود',
          onSuccess: () => {
            void markInboxDoneAction(inboxId).then(() => void refreshBadgeCounts());
            closeDetailsAfterDecision();
            triggerLoad();
          },
          onSettled: () => setActionPending(false),
        },
      );
      return;
    }

    if (isUploadInvoiceStep && purchaseRecord) {
      setActionPending(true);
      const inboxId = selectedInbox.id;
      const instanceId = selectedInbox.ref_id;
      runAction(
        async () => {
          await uploadPendingStepAttachments(instanceId);
          const result = await purchaseUploadInvoiceRef.current?.submitInvoice();
          if (!result?.ok) {
            return {
              success: false as const,
              error: result?.error ?? 'بارگذاری فاکتور ناموفق بود',
            };
          }
          return { success: true as const };
        },
        {
          successMessage: 'فاکتور بارگذاری شد و مرحله تکمیل شد',
          errorMessage: 'بارگذاری فاکتور ناموفق بود',
          onSuccess: () => {
            void markInboxDoneAction(inboxId).then(() => void refreshBadgeCounts());
            closeDetailsAfterDecision();
            triggerLoad();
          },
          onSettled: () => setActionPending(false),
        },
      );
      return;
    }

    if (isMarkPaymentStep) {
      if (!markRegistered) {
        toast({
          title: 'تأیید ثبت الزامی است',
          description: 'تیک «ثبت شد» را بزنید و سپس دکمه ثبت در سپیدار را بزنید.',
          variant: 'destructive',
        });
        return;
      }
    }
    if (isConfirmSepidarStep || isConfirmWarehouseSepidarStep) {
      if (!sepidarConfirmed) {
        toast({
          title: 'تأیید ثبت سپیدار الزامی است',
          description: 'تیک «در نرم‌افزار سپیدار ثبت شده است» را بزنید.',
          variant: 'destructive',
        });
        return;
      }
    }

    setActionPending(true);
    const inboxId = selectedInbox.id;
    const instanceId = selectedInbox.ref_id;
    if (commentTrimmed) {
      approvePayload = { ...approvePayload, comment: commentTrimmed };
    }
    if (isProformaApproval) {
      approvePayload = {
        ...approvePayload,
        payment_method: paymentMethod,
        payment_location: paymentLocation.trim(),
        ...(paymentLocation === 'bank' && payerCompanyAccountId > 0
          ? { payer_company_account_id: payerCompanyAccountId }
          : {}),
        ...(paymentMethod === 'check'
          ? {
              check_plan: checkPlanRows.map((r) => ({
                amount: r.amount,
                dueDate: r.dueDate.trim(),
              })),
            }
          : {}),
      };
    }
    if (isMarkPaymentStep) {
      approvePayload = { ...approvePayload, payment_executed: true };
    }
    if (isConfirmSepidarStep || isConfirmWarehouseSepidarStep) {
      approvePayload = { ...approvePayload, sepidar_confirmed: true };
    }
    runAction(
      async () => {
        if (isMarkPaymentStep && purchaseRecord) {
          await uploadPurchaseMarkPaymentFiles();
        } else if (isUploadBolStep && purchaseRecord) {
          await uploadPurchaseBolFiles();
        } else {
          await uploadPendingStepAttachments(instanceId);
        }
        return approveWorkflowAction(instanceId, approvePayload);
      },
      {
      successMessage: isMarkPaymentStep
        ? 'ثبت در سپیدار انجام شد — ادامه را در «پیگیری گردش‌کار» ببینید'
        : isConfirmSepidarStep
          ? 'تأیید ثبت سپیدار انجام شد — ادامه در «پیگیری گردش‌کار»'
          : 'درخواست تأیید شد — برای یافتن کار با عنوان اصلی به «پیگیری گردش‌کار» بروید',
      errorMessage: 'تأیید ناموفق بود',
      onSuccess: () => {
        void markInboxDoneAction(inboxId).then(() => void refreshBadgeCounts());
        closeDetailsAfterDecision();
        triggerLoad();
      },
      onSettled: () => setActionPending(false),
    });
  };

  const handleRejectConfirm = async (payload: { comment: string; returnTo: 'previous' | 'requester' }) => {
    if (!selectedInbox) return;
    setActionPending(true);
    const inboxId = selectedInbox.id;
    const instanceId = selectedInbox.ref_id;
    runAction(
      async () => {
        await uploadPendingStepAttachments(instanceId);
        return rejectWorkflowAction(instanceId, payload);
      },
      {
        successMessage:
          payload.returnTo === 'requester'
            ? 'درخواست به درخواست‌کننده برگردانده شد'
            : 'درخواست به مرحله قبل برگردانده شد',
        errorMessage: 'رد ناموفق بود',
        onSuccess: () => {
          setRejectModalOpen(false);
          void markInboxDoneAction(inboxId).then(() => void refreshBadgeCounts());
          closeDetailsAfterDecision();
          triggerLoad();
        },
        onSettled: () => setActionPending(false),
      },
    );
  };

  const columns: ColumnDef<InboxItem>[] = [
    { accessorKey: 'title', header: 'عنوان', cell: ({ row }) => {
        const title = row.original.title || `کار #${row.original.id}`;
        const requestTitle = row.original.request_title?.trim();
        return (
          <div className="space-y-0.5 text-right">
            <p>{title}</p>
            {requestTitle && requestTitle !== title ? (
              <p className="text-xs text-muted-foreground">{requestTitle}</p>
            ) : null}
          </div>
        );
      } },
    {
      accessorKey: 'ref_type',
      header: 'نوع',
      cell: ({ row }) => inboxRefTypeLabel(row.original.ref_type),
    },
    {
      accessorKey: 'ref_id',
      header: 'شناسه مرجع',
      cell: ({ row }) => row.original.ref_id,
    },
    {
      accessorKey: 'created_at',
      header: 'زمان ورود به کارتابل',
      enableSorting: true,
      cell: ({ row }) =>
        formatJalaliDate(row.original.created_at, {
          withTime: true,
          persianDigits: true,
          fallback: '—',
        }),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <Button type="button" variant="outline" size="sm" onClick={() => openInboxItem(row.original)}>
          <Eye className="ml-1 h-4 w-4" />
          بررسی و اقدام
        </Button>
      ),
    },
  ];

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>کارهای من (Inbox)</CardTitle>
          <div className="space-y-2 text-sm font-normal text-muted-foreground">
            <p>کارهایی که الان منتظر اقدام شما هستند اینجا می‌آیند. برای هر مورد:</p>
            <ol className="list-decimal space-y-1 pr-5">
              <li>
                روی <span className="font-medium text-foreground">بررسی و اقدام</span> بزنید تا جزئیات و وظیفه مرحله باز شود.
              </li>
              <li>راهنمای آبی «وظیفه شما» را بخوانید و فیلدهای لازم را پر کنید.</li>
              <li>
                از دکمه پایین مودال تأیید/ثبت کنید، یا با دلیل{' '}
                <span className="font-medium text-foreground">رد</span> کنید.
              </li>
            </ol>
            <p>
              پس از تأیید، کار از این لیست خارج می‌شود. برای پیدا کردن همان درخواست به{' '}
              <Link href="/dashboard/workflow/tracking" className="text-primary underline">
                پیگیری گردش‌کار
              </Link>{' '}
              بروید.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<InboxItem>
            data={items}
            columns={columns}
            totalItems={total}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={setSorting}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            isLoading={loading || isPending}
            entityName="کارتابل"
            onRefresh={triggerLoad}
            onExport={async () => items}
          />
        </CardContent>
      </Card>

      <AdvancedModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={
          selectedInbox
            ? `اقدام شما: ${stepGuide.actionLabel}`
            : 'جزئیات جریان کار'
        }
        size="xl"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row-reverse sm:flex-wrap sm:items-center sm:justify-start">
            <p className="order-last w-full text-center text-xs text-muted-foreground sm:order-first sm:ml-auto sm:w-auto sm:text-right">
              {!canActOnStep
                ? 'در حال بارگذاری جزئیات…'
                : 'پس از تکمیل فیلدها، یکی از دکمه‌های زیر را بزنید'}
            </p>
            <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)} disabled={actionPending}>
              بستن
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={actionPending || !canActOnStep}
              onClick={() => setRejectModalOpen(true)}
            >
              <X className="ml-1 h-4 w-4" />
              رد
            </Button>
            <Button
              type="button"
              disabled={
                actionPending ||
                !canActOnStep ||
                (isMarkPaymentStep && !markRegistered) ||
                ((isConfirmSepidarStep || isConfirmWarehouseSepidarStep) &&
                  !sepidarConfirmed) ||
                (isUploadBolStep && stepAttachmentFiles.length === 0)
              }
              onClick={() => void handleApprove()}
            >
              <Check className="ml-1 h-4 w-4" />
              {stepGuide.primaryButtonLabel}
            </Button>
          </div>
        }
      >
        {!selectedInbox ? (
          <p className="text-sm text-muted-foreground">موردی انتخاب نشده است.</p>
        ) : (
          <WorkflowInboxReviewPanel
            title={selectedInbox.title || `کار #${selectedInbox.id}`}
            subtitle={
              pendingPlanStep
                ? `مرحله جاری: ${pendingPlanStep.label ?? pendingPlanStep.roleName ?? pendingPlanStep.order}`
                : null
            }
            statusLabel={getWorkflowInstanceStatusLabel(workflowStatus)}
            statusTone={workflowStatusTone(workflowStatus)}
            requesterName={requesterName}
            createdAt={recordCreatedAt}
            summaryFields={summaryFields}
            approvalHistory={approvalHistory}
            planLoading={planLoading}
            planError={planError}
            formError={!resolvedForm && formError ? formError : null}
            detailsContent={detailsContent}
            relatedRequestsContent={
              selectedInbox.ref_type !== 'ad_hoc_task' ? (
                <RelatedRequestsPanel instanceId={selectedInbox.ref_id} />
              ) : null
            }
            showSameAssigneeAlert={willAutoSkipNextStep}
            canDecide={canDecide}
            approveComment={approveComment}
            onApproveCommentChange={setApproveComment}
            pendingStepOrder={pendingPlanStep?.order ?? null}
            attachmentFiles={stepAttachmentFiles}
            onAttachmentFilesChange={setStepAttachmentFiles}
            actionPending={actionPending}
            showPaymentMethod={isProformaApproval}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            showProformaPaymentFields={isProformaApproval}
            paymentLocation={paymentLocation}
            onPaymentLocationChange={setPaymentLocation}
            payerCompanyAccountId={payerCompanyAccountId}
            onPayerCompanyAccountIdChange={setPayerCompanyAccountId}
            checkPlanRows={checkPlanRows}
            onCheckPlanRowsChange={setCheckPlanRows}
            proformaExpectedTotal={proformaExpectedTotal}
            showMarkRegistered={isMarkPaymentStep}
            markRegistered={markRegistered}
            onMarkRegisteredChange={setMarkRegistered}
            showSepidarConfirm={isConfirmSepidarStep || isConfirmWarehouseSepidarStep}
            sepidarConfirmed={sepidarConfirmed}
            onSepidarConfirmedChange={setSepidarConfirmed}
            sepidarConfirmLabel={
              isConfirmWarehouseSepidarStep
                ? 'در نرم‌افزار سپیدار ثبت شده است'
                : undefined
            }
            hideStepAttachments={
              Boolean(financialDocumentRecord) ||
              isFillStockStep ||
              isUploadProformaStep ||
              isUploadInvoiceStep ||
              isConfirmReceiptStep ||
              isConfirmWarehouseSepidarStep
            }
            stepAttachmentLabel={
              isUploadBolStep
                ? 'فایل بارنامه *'
                : isMarkPaymentStep && purchaseRecord
                  ? 'فیش / چک پرداخت *'
                  : undefined
            }
            stepGuide={stepGuide}
            primaryButtonLabel={stepGuide.primaryButtonLabel}
            operationalNoticeExtra={
              isMarkPaymentStep
                ? financialDocumentRecord
                  ? 'تصاویر سند را در جزئیات بالا بررسی کنید. سپیدار نرم‌افزار جدا از این سامانه است.'
                  : purchaseRecord
                    ? 'تصویر فیش واریزی یا چک پرداخت‌شده را در بخش «فیش / چک پرداخت» آپلود کنید (فایل فاکتور کافی نیست).'
                    : null
                : isUploadProformaStep || isUploadInvoiceStep || isFillStockStep
                  ? 'فیلدها و فایل‌های این مرحله داخل بخش «جزئیات درخواست» هستند.'
                  : financialDocumentRecord && !isMarkPaymentStep
                    ? 'تصاویر سند فقط برای رویت است.'
                    : null
            }
          />
        )}
      </AdvancedModal>

      <WorkflowRejectModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        pendingStepOrder={pendingPlanStep?.order ?? null}
        canReturnToPrevious={canReturnRejectToPrevious}
        loading={actionPending}
        onConfirm={(payload) => void handleRejectConfirm(payload)}
      />
    </DashboardPageShell>
  );
}




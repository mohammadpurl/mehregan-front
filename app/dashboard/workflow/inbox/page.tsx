'use client';

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
import type { PurchaseRequest } from '@/app/_types/purchase-request.types';
import type { PettyCashResponse } from '@/app/dashboard/petty-cash/_types/petty-cash.types';
import type { MissionRequestResponse } from '@/app/dashboard/mission-requests/_types/mission-request.types';
import { MissionRequestDetailPanel } from '@/app/dashboard/mission-requests/_components/mission-request-detail-panel';
import { WorkflowInboxReviewPanel } from './_components/workflow-inbox-review-panel';
import { RelatedRequestsPanel } from '@/app/dashboard/workflow/_components/related-requests-panel';
import { WorkflowRejectModal } from './_components/workflow-inbox-decision';
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

function workflowStatusLabelFa(status?: string): string {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved') return 'تأیید شده';
  if (s === 'rejected') return 'رد شده';
  if (s === 'returned') return 'برگشت به درخواست‌کننده';
  if (s === 'in_progress' || s === 'active') return 'در حال تأیید';
  if (s === 'pending') return 'در انتظار';
  return status ?? '—';
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
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [sepidarConfirmed, setSepidarConfirmed] = useState(false);
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
    setPaymentMethod('transfer');
    setSepidarConfirmed(false);
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
      setPaymentMethod('transfer');
      setSepidarConfirmed(false);
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

  const isProformaApproval =
    resolvedForm?.refType === 'procurement_proforma' ||
    (resolvedForm?.refType === 'purchase_request' &&
      purchaseRecord?.status === 'proforma_review');
  const pendingStepAction = pendingPlanStep?.stepAction ?? null;
  const isMarkPaymentStep = pendingStepAction === 'mark_payment';
  const isConfirmSepidarStep =
    pendingStepAction === 'confirm_sepidar' ||
    pendingStepAction === 'final_payment_approval';
  const isOperationalInboxStep =
    pendingStepAction === 'upload_proforma' || pendingStepAction === 'upload_invoice';
  const detailsReady = Boolean(resolvedForm || paymentRecord || pettyCashRecord || financialDocumentRecord);
  const canActOnStep = detailsReady && !planLoading && !isOperationalInboxStep;
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
          <WorkflowFinancialDocumentReview ref={financialDocumentReviewRef} record={financialDocumentRecord} />
        )}
        {purchaseRecord && (
          <WorkflowPurchaseRequestReview
            record={purchaseRecord}
            refType={resolvedForm?.refType}
          />
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
      if (!paymentMethod.trim()) {
        toast({
          title: 'روش پرداخت الزامی است',
          variant: 'destructive',
        });
        return;
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

    let approvePayload: Parameters<typeof approveWorkflowAction>[1] | undefined;

    const needsApproverFinancialFields =
      !isMarkPaymentStep && !isConfirmSepidarStep;

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
    }

    setActionPending(true);
    const inboxId = selectedInbox.id;
    const instanceId = selectedInbox.ref_id;
    if (commentTrimmed) {
      approvePayload = { ...approvePayload, comment: commentTrimmed };
    }
    if (isProformaApproval) {
      approvePayload = { ...approvePayload, payment_method: paymentMethod };
    }
    if (isMarkPaymentStep) {
      approvePayload = { ...approvePayload, payment_executed: true };
    }
    if (isConfirmSepidarStep) {
      if (!sepidarConfirmed) {
        toast({
          title: 'تأیید ثبت سپیدار الزامی است',
          description: 'تیک «در نرم‌افزار سپیدار ثبت شده است» را بزنید.',
          variant: 'destructive',
        });
        return;
      }
      approvePayload = { ...approvePayload, sepidar_confirmed: true };
    }
    runAction(
      async () => {
        await uploadPendingStepAttachments(instanceId);
        return approveWorkflowAction(instanceId, approvePayload);
      },
      {
      successMessage: isMarkPaymentStep
        ? 'ثبت در سپیدار در سیستم ثبت شد'
        : isConfirmSepidarStep
          ? 'تأیید ثبت سپیدار انجام شد'
          : 'درخواست تأیید شد',
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
    { accessorKey: 'title', header: 'عنوان', cell: ({ row }) => row.original.title || `کار #${row.original.id}` },
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
          نمایش
        </Button>
      ),
    },
  ];

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle>کارهای من (Inbox)</CardTitle>
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
        title="جزئیات جریان کار"
        size="xl"
        footer={
          <div className="flex w-full flex-row-reverse flex-wrap justify-start gap-2">
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
            {isMarkPaymentStep ? (
              <Button
                type="button"
                disabled={actionPending || !canActOnStep}
                onClick={() => void handleApprove()}
              >
                <Check className="ml-1 h-4 w-4" />
                ثبت در سپیدار انجام شد
              </Button>
            ) : (
              <Button
                type="button"
                disabled={
                  actionPending ||
                  !canActOnStep ||
                  (isConfirmSepidarStep && !sepidarConfirmed)
                }
                onClick={() => void handleApprove()}
              >
                <Check className="ml-1 h-4 w-4" />
                تأیید
              </Button>
            )}
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
            statusLabel={workflowStatusLabelFa(workflowStatus)}
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
            showSepidarConfirm={isConfirmSepidarStep}
            sepidarConfirmed={sepidarConfirmed}
            onSepidarConfirmedChange={setSepidarConfirmed}
            operationalNotice={
              isMarkPaymentStep
                ? 'کار را در نرم‌افزار سپیدار (جدا از این سامانه) ثبت کنید؛ سپس دکمه «ثبت در سپیدار انجام شد» را بزنید.'
                : isConfirmSepidarStep
                  ? 'ثبت در سپیدار را در نرم‌افزار سپیدار بررسی کنید؛ سپس تیک «در نرم‌افزار سپیدار ثبت شده است» را بزنید و تأیید کنید.'
                  : isOperationalInboxStep
                    ? pendingStepAction === 'upload_proforma'
                      ? 'این مرحله «ثبت پیش‌فاکتور» است و از کارتابل تأیید نمی‌شود. به صفحه درخواست‌های خرید بروید، پیش‌فاکتور را بارگذاری و دکمه «ارسال برای تأیید» را بزنید تا گردش‌کار یک مرحله جلو برود.'
                      : 'این مرحله «بارگذاری فاکتور» است. از صفحه درخواست‌های خرید فاکتور را آپلود کنید.'
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




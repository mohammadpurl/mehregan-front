'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
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
  getWorkflowApprovalPlanAction,
  rejectWorkflowAction,
} from '@/app/_actions/workflow-runtime-actions';
import { getPaymentRequestByWorkflowInstanceAction } from '@/app/_actions/payment-request-actions';
import { getPettyCashByWorkflowInstanceAction } from '@/app/_actions/petty-cash-actions';
import { resolveWorkflowFormAction } from '@/app/utils/resolve-workflow-form';
import {
  buildPaymentRequestResolved,
  buildPettyCashResolved,
  type ResolvedWorkflowForm,
} from '@/app/utils/resolve-workflow-form.utils';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import type { WorkflowApprovalPlan } from '@/app/_types/workflow-approval-plan.types';
import { useFormAction } from '@/app/hooks/use-form-action';
import { useSessionStore } from '@/app/_store/auth-store';
import { useNotificationCenterStore } from '@/app/_store/notification-center.store';
import type { PaymentRequestResponse } from '@/app/dashboard/payment-request/_types/payment-request.types';
import { PaymentRequestType } from '@/app/dashboard/payment-request/_types/payment-request.types';
import { needsApproverReview } from '@/app/dashboard/payment-request/_utils/payment-request-form.utils';
import {
  isAdvanceTermsUnset,
  isLoanTermsUnset,
  isPaymentRequestPayerUnset,
} from '@/app/dashboard/payment-request/_utils/payment-request-mapper';
import {
  isApproverRole,
  isFinanceRole,
  isFinanceWorkflowStepRole,
} from '@/app/dashboard/payment-request/_utils/payment-request-roles';
import { getNumericUserIdFromClientSession } from '@/app/dashboard/payment-request/_utils/payment-request-session';
import {
  WorkflowPaymentRequestReview,
  type WorkflowPaymentRequestReviewHandle,
} from './_components/workflow-payment-request-review';
import { WorkflowPettyCashReview } from './_components/workflow-petty-cash-review';
import type { PettyCashResponse } from '@/app/dashboard/petty-cash/_types/petty-cash.types';
import { WorkflowApprovalPlanTimeline } from './_components/workflow-approval-plan';
import { WorkflowSameAssigneeAlert } from '@/app/dashboard/workflow/_components/workflow-same-assignee-alert';
import { formatJalaliDate } from '@/app/utils/jalali-date';

export default function WorkflowInboxPage() {
  const { toast } = useToast();
  const { runAction } = useFormAction();
  const searchParams = useSearchParams();
  const session = useSessionStore((s) => s.session);
  const refreshBadgeCounts = useNotificationCenterStore((s) => s.refreshBadgeCounts);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [actionPending, setActionPending] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInbox, setSelectedInbox] = useState<InboxItem | null>(null);
  const [approvalPlan, setApprovalPlan] = useState<WorkflowApprovalPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [resolvedForm, setResolvedForm] = useState<ResolvedWorkflowForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const paymentReviewRef = useRef<WorkflowPaymentRequestReviewHandle>(null);
  const deepLinkHandled = useRef(false);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    const sortBy = sorting[0]?.id;
    const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
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
    const [paymentResult, pettyCashResult, planResult] = await Promise.all([
      getPaymentRequestByWorkflowInstanceAction(instanceId),
      getPettyCashByWorkflowInstanceAction(instanceId),
      getWorkflowApprovalPlanAction(instanceId),
    ]);
    setPlanLoading(false);

    if (planResult.success && planResult.data) {
      setApprovalPlan(planResult.data);
      setPlanError(null);
    } else {
      setApprovalPlan(null);
      setPlanError(planResult.error || 'مسیر تأیید بارگذاری نشد');
    }

    if (pettyCashResult.success && pettyCashResult.data) {
      const pc = pettyCashResult.data;
      setResolvedForm(buildPettyCashResolved('petty_cash', Number(pc.id), pc));
      setFormError(null);
    } else if (paymentResult.success && paymentResult.data) {
      const pr = paymentResult.data;
      setResolvedForm(buildPaymentRequestResolved('payment_request', Number(pr.id), pr));
      setFormError(null);
    } else if (planResult.success && planResult.data) {
      const refType = String(planResult.data.refType).toLowerCase() as WorkflowBusinessRefType;
      const formResult = await resolveWorkflowFormAction(refType, planResult.data.refId);
      if (formResult.success && formResult.data) {
        setResolvedForm(formResult.data);
        setFormError(null);
      } else {
        setResolvedForm(null);
        setFormError(formResult.error || 'جزئیات فرم بارگذاری نشد');
      }
    } else {
      setResolvedForm(null);
      setFormError(
        pettyCashResult.error ||
          paymentResult.error ||
          'جزئیات درخواست برای این کار یافت نشد.',
      );
    }

    return { paymentResult, pettyCashResult, planResult };
  }, []);

  const openDetails = useCallback(
    async (row: InboxItem) => {
      setSelectedInbox(row);
      setDetailsOpen(true);
      setApprovalPlan(null);
      setResolvedForm(null);
      setPlanError(null);
      setFormError(null);
      void markInboxReadAction(row.id).then(() => void refreshBadgeCounts());
      await loadInstanceDetails(row.ref_id);
    },
    [loadInstanceDetails, refreshBadgeCounts],
  );

  useEffect(() => {
    const instanceIdParam = searchParams.get('instanceId');
    if (!instanceIdParam || deepLinkHandled.current || loading || items.length === 0) return;
    const instanceId = Number(instanceIdParam);
    if (!Number.isFinite(instanceId)) return;
    const match = items.find((i) => i.ref_id === instanceId);
    if (match) {
      deepLinkHandled.current = true;
      const timer = window.setTimeout(() => {
        void openDetails(match);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [searchParams, items, loading, openDetails]);

  const paymentRecord =
    resolvedForm?.refType === 'payment_request' ? (resolvedForm.raw as PaymentRequestResponse) : null;
  const pettyCashRecord =
    resolvedForm?.refType === 'petty_cash' ? (resolvedForm.raw as PettyCashResponse) : null;
  const pendingPlanStep = approvalPlan?.steps.find((s) => s.status === 'pending');
  const isFinanceApprovalStep = isFinanceWorkflowStepRole(pendingPlanStep?.roleName);
  const isFinanceContext = isFinanceRole(session?.roles) || isFinanceApprovalStep;

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

  const detailsReady = Boolean(resolvedForm || paymentRecord);
  const canDecide = detailsReady && !planLoading;

  const paymentApprovalBlocked =
    paymentRecord != null &&
    needsApproverReview({
      isApprover: isApproverRole(session?.roles),
      isFinance: isFinanceRole(session?.roles),
      isFinanceStep: isFinanceApprovalStep,
      status: paymentRecord.status,
      record: paymentRecord,
      payerUnset: isPaymentRequestPayerUnset(paymentRecord),
    });

  const sessionUserId = getNumericUserIdFromClientSession(session);
  const willAutoSkipNextStep =
    sessionUserId > 0 &&
    pendingPlanStep?.assignedUserId === sessionUserId &&
    (approvalPlan?.steps.some((s) => s.status === 'approved') ?? false);

  const handleApprove = async () => {
    if (!selectedInbox) return;

    let approvePayload: Parameters<typeof approveWorkflowAction>[1] | undefined;
    if (paymentRecord) {
      const built = paymentReviewRef.current?.buildApprovePayload();
      const needsPayload =
        paymentApprovalBlocked ||
        paymentRecord.type === PaymentRequestType.LOAN ||
        paymentRecord.type === PaymentRequestType.ADVANCE ||
        paymentRecord.type === PaymentRequestType.PAYMENT_ORDER ||
        paymentNeedsPayer ||
        paymentShowCompanyPayer;
      if (needsPayload) {
        if (!built?.ok) {
          toast({
            title: 'تکمیل اطلاعات الزامی است',
            description: built?.error ?? 'اطلاعات تأیید را تکمیل کنید.',
            variant: 'destructive',
          });
          return;
        }
        approvePayload = built.payload;
      }
    }

    setActionPending(true);
    const inboxId = selectedInbox.id;
    const instanceId = selectedInbox.ref_id;
    runAction(() => approveWorkflowAction(instanceId, approvePayload), {
      successMessage: 'درخواست تأیید شد',
      errorMessage: 'تأیید ناموفق بود',
      onSuccess: async () => {
        void markInboxDoneAction(inboxId).then(() => void refreshBadgeCounts());
        const { planResult, paymentResult } = await loadInstanceDetails(instanceId);
        triggerLoad();
        const workflowDone =
          planResult.data?.status === 'approved' ||
          planResult.data?.status === 'rejected' ||
          paymentResult.data?.status === 'approved' ||
          paymentResult.data?.status === 'rejected';
        if (workflowDone) {
          toast({
            title: 'فرآیند تأیید تکمیل شد',
            description: 'مسیر تأیید و وضعیت درخواست به‌روزرسانی شد.',
          });
        }
      },
      onSettled: () => setActionPending(false),
    });
  };

  const handleReject = async () => {
    if (!selectedInbox) return;
    const comment = typeof window !== 'undefined' ? window.prompt('دلیل رد (اختیاری):', '') : '';
    if (comment === null) return;
    setActionPending(true);
    const inboxId = selectedInbox.id;
    runAction(() => rejectWorkflowAction(selectedInbox.ref_id, comment || undefined), {
      successMessage: 'درخواست رد شد',
      errorMessage: 'رد ناموفق بود',
      onSuccess: () => {
        void markInboxDoneAction(inboxId).then(() => void refreshBadgeCounts());
        setDetailsOpen(false);
        setSelectedInbox(null);
        triggerLoad();
      },
      onSettled: () => setActionPending(false),
    });
  };

  const columns: ColumnDef<InboxItem>[] = [
    { accessorKey: 'title', header: 'عنوان', cell: ({ row }) => row.original.title || `کار #${row.original.id}` },
    {
      accessorKey: 'ref_id',
      header: 'شناسه نمونه',
      cell: ({ row }) => row.original.ref_id,
    },
    {
      accessorKey: 'created_at',
      header: 'تاریخ',
      cell: ({ row }) => formatJalaliDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <Button type="button" variant="outline" size="sm" onClick={() => void openDetails(row.original)}>
          <Eye className="h-4 w-4" />
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
            globalFilter=""
            onGlobalFilterChange={() => {}}
            columnFilters={[]}
            onColumnFiltersChange={() => {}}
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
        title="بررسی و تأیید"
        size="lg"
        footer={
          <div className="flex w-full flex-row-reverse flex-wrap justify-start gap-2">
            <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)} disabled={actionPending}>
              بستن
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={actionPending || !canDecide}
              onClick={() => void handleReject()}
            >
              <X className="ml-1 h-4 w-4" />
              رد
            </Button>
            <Button type="button" disabled={actionPending || !canDecide} onClick={() => void handleApprove()}>
              <Check className="ml-1 h-4 w-4" />
              تأیید
            </Button>
          </div>
        }
      >
        {!selectedInbox ? (
          <p className="text-sm text-muted-foreground">موردی انتخاب نشده است.</p>
        ) : (
          <div className="space-y-4 text-sm">
            {selectedInbox.title && (
              <p className="text-base font-semibold text-right">{selectedInbox.title}</p>
            )}

            {planLoading && (
              <p className="text-sm text-muted-foreground">در حال بارگذاری جزئیات درخواست…</p>
            )}

            <WorkflowSameAssigneeAlert show={willAutoSkipNextStep} />

            {formError && !resolvedForm && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                {formError}
              </p>
            )}

            {resolvedForm && (
              <div className="space-y-3 text-right">
                <p className="font-medium">{resolvedForm.label}</p>
                <div className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/20 p-3 md:grid-cols-2">
                  {Object.entries(resolvedForm.summary).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-muted-foreground">{k}:</span> {v}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paymentRecord && (
              <WorkflowPaymentRequestReview
                ref={paymentReviewRef}
                record={paymentRecord}
                needsPayer={paymentNeedsPayer}
                showCompanyPayerSelect={paymentShowCompanyPayer}
              />
            )}

            {pettyCashRecord && <WorkflowPettyCashReview record={pettyCashRecord} />}

            <WorkflowApprovalPlanTimeline plan={approvalPlan} loading={planLoading} error={planError} />

            {!planLoading && !detailsReady && (
              <p className="text-sm text-muted-foreground">
                بدون جزئیات درخواست، تأیید یا رد ممکن نیست. پس از رفع خطا، صفحه را ببندید و دوباره باز کنید.
              </p>
            )}
          </div>
        )}
      </AdvancedModal>
    </DashboardPageShell>
  );
}

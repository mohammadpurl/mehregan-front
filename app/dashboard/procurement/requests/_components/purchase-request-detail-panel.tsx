'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import {
  getPurchaseProformasAction,
  getPurchaseRequestAction,
  markPurchaseInvoicePaidAction,
} from '@/app/_actions/purchase-request-actions';
import { paymentMethodLabel, paymentLocationLabel } from '@/app/dashboard/payment-request/_utils/payment-method';
import { isFinanceRole } from '@/app/dashboard/payment-request/_utils/payment-request-roles';
import { useSessionStore } from '@/app/_store/auth-store';
import { getWorkflowApprovalHistoryAction } from '@/app/_actions/workflow-runtime-actions';
import { WorkflowApprovalPlanTimeline } from '@/app/dashboard/workflow/inbox/_components/workflow-approval-plan';
import type { WorkflowApprovalHistory } from '@/app/_types/workflow-approval-plan.types';
import type { PurchaseProforma, PurchaseRequest } from '@/app/_types/purchase-request.types';
import { useToast } from '@/hooks/use-toast';
import { formatAmount } from '@/app/utils/number-format';
import { RemoteAttachmentPreview } from '@/app/components/attachments/attachment-inline-preview';
import { RequestAttachmentsPanel } from '@/app/components/attachments/request-attachments-panel';
import { extractAttachmentId } from '@/app/utils/attachment-display.utils';
import {
  purchaseRequestStatusClass,
  purchaseRequestStatusLabels,
} from '../../_utils/procurement-status-labels';
import { formatPurchaseRequestStage } from '../../_utils/procurement-stage-hints';
import { GoodsReceiptPanel } from './goods-receipt-panel';
import { PurchaseRequestPaymentPanel } from './purchase-request-payment-panel';
import { RelatedRequestsPanel } from '@/app/dashboard/workflow/_components/related-requests-panel';

type Props = {
  requestId: number;
  onUpdated?: () => void;
};

const PROFORMA_STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  submitted: 'ارسال‌شده برای تأیید',
  approved: 'تأیید شده',
  rejected: 'رد شده',
};

function proformaStatusLabel(status: string): string {
  return PROFORMA_STATUS_LABELS[status] ?? status;
}

export function PurchaseRequestDetailPanel({ requestId, onUpdated }: Props) {
  const { toast } = useToast();
  const session = useSessionStore((s) => s.session);
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [proformas, setProformas] = useState<PurchaseProforma[]>([]);
  const [busy, setBusy] = useState(false);
  const [pendingApprover, setPendingApprover] = useState<string | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<WorkflowApprovalHistory | null>(null);

  const reload = useCallback(async () => {
    const [reqRes, pfRes] = await Promise.all([
      getPurchaseRequestAction(requestId),
      getPurchaseProformasAction(requestId),
    ]);
    if (reqRes.success && reqRes.data) {
      setRequest(reqRes.data);
      if (reqRes.data.proformas?.length) {
        setProformas(reqRes.data.proformas);
      }
      const activePhase = reqRes.data.workflowProgress?.find(
        (p) => p.instanceStatus === 'pending' || p.instanceStatus === 'in_progress',
      );
      const wfId = activePhase?.instanceId ?? reqRes.data.workflowInstanceId;
      if (wfId) {
        const historyRes = await getWorkflowApprovalHistoryAction(wfId);
        if (historyRes.success && historyRes.data) {
          setApprovalHistory(historyRes.data);
          const current =
            historyRes.data.sections.find((s) => s.isCurrent) ??
            historyRes.data.sections[historyRes.data.sections.length - 1];
          const pending = [...(current?.steps ?? [])]
            .sort((a, b) => a.order - b.order)
            .find((s) => s.status === 'pending');
          if (pending) {
            setPendingApprover(
              [pending.label, pending.roleName, pending.assignedUserName]
                .filter(Boolean)
                .join(' — ') || 'منتظر تأیید',
            );
          } else {
            setPendingApprover(null);
          }
        } else {
          setApprovalHistory(null);
          setPendingApprover(null);
        }
      } else {
        setApprovalHistory(null);
        setPendingApprover(null);
      }
    }
    if (pfRes.success && pfRes.data) setProformas(pfRes.data);
  }, [requestId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const canMarkInvoicePaid =
    request?.status === 'awaiting_invoice' &&
    !request?.invoicePaidAt &&
    isFinanceRole(session?.roles);

  const onMarkInvoicePaid = async () => {
    setBusy(true);
    const res = await markPurchaseInvoicePaidAction(requestId);
    setBusy(false);
    if (!res.success) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'پرداخت فاکتور ثبت شد' });
    await reload();
    onUpdated?.();
  };

  if (!request) return <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>;

  const statusLabel = purchaseRequestStatusLabels[request.status] ?? request.status;
  const statusClass = purchaseRequestStatusClass[request.status] ?? '';
  const phase1 = request.workflowProgress?.find((p) => p.phase === 'phase1');
  const phase2 = request.workflowProgress?.find((p) => p.phase === 'phase2');
  const stepStatusLabel: Record<string, string> = {
    approved: 'تأیید شده',
    pending: 'در انتظار',
    rejected: 'رد شده',
    skipped: 'رد شده (خودکار)',
  };

  const renderPhaseProgress = (
    phase: NonNullable<typeof phase1>,
    title: string,
  ) => (
    <div className="rounded border p-3 space-y-2 text-xs">
      <p className="font-medium">{title}</p>
      <ul className="space-y-1">
        {[...phase.steps]
          .sort((a, b) => a.order - b.order)
          .map((s) => (
            <li key={`${phase.phase}-${s.order}`} className="flex flex-wrap items-center gap-2">
              <span>
                {s.order}. {s.label}
                {s.assignedUserName ? ` (${s.assignedUserName})` : ''}
              </span>
              <Badge variant={s.status === 'approved' ? 'default' : 'outline'}>
                {stepStatusLabel[s.status] ?? s.status}
              </Badge>
            </li>
          ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-6 text-sm">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">وضعیت:</span>
          <Badge className={statusClass}>{statusLabel}</Badge>
        </div>
        <Alert>
          <AlertTitle>مرحله جاری</AlertTitle>
          <AlertDescription>{formatPurchaseRequestStage(request.status)}</AlertDescription>
        </Alert>
        {approvalHistory ? (
          <WorkflowApprovalPlanTimeline history={approvalHistory} />
        ) : (
          <>
            {request.workflowProgress?.[0]?.phase === 'purchase' &&
            request.workflowProgress[0]?.steps?.length ? (
              renderPhaseProgress(request.workflowProgress[0], 'جریان کار درخواست خرید کالا')
            ) : (
              <>
                {phase1?.steps?.length
                  ? renderPhaseProgress(phase1, 'پیشرفت تأیید درخواست خرید')
                  : null}
                {phase2?.steps?.length
                  ? renderPhaseProgress(phase2, 'پیشرفت تأیید پیش‌فاکتور')
                  : null}
              </>
            )}
          </>
        )}
        {phase1?.instanceStatus === 'approved' && request.status === 'pending' ? (
          <p className="text-xs text-amber-700">
            گردش‌کار مرحله ۱ کامل است؛ با بستن و باز کردن جزئیات (یا رفرش) وضعیت به‌روز می‌شود.
          </p>
        ) : null}
        {(request.status === 'pending' || request.status === 'proforma_review') && pendingApprover ? (
          <p className="text-muted-foreground text-xs">
            منتظر تأیید در کارتابل: <strong>{pendingApprover}</strong>
            {' — '}
            <Link href="/dashboard/workflow/inbox" className="text-primary underline">
              کارهای من
            </Link>
          </p>
        ) : null}
        {request.warehouseName || request.warehouseId ? (
          <p>
            <strong>انبار:</strong>{' '}
            {request.warehouseName ?? `انبار #${request.warehouseId}`}
          </p>
        ) : null}
        {request.reason ? (
          <p>
            <strong>توضیح:</strong> {request.reason}
          </p>
        ) : null}
        {request.destinationWarehouseName || request.destinationWarehouseId ? (
          <p className="text-xs text-muted-foreground">
            <strong>انبار مقصد (گردش‌کار):</strong>{' '}
            {request.destinationWarehouseName ??
              `انبار #${request.destinationWarehouseId}`}
          </p>
        ) : null}
        {request.approvedPaymentMethod ? (
          <div className="space-y-1 text-xs">
            <p>
              <strong>روش پرداخت تأییدشده:</strong>{' '}
              {paymentMethodLabel(request.approvedPaymentMethod)}
              {request.approvedPaymentComment ? ` — ${request.approvedPaymentComment}` : ''}
            </p>
            {request.approvedPaymentLocation ? (
              <p>
                <strong>محل پرداخت:</strong>{' '}
                {paymentLocationLabel(request.approvedPaymentLocation)}
              </p>
            ) : null}
            {request.checkPlan && request.checkPlan.length > 0 ? (
              <div className="space-y-1">
                <p>
                  <strong>برنامه چک‌ها:</strong>
                </p>
                <ul className="list-disc pr-5">
                  {request.checkPlan.map((row, i) => (
                    <li key={`${row.dueDate}-${i}`}>
                      {formatAmount(row.amount, { unit: 'ریال' })} — سررسید {row.dueDate}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        {request.invoicePaidAt ? (
          <p className="text-xs text-green-700">
            <strong>پرداخت فاکتور:</strong> ثبت شده در{' '}
            {new Date(request.invoicePaidAt).toLocaleString('fa-IR')}
          </p>
        ) : null}
      </section>

      <section>
        <h4 className="font-medium mb-2">اقلام</h4>
        <ul className="list-disc pr-5 space-y-1">
          {request.items.map((li) => (
            <li key={li.id ?? li.itemName}>
              {li.itemName} — تعداد {li.quantity}
              {li.description ? ` (${li.description})` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="font-medium mb-2">پیش‌فاکتورها</h4>
        {proformas.length === 0 ? (
          <div className="space-y-2">
            <p className="text-muted-foreground">هنوز پیش‌فاکتوری ثبت نشده است.</p>
            {request.canUploadProforma ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                ثبت مبلغ و فایل پیش‌فاکتور از کارتابل (مرحلهٔ «ثبت پیش‌فاکتور») انجام می‌شود.
              </p>
            ) : request.status === 'pending' ? (
              <p className="text-xs text-muted-foreground">
                پس از اتمام تأییدهای قبلی، مسئول خرید از کارتابل پیش‌فاکتور را ثبت می‌کند.
              </p>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-4">
            {proformas.map((p) => {
              const fileUrl = (p.previewUrl || p.downloadUrl || '').trim();
              const attachmentId =
                p.attachmentId ?? (fileUrl ? extractAttachmentId(fileUrl) : null) ?? null;
              return (
                <li key={p.id} className="space-y-3 rounded border p-3">
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>مبلغ کل:</strong>{' '}
                      {formatAmount(p.totalAmount ?? p.amount, { unit: 'ریال' })}
                    </p>
                    <p>
                      <strong>وضعیت:</strong> {proformaStatusLabel(p.status)}
                    </p>
                    {p.supplierName ? (
                      <p>
                        <strong>تأمین‌کننده:</strong> {p.supplierName}
                      </p>
                    ) : null}
                    {p.fileName ? (
                      <p className="text-muted-foreground">{p.fileName}</p>
                    ) : null}
                  </div>
                  {fileUrl ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">پیش‌نمایش فایل</p>
                      <RemoteAttachmentPreview
                        fileUrl={fileUrl}
                        fileName={p.fileName}
                        attachmentId={attachmentId}
                      />
                      <RequestAttachmentsPanel
                        title="مشاهده / دانلود"
                        attachments={[
                          {
                            id: attachmentId ?? p.id,
                            fileName: p.fileName ?? 'پیش‌فاکتور',
                            fileUrl,
                          },
                        ]}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700">فایل پیش‌فاکتور ثبت نشده است.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(request.invoices?.length ?? 0) > 0 ? (
        <section>
          <h4 className="font-medium mb-2">فاکتورهای بارگذاری‌شده</h4>
          <ul className="space-y-1">
            {request.invoices?.map((inv) => (
              <li key={inv.id ?? inv.fileName}>
                {inv.downloadUrl || inv.fileUrl ? (
                  <Link
                    href={inv.downloadUrl ?? inv.fileUrl ?? '#'}
                    target="_blank"
                    className="text-primary underline"
                  >
                    {inv.fileName ?? 'دانلود فاکتور'}
                  </Link>
                ) : (
                  <span>{inv.fileName ?? 'فاکتور'}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : request.status === 'awaiting_invoice' || request.canUploadProforma === false ? (
        <p className="text-xs text-muted-foreground rounded border p-2">
          بارگذاری فاکتور از کارتابل (مرحلهٔ «بارگذاری فاکتور») انجام می‌شود.
        </p>
      ) : null}

      {canMarkInvoicePaid ? (
        <section className="space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/40 p-4">
          <h4 className="font-medium">ثبت پرداخت فاکتور (مدیر مالی)</h4>
          <p className="text-xs text-muted-foreground">
            پس از بررسی فاکتور و انجام پرداخت طبق شرایط تأییدشده، دکمه زیر را بزنید.
          </p>
          <Button disabled={busy} onClick={() => void onMarkInvoicePaid()}>
            تأیید پرداخت فاکتور
          </Button>
        </section>
      ) : null}

      <RelatedRequestsPanel refType="purchase_request" refId={requestId} />

      <PurchaseRequestPaymentPanel request={request} onUpdated={() => void reload()} />

      <GoodsReceiptPanel request={request} onUpdated={() => void reload()} />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import {
  getPurchaseProformasAction,
  getPurchaseRequestAction,
  markPurchaseInvoicePaidAction,
  submitPurchaseProformaAction,
  uploadPurchaseInvoiceAction,
  uploadPurchaseProformaAction,
} from '@/app/_actions/purchase-request-actions';
import { paymentMethodLabel } from '@/app/dashboard/payment-request/_utils/payment-method';
import { isFinanceRole } from '@/app/dashboard/payment-request/_utils/payment-request-roles';
import { useSessionStore } from '@/app/_store/auth-store';
import { getSuppliersAction } from '@/app/_actions/supplier-actions';
import { getWorkflowApprovalHistoryAction } from '@/app/_actions/workflow-runtime-actions';
import { WorkflowApprovalPlanTimeline } from '@/app/dashboard/workflow/inbox/_components/workflow-approval-plan';
import type { WorkflowApprovalHistory } from '@/app/_types/workflow-approval-plan.types';
import type { PurchaseProforma, PurchaseRequest } from '@/app/_types/purchase-request.types';
import type { Supplier } from '@/app/_types/supplier.types';
import { useToast } from '@/hooks/use-toast';
import { formatAmount } from '@/app/utils/number-format';
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

const PURCHASE_MANAGER_ROLES = ['purchase_manager', 'purchase_officer', 'مسئول خرید'];

function isPurchaseManagerRole(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  const lower = roles.map((r) => r.trim().toLowerCase());
  return PURCHASE_MANAGER_ROLES.some((alias) =>
    lower.some((r) => r === alias || r.includes(alias)),
  );
}

export function PurchaseRequestDetailPanel({ requestId, onUpdated }: Props) {
  const { toast } = useToast();
  const session = useSessionStore((s) => s.session);
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [proformas, setProformas] = useState<PurchaseProforma[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingApprover, setPendingApprover] = useState<string | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<WorkflowApprovalHistory | null>(null);

  const reload = useCallback(async () => {
    const [reqRes, pfRes, supRes] = await Promise.all([
      getPurchaseRequestAction(requestId),
      getPurchaseProformasAction(requestId),
      getSuppliersAction({ page: 1, pageSize: 100, activeOnly: true }),
    ]);
    if (reqRes.success && reqRes.data) {
      setRequest(reqRes.data);
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
    if (supRes.success && supRes.data?.items) setSuppliers(supRes.data.items);
  }, [requestId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const canUploadProforma =
    request?.status === 'awaiting_proforma' || request?.status === 'proforma_review';

  const canUploadInvoice =
    request?.status === 'awaiting_invoice' && isPurchaseManagerRole(session?.roles);

  const canMarkInvoicePaid =
    request?.status === 'awaiting_invoice' &&
    !request?.invoicePaidAt &&
    isFinanceRole(session?.roles);

  const onUpload = async () => {
    if (!file || !supplierId || !amount) {
      toast({ title: 'خطا', description: 'تأمین‌کننده، مبلغ و فایل الزامی است', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const res = await uploadPurchaseProformaAction(requestId, {
      supplierId: Number(supplierId),
      amount: Number(amount),
      notes: notes.trim() || undefined,
      file,
    });
    setBusy(false);
    if (!res.success) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'پیش‌فاکتور ثبت شد' });
    setFile(null);
    setAmount('');
    setNotes('');
    await reload();
    onUpdated?.();
  };

  const onUploadInvoice = async () => {
    if (!invoiceFile) {
      toast({ title: 'خطا', description: 'فایل فاکتور را انتخاب کنید', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const res = await uploadPurchaseInvoiceAction(requestId, invoiceFile);
    setBusy(false);
    if (!res.success) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'فاکتور بارگذاری شد؛ به مدیر مالی اطلاع داده شد' });
    setInvoiceFile(null);
    await reload();
    onUpdated?.();
  };

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

  const onSubmitProforma = async (proformaId: number) => {
    setBusy(true);
    const res = await submitPurchaseProformaAction(requestId, proformaId);
    setBusy(false);
    if (!res.success) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'پیش‌فاکتور برای تأیید ارسال شد' });
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
        {request.reason ? (
          <p>
            <strong>توضیح:</strong> {request.reason}
          </p>
        ) : null}
        {request.approvedPaymentMethod ? (
          <p className="text-xs">
            <strong>روش پرداخت تأییدشده:</strong>{' '}
            {paymentMethodLabel(request.approvedPaymentMethod)}
            {request.approvedPaymentComment ? ` — ${request.approvedPaymentComment}` : ''}
          </p>
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
            {request.status === 'pending' ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                فرم ثبت پیش‌فاکتور بعد از اتمام تأییدهای مرحله ۱ (مدیر مالی، مدیرعامل) در همین
                بخش ظاهر می‌شود. اگر همه را در کارتابل تأیید کرده‌اید ولی وضعیت هنوز «در انتظار
                تأیید» است، صفحه را رفرش کنید یا به پشتیبان اطلاع دهید.
              </p>
            ) : null}
            {request.status === 'awaiting_proforma' ? (
              <p className="text-xs text-primary">
                اکنون مسئول خرید می‌تواند پیش‌فاکتور را در فرم زیر ثبت کند.
              </p>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-2">
            {proformas.map((p) => (
              <li key={p.id} className="rounded border p-2 flex flex-wrap justify-between gap-2">
                <span>
                  {p.supplierName ?? `تأمین‌کننده #${p.supplierId}`} — {formatAmount(p.amount)} —{' '}
                  {p.status}
                </span>
                <span className="flex gap-2">
                  {p.downloadUrl ? (
                    <Link href={p.downloadUrl} target="_blank" className="text-primary underline">
                      دانلود
                    </Link>
                  ) : null}
                  {p.status === 'draft' && request.status === 'awaiting_proforma' ? (
                    <Button size="sm" disabled={busy} onClick={() => void onSubmitProforma(p.id)}>
                      ارسال برای تأیید
                    </Button>
                  ) : null}
                </span>
              </li>
            ))}
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
      ) : null}

      {canUploadInvoice ? (
        <section className="space-y-3 rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-4">
          <h4 className="font-medium text-primary">بارگذاری فاکتور (مسئول خرید)</h4>
          <p className="text-xs text-muted-foreground">
            پس از تأیید مدیرعامل و تعیین روش پرداخت، فاکتور نهایی را آپلود کنید.
          </p>
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
          />
          <Button disabled={busy} onClick={() => void onUploadInvoice()}>
            آپلود فاکتور
          </Button>
        </section>
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

      {canUploadProforma ? (
        <section className="space-y-3 rounded-lg border border-sky-200/80 bg-sky-50/40 p-4 dark:border-sky-900/40">
          <h4 className="font-medium text-primary">ثبت پیش‌فاکتور (مسئول خرید)</h4>
          <p className="text-xs text-muted-foreground">
            فایل پیش‌فاکتور از تأمین‌کننده + مبلغ پیشنهادی. پس از ذخیره، دکمه «ارسال برای تأیید» را
            بزنید تا در کارتابل مدیرعامل برود.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>تأمین‌کننده</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>مبلغ پیشنهادی (ریال)</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={1} />
            </div>
            <div className="sm:col-span-2">
              <Label>فایل پیش‌فاکتور</Label>
              <Input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="sm:col-span-2">
              <Label>یادداشت (اختیاری)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <Button disabled={busy} onClick={() => void onUpload()}>
            ذخیره پیش‌فاکتور
          </Button>
        </section>
      ) : null}

      <RelatedRequestsPanel refType="purchase_request" refId={requestId} />

      <PurchaseRequestPaymentPanel request={request} onUpdated={() => void reload()} />

      <GoodsReceiptPanel request={request} onUpdated={() => void reload()} />
    </div>
  );
}

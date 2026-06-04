'use client';

import { useEffect, useState } from 'react';
import { getPurchaseProformasAction } from '@/app/_actions/purchase-request-actions';
import { RequestAttachmentsPanel } from '@/app/components/attachments/request-attachments-panel';
import type { PurchaseProforma, PurchaseRequest } from '@/app/_types/purchase-request.types';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import {
  attachmentProxyDownloadPath,
  extractAttachmentId,
} from '@/app/utils/attachment-display.utils';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';

type Props = {
  record: PurchaseRequest;
  refType?: WorkflowBusinessRefType;
};

function pickProformaForApproval(proformas: PurchaseProforma[]): PurchaseProforma | null {
  const submitted = proformas.filter((p) => p.status === 'submitted' || p.status === 'approved');
  if (submitted.length) {
    return [...submitted].sort((a, b) => b.id - a.id)[0];
  }
  const withFile = proformas.filter((p) => p.downloadUrl || p.fileName);
  if (withFile.length) return withFile[0];
  return proformas[0] ?? null;
}

export function WorkflowPurchaseRequestReview({ record, refType = 'request' }: Props) {
  const isProformaWorkflow = refType === 'procurement_proforma';
  const [proformas, setProformas] = useState<PurchaseProforma[]>([]);
  const [loadingProforma, setLoadingProforma] = useState(isProformaWorkflow);

  useEffect(() => {
    if (!isProformaWorkflow) return;
    let cancelled = false;
    (async () => {
      setLoadingProforma(true);
      const res = await getPurchaseProformasAction(record.id);
      if (!cancelled) {
        if (res.success && res.data) setProformas(res.data);
        setLoadingProforma(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isProformaWorkflow, record.id]);

  const activeProforma = isProformaWorkflow ? pickProformaForApproval(proformas) : null;
  const attachmentId = activeProforma?.downloadUrl
    ? extractAttachmentId(activeProforma.downloadUrl)
    : null;
  const proformaFileUrl =
    activeProforma?.downloadUrl?.trim() ||
    (attachmentId ? attachmentProxyDownloadPath(attachmentId) : '');

  return (
    <div className="space-y-4 text-sm">
      <p>
        <strong>درخواست‌کننده:</strong> {record.requesterName ?? '—'}
      </p>
      {record.reason ? (
        <p>
          <strong>توضیح:</strong> {record.reason}
        </p>
      ) : null}
      <div>
        <strong>اقلام درخواست خرید:</strong>
        <ul className="list-disc pr-5 mt-1">
          {record.items.map((li) => (
            <li key={li.id ?? li.itemName}>
              {li.itemName} — {li.quantity} عدد
              {li.description ? ` (${li.description})` : ''}
            </li>
          ))}
        </ul>
      </div>

      {record.attachments && record.attachments.length > 0 ? (
        <RequestAttachmentsPanel
          title="پیوست‌های درخواست (ثبت اولیه)"
          attachments={record.attachments}
        />
      ) : null}

      {(record.invoices?.length ?? 0) > 0 ? (
        <section className="space-y-2 rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/40">
          <h4 className="font-semibold text-primary">فاکتور بارگذاری‌شده (مسئول خرید)</h4>
          <p className="text-xs text-muted-foreground">
            فایل زیر توسط مسئول خرید در مرحله بارگذاری فاکتور ثبت شده است. لطفاً قبل از ثبت
            پرداخت، فاکتور را بررسی کنید.
          </p>
          <RequestAttachmentsPanel
            title="فایل فاکتور"
            attachments={(record.invoices ?? []).map((inv) => ({
              id: inv.id,
              fileName: inv.fileName ?? 'فاکتور.pdf',
              fileUrl:
                inv.downloadUrl?.trim() ||
                inv.fileUrl?.trim() ||
                (inv.id ? attachmentProxyDownloadPath(inv.id) : ''),
            }))}
          />
          {record.approvedPaymentMethod ? (
            <p className="text-xs">
              <strong>روش پرداخت تأییدشده:</strong> {record.approvedPaymentMethod}
              {record.approvedPaymentComment ? ` — ${record.approvedPaymentComment}` : ''}
            </p>
          ) : null}
        </section>
      ) : refType === 'purchase_request' &&
        (record.status === 'awaiting_invoice' || record.status === 'completed') ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          هنوز فاکتوری بارگذاری نشده است. مسئول خرید باید از صفحه «درخواست‌های خرید» فاکتور را
          آپلود کند.
        </p>
      ) : null}

      {isProformaWorkflow ? (
        <section className="space-y-3 rounded-lg border border-sky-200/80 bg-sky-50/40 p-4 dark:border-sky-900/40">
          <h4 className="font-semibold text-primary">پیش‌فاکتور برای تأیید</h4>
          {loadingProforma ? (
            <p className="text-muted-foreground">در حال بارگذاری پیش‌فاکتور…</p>
          ) : activeProforma ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <p>
                  <strong>تأمین‌کننده:</strong> {activeProforma.supplierName ?? `#${activeProforma.supplierId}`}
                </p>
                <p>
                  <strong>مبلغ پیشنهادی:</strong> {formatAmount(activeProforma.amount)} ریال
                </p>
                <p>
                  <strong>وضعیت:</strong> {activeProforma.status}
                </p>
                {activeProforma.createdAt ? (
                  <p>
                    <strong>تاریخ ثبت:</strong> {formatJalaliDate(activeProforma.createdAt)}
                  </p>
                ) : null}
              </div>
              {activeProforma.notes ? (
                <p>
                  <strong>یادداشت:</strong> {activeProforma.notes}
                </p>
              ) : null}
              {proformaFileUrl ? (
                <RequestAttachmentsPanel
                  title="فایل پیش‌فاکتور"
                  attachments={[
                    {
                      id: attachmentId ?? activeProforma.id,
                      fileName: activeProforma.fileName ?? 'پیش‌فاکتور.pdf',
                      fileUrl: proformaFileUrl,
                    },
                  ]}
                />
              ) : (
                <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 text-xs">
                  فایل پیوست پیش‌فاکتور در سیستم ثبت نشده است.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                لطفاً فایل پیش‌فاکتور را مشاهده کنید؛ سپس در صورت تأیید، دکمه «تأیید» را بزنید.
              </p>
            </>
          ) : (
            <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 text-xs">
              فایل پیش‌فاکتور یافت نشد. از مسئول خرید بخواهید پیش‌فاکتور را در صفحه درخواست‌های خرید
              ثبت و «ارسال برای تأیید» کند.
            </p>
          )}
        </section>
      ) : (
        <p className="text-muted-foreground">
          پس از تأیید نهایی درخواست، مسئول خرید می‌تواند پیش‌فاکتور را در صفحه درخواست‌های خرید ثبت کند.
        </p>
      )}
    </div>
  );
}

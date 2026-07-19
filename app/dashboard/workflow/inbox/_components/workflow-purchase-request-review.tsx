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
  void refType;
  const [proformas, setProformas] = useState<PurchaseProforma[]>([]);
  const [loadingProforma, setLoadingProforma] = useState(true);

  useEffect(() => {
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
  }, [record.id]);

  const activeProforma = pickProformaForApproval(proformas);
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
      <div className="space-y-2">
        <strong>اقلام درخواست خرید:</strong>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[24rem] text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-right font-medium">نام کالا</th>
                <th className="px-3 py-2 text-right font-medium">تعداد</th>
                <th className="px-3 py-2 text-right font-medium">موجودی انبار</th>
              </tr>
            </thead>
            <tbody>
              {record.items.map((li) => (
                <tr key={li.id ?? li.itemName} className="border-t">
                  <td className="px-3 py-2">
                    {li.itemName}
                    {li.description ? (
                      <span className="block text-xs text-muted-foreground">{li.description}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{li.quantity}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {li.stockOnHand != null ? li.stockOnHand : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <div className="space-y-1 text-xs">
              <p>
                <strong>روش پرداخت تأییدشده:</strong> {record.approvedPaymentMethod}
                {record.approvedPaymentComment ? ` — ${record.approvedPaymentComment}` : ''}
              </p>
              {record.approvedPaymentLocation ? (
                <p>
                  <strong>محل پرداخت:</strong> {record.approvedPaymentLocation}
                </p>
              ) : null}
              {record.approvedCheckNumber ? (
                <p>
                  <strong>شماره چک:</strong> {record.approvedCheckNumber}
                  {record.approvedCheckBank ? ` — ${record.approvedCheckBank}` : ''}
                  {record.approvedCheckDueDate ? ` — سررسید ${record.approvedCheckDueDate}` : ''}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : refType === 'purchase_request' &&
        (record.status === 'awaiting_invoice' || record.status === 'completed') ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          هنوز فاکتوری بارگذاری نشده است. مسئول خرید باید از صفحه «درخواست‌های خرید» فاکتور را
          آپلود کند.
        </p>
      ) : null}

      {(record.bolAttachments?.length ?? 0) > 0 ? (
        <RequestAttachmentsPanel
          title="بارنامه"
          attachments={(record.bolAttachments ?? []).map((a) => ({
            id: a.id,
            fileName: a.fileName ?? 'بارنامه.pdf',
            fileUrl:
              a.downloadUrl?.trim() ||
              a.fileUrl?.trim() ||
              (a.id ? attachmentProxyDownloadPath(a.id) : ''),
          }))}
        />
      ) : null}

      {activeProforma || loadingProforma ? (
        <section className="space-y-3 rounded-lg border border-sky-200/80 bg-sky-50/40 p-4 dark:border-sky-900/40">
          <h4 className="font-semibold text-primary">پیش‌فاکتور</h4>
          {loadingProforma ? (
            <p className="text-muted-foreground">در حال بارگذاری پیش‌فاکتور…</p>
          ) : activeProforma ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <p>
                  <strong>تأمین‌کننده:</strong>{' '}
                  {activeProforma.supplierName ?? `#${activeProforma.supplierId}`}
                </p>
                <p>
                  <strong>مبلغ کل پیش‌فاکتور:</strong> {formatAmount(activeProforma.amount)} ریال
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
                <p className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  فایل پیوست پیش‌فاکتور در سیستم ثبت نشده است.
                </p>
              )}
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

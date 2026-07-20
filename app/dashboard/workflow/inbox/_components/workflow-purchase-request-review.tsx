'use client';

import { useEffect, useState } from 'react';
import { getPurchaseProformasAction } from '@/app/_actions/purchase-request-actions';
import { RequestAttachmentsPanel } from '@/app/components/attachments/request-attachments-panel';
import { RemoteAttachmentPreview } from '@/app/components/attachments/attachment-inline-preview';
import type { PurchaseProforma, PurchaseRequest } from '@/app/_types/purchase-request.types';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import {
  attachmentProxyDownloadPath,
  extractAttachmentId,
} from '@/app/utils/attachment-display.utils';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import {
  paymentLocationLabel,
  paymentMethodLabel,
} from '@/app/dashboard/payment-request/_utils/payment-method';

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

  const hasCeoPaymentTerms = Boolean(
    record.approvedPaymentMethod ||
      record.approvedPaymentLocation ||
      (record.checkPlan && record.checkPlan.length > 0),
  );

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

      {hasCeoPaymentTerms ? (
        <section className="space-y-2 rounded-lg border border-violet-200/80 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/30">
          <h4 className="font-semibold text-primary">شرایط پرداخت (تأیید مدیرعامل)</h4>
          <div className="space-y-1 text-sm">
            {record.approvedPaymentMethod ? (
              <p>
                <strong>روش پرداخت:</strong> {paymentMethodLabel(record.approvedPaymentMethod)}
                {record.approvedPaymentComment ? ` — ${record.approvedPaymentComment}` : ''}
              </p>
            ) : null}
            {record.approvedPaymentLocation ? (
              <p>
                <strong>محل پرداخت:</strong>{' '}
                {paymentLocationLabel(record.approvedPaymentLocation)}
              </p>
            ) : null}
            {record.checkPlan && record.checkPlan.length > 0 ? (
              <div className="space-y-1">
                <p>
                  <strong>برنامه چک‌ها:</strong>
                </p>
                <ul className="list-disc pr-5 text-xs">
                  {record.checkPlan.map((row, i) => (
                    <li key={`${row.dueDate}-${i}`}>
                      چک {i + 1}: {formatAmount(row.amount, { unit: 'ریال' })} — سررسید{' '}
                      {formatJalaliDate(row.dueDate)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {(record.invoices?.length ?? 0) > 0 ? (
        <section className="space-y-2 rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/40">
          <h4 className="font-semibold text-primary">فاکتور بارگذاری‌شده</h4>
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
        </section>
      ) : record.status === 'awaiting_invoice' ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          هنوز فاکتوری بارگذاری نشده است. مسئول خرید از کارتابل فایل فاکتور را ثبت می‌کند.
        </p>
      ) : null}

      {(record.paymentSlips?.length ?? 0) > 0 ? (
        <section className="space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40">
          <h4 className="font-semibold text-primary">فیش / چک پرداخت</h4>
          <RequestAttachmentsPanel
            title="فایل‌های فیش واریزی"
            attachments={(record.paymentSlips ?? []).map((slip) => ({
              id: slip.id,
              fileName: slip.fileName ?? 'فیش.pdf',
              fileUrl:
                slip.downloadUrl?.trim() ||
                slip.fileUrl?.trim() ||
                (slip.id ? attachmentProxyDownloadPath(slip.id) : ''),
            }))}
          />
        </section>
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
                {activeProforma.supplierName ? (
                  <p>
                    <strong>تأمین‌کننده:</strong> {activeProforma.supplierName}
                  </p>
                ) : null}
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
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">پیش‌نمایش فایل</p>
                  <RemoteAttachmentPreview
                    fileUrl={proformaFileUrl}
                    fileName={activeProforma.fileName}
                    attachmentId={attachmentId}
                  />
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
                </div>
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

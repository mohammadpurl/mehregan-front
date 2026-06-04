'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { RequestAttachmentsPanel } from '@/app/components/attachments/request-attachments-panel';
import { getGrnAction, postGrnAction, uploadGrnInvoiceAction } from '@/app/_actions/grn-actions';
import type { Grn } from '@/app/_types/grn.types';
import { useFormAction } from '@/app/hooks/use-form-action';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { grnStatusLabels } from '../../_utils/grn-status-labels';

type Props = {
  grnId: number;
  onUpdated?: () => void;
};

export function GrnDetailPanel({ grnId, onUpdated }: Props) {
  const { notifyError, notifySuccess } = useFormAction();
  const [grn, setGrn] = useState<Grn | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const res = await getGrnAction(grnId);
    if (res.success && res.data) setGrn(res.data);
    else notifyError(res.error || 'رسید یافت نشد');
  }, [grnId, notifyError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onUploadInvoice = async () => {
    if (!grn || !file) {
      notifyError('فایل فاکتور خرید را انتخاب کنید');
      return;
    }
    setBusy(true);
    const res = await uploadGrnInvoiceAction(grn.id, file);
    setBusy(false);
    if (!res.success) {
      notifyError(res.error || 'خطا در آپلود فاکتور');
      return;
    }
    notifySuccess('فاکتور ضمیمه شد');
    setGrn(res.data);
    setFile(null);
    onUpdated?.();
  };

  const onPost = async () => {
    if (!grn) return;
    setBusy(true);
    const res = await postGrnAction(grn.id);
    setBusy(false);
    if (!res.success) {
      notifyError(res.error || 'خطا در ثبت نهایی رسید');
      return;
    }
    notifySuccess('ورود به انبار انجام شد');
    setGrn(res.data);
    onUpdated?.();
  };

  if (!grn) return <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>;

  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <p>
          <strong>شماره رسید:</strong> {grn.grnNo ?? grn.id}
        </p>
        <p>
          <strong>وضعیت:</strong> {grnStatusLabels[grn.status] ?? grn.status}
        </p>
        <p>
          <strong>درخواست خرید:</strong>{' '}
          <Link
            href={`/dashboard/procurement/requests?requestId=${grn.requestId}`}
            className="text-primary underline"
          >
            #{grn.requestId}
          </Link>
        </p>
        <p>
          <strong>تأمین‌کننده:</strong> {grn.supplierName ?? '—'}
        </p>
        <p>
          <strong>انبار:</strong> {grn.warehouseName ?? '—'}
        </p>
        <p>
          <strong>تاریخ رسید:</strong>{' '}
          {grn.receiptDate ? formatJalaliDate(grn.receiptDate) : grn.createdAt ? formatJalaliDate(grn.createdAt) : '—'}
        </p>
          </div>

      {grn.invoiceNotes ? (
        <p>
          <strong>یادداشت فاکتور:</strong> {grn.invoiceNotes}
        </p>
      ) : null}

      <div>
        <strong>اقلام دریافتی:</strong>
        <ul className="list-disc pr-5 mt-1">
          {grn.lines.map((li) => (
            <li key={li.id ?? `${li.itemId}-${li.quantityReceived}`}>
              {li.itemName ?? `کالا #${li.itemId}`} — {li.quantityReceived} عدد
            </li>
          ))}
        </ul>
          </div>

      {grn.downloadUrl || grn.fileName ? (
        <RequestAttachmentsPanel
          title="فاکتور خرید"
          attachments={[
            {
              id: grn.id,
              fileName: grn.fileName ?? 'فاکتور-خرید.pdf',
              fileUrl: grn.downloadUrl ?? '',
            },
          ]}
        />
      ) : null}

      {grn.status === 'draft' ? (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div>
            <Label>فایل فاکتور خرید</Label>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
              </div>
          <Button type="button" variant="secondary" disabled={busy || !file} onClick={() => void onUploadInvoice()}>
            ضمیمه فاکتور
          </Button>
          <Button type="button" disabled={busy} onClick={() => void onPost()}>
            ثبت نهایی و ورود به انبار
          </Button>
        </div>
      ) : grn.status === 'posted' ? (
        <p className="text-green-700 text-sm">رسید ثبت نهایی شده و موجودی به‌روز شده است.</p>
      ) : null}
        </div>
  );
}

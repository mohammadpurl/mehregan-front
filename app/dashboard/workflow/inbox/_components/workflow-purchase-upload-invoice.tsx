'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { RequiredMark } from '@/app/components/ui/required-mark';
import {
  LocalFileInlinePreview,
  RemoteAttachmentPreview,
} from '@/app/components/attachments/attachment-inline-preview';
import { uploadPurchaseInvoiceAction } from '@/app/_actions/purchase-request-actions';
import type { PurchaseRequest } from '@/app/_types/purchase-request.types';
import {
  attachmentProxyDownloadPath,
  extractAttachmentId,
} from '@/app/utils/attachment-display.utils';

export type WorkflowPurchaseUploadInvoiceHandle = {
  /** آپلود فاکتور — مرحله گردش‌کار را کامل می‌کند */
  submitInvoice: () => Promise<{ ok: true } | { ok: false; error: string }>;
};

type Props = {
  record: PurchaseRequest;
};

export const WorkflowPurchaseUploadInvoice = forwardRef<
  WorkflowPurchaseUploadInvoiceHandle,
  Props
>(function WorkflowPurchaseUploadInvoice({ record }, ref) {
  const [file, setFile] = useState<File | null>(null);
  const existing = record.invoices?.[0] ?? null;
  const existingUrl =
    (existing?.downloadUrl || existing?.fileUrl || '').trim() ||
    (existing?.id ? attachmentProxyDownloadPath(existing.id) : '');

  useImperativeHandle(ref, () => ({
    submitInvoice: async () => {
      if (existing && !file) {
        return {
          ok: false as const,
          error: 'فاکتور قبلاً بارگذاری شده است؛ صفحه را تازه کنید.',
        };
      }
      if (!file) {
        return { ok: false as const, error: 'فایل فاکتور را انتخاب کنید' };
      }
      const up = await uploadPurchaseInvoiceAction(record.id, file);
      if (!up.success) {
        return { ok: false as const, error: up.error ?? 'آپلود فاکتور ناموفق بود' };
      }
      return { ok: true as const };
    },
  }));

  return (
    <div className="space-y-4 rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
      <div>
        <p className="text-sm font-medium">بارگذاری فاکتور</p>
        <p className="mt-1 text-xs text-muted-foreground">
          فایل فاکتور رسمی را انتخاب کنید؛ با زدن «ثبت و ارسال» مرحله تکمیل و به کارشناس مالی
          می‌رود.
        </p>
      </div>

      {existing && !file ? (
        <div className="space-y-2 rounded-md border bg-background p-3 text-sm">
          <p className="text-xs text-muted-foreground">فاکتور ثبت‌شده</p>
          {existingUrl ? (
            <RemoteAttachmentPreview
              fileUrl={existingUrl}
              fileName={existing.fileName}
              attachmentId={
                existing.id ??
                (existingUrl ? extractAttachmentId(existingUrl) : null) ??
                null
              }
            />
          ) : (
            <p>{existing.fileName ?? 'فاکتور'}</p>
          )}
          <p className="text-xs text-amber-700">این مرحله انجام شده است؛ کارتابل را تازه کنید.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>
            فایل فاکتور
            <RequiredMark />
          </Label>
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-muted-foreground">پیش‌نمایش فایل انتخاب‌شده</p>
              <LocalFileInlinePreview file={file} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});

'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { RequiredMark } from '@/app/components/ui/required-mark';
import { FormattedNumberInput } from '@/app/components/ui/formatted-number-input';
import { Button } from '@/app/components/ui/button';
import {
  LocalFileInlinePreview,
  RemoteAttachmentPreview,
} from '@/app/components/attachments/attachment-inline-preview';
import {
  getPurchaseProformasAction,
  submitPurchaseProformaAction,
  updatePurchaseProformaAction,
  uploadPurchaseProformaAction,
} from '@/app/_actions/purchase-request-actions';
import type { PurchaseProforma, PurchaseRequest } from '@/app/_types/purchase-request.types';
import { formatAmount } from '@/app/utils/number-format';
import { extractAttachmentId } from '@/app/utils/attachment-display.utils';

export type WorkflowPurchaseUploadProformaHandle = {
  /** ثبت پیش‌فاکتور (در صورت نیاز) + ارسال برای تأیید — مرحله گردش‌کار را کامل می‌کند */
  submitProforma: () => Promise<{ ok: true } | { ok: false; error: string }>;
};

type Props = {
  record: PurchaseRequest;
};

const PROFORMA_STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  submitted: 'ارسال‌شده',
  approved: 'تأیید شده',
  rejected: 'رد شده',
};

export const WorkflowPurchaseUploadProforma = forwardRef<
  WorkflowPurchaseUploadProformaHandle,
  Props
>(function WorkflowPurchaseUploadProforma({ record }, ref) {
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [proformas, setProformas] = useState<PurchaseProforma[]>([]);
  const [loading, setLoading] = useState(true);

  const draft = proformas.find((p) => p.status === 'draft') ?? null;
  const submitted = proformas.find(
    (p) => p.status === 'submitted' || p.status === 'approved',
  );

  const reload = async () => {
    setLoading(true);
    const res = await getPurchaseProformasAction(record.id);
    if (res.success && res.data) {
      setProformas(res.data);
      const d = res.data.find((p) => p.status === 'draft');
      if (d?.amount) setAmount(d.amount);
      if (d?.notes) setNotes(d.notes);
    }
    setLoading(false);
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- فقط با تغییر درخواست
  }, [record.id]);

  useImperativeHandle(ref, () => ({
    submitProforma: async () => {
      if (submitted) {
        return {
          ok: false as const,
          error: 'پیش‌فاکتور قبلاً ارسال شده است؛ صفحه را تازه کنید.',
        };
      }

      if (!(amount > 0)) {
        return { ok: false as const, error: 'مبلغ کل پیش‌فاکتور را وارد کنید' };
      }

      let proformaId = draft?.id;
      const hasExistingFile = Boolean(
        (draft?.previewUrl || draft?.downloadUrl || draft?.attachmentId)?.toString().trim(),
      );

      if (!proformaId) {
        if (!file) {
          return { ok: false as const, error: 'فایل پیش‌فاکتور را انتخاب کنید' };
        }
        const up = await uploadPurchaseProformaAction(record.id, {
          amount,
          notes: notes.trim() || undefined,
          file,
        });
        if (!up.success || !up.data) {
          return { ok: false as const, error: up.error ?? 'آپلود پیش‌فاکتور ناموفق بود' };
        }
        proformaId = up.data.id;
      } else {
        if (!file && !hasExistingFile) {
          return { ok: false as const, error: 'فایل پیش‌فاکتور را انتخاب کنید' };
        }
        if (file || amount !== Number(draft?.amount) || notes.trim() !== (draft?.notes ?? '')) {
          const patched = await updatePurchaseProformaAction(record.id, proformaId, {
            amount,
            notes: notes.trim() || undefined,
            file: file ?? undefined,
          });
          if (!patched.success) {
            return {
              ok: false as const,
              error: patched.error ?? 'به‌روزرسانی پیش‌فاکتور ناموفق بود',
            };
          }
        }
      }

      if (!proformaId) {
        return { ok: false as const, error: 'پیش‌فاکتور یافت نشد' };
      }

      const sub = await submitPurchaseProformaAction(record.id, proformaId);
      if (!sub.success) {
        return { ok: false as const, error: sub.error ?? 'ارسال پیش‌فاکتور ناموفق بود' };
      }
      return { ok: true as const };
    },
  }));

  const draftPreviewUrl = (draft?.previewUrl || draft?.downloadUrl || '').trim();
  const draftAttachmentId =
    draft?.attachmentId ??
    (draftPreviewUrl ? extractAttachmentId(draftPreviewUrl) : null) ??
    null;

  return (
    <div className="space-y-4 rounded-lg border border-sky-200/80 bg-sky-50/40 p-4 dark:border-sky-900/40 dark:bg-sky-950/30">
      <div>
        <p className="text-sm font-medium">ثبت پیش‌فاکتور</p>
        <p className="mt-1 text-xs text-muted-foreground">
          مبلغ کل و فایل را وارد کنید؛ با زدن «تأیید / ارسال» پیش‌فاکتور ثبت و برای مدیرعامل ارسال
          می‌شود.
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>
      ) : null}

      {submitted ? (
        <div className="space-y-2 rounded-md border bg-background p-3 text-sm">
          <p>
            <strong>وضعیت:</strong>{' '}
            {PROFORMA_STATUS_LABELS[submitted.status] ?? submitted.status}
          </p>
          <p>
            <strong>مبلغ کل:</strong>{' '}
            {formatAmount(submitted.totalAmount ?? submitted.amount, { unit: 'ریال' })}
          </p>
          {(submitted.previewUrl || submitted.downloadUrl) && (
            <RemoteAttachmentPreview
              fileUrl={(submitted.previewUrl || submitted.downloadUrl)!}
              fileName={submitted.fileName}
              attachmentId={submitted.attachmentId}
            />
          )}
          <p className="text-xs text-amber-700">
            این مرحله انجام شده است؛ کارتابل را تازه کنید.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 sm:max-w-sm">
            <Label>
              مبلغ کل پیش‌فاکتور (ریال)
              <RequiredMark />
            </Label>
            <FormattedNumberInput
              value={amount}
              onChange={setAmount}
              min={0}
              placeholder="مثلاً ۱٬۲۵۰٬۰۰۰"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>
              فایل پیش‌فاکتور
              {!draft ? <RequiredMark /> : null}
            </Label>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">پیش‌نمایش فایل انتخاب‌شده</p>
                <LocalFileInlinePreview file={file} />
              </div>
            ) : draftPreviewUrl ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  پیش‌نمایش پیش‌نویس ثبت‌شده
                  {draft?.fileName ? ` (${draft.fileName})` : ''}
                </p>
                <RemoteAttachmentPreview
                  fileUrl={draftPreviewUrl}
                  fileName={draft?.fileName}
                  attachmentId={draftAttachmentId}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void reload()}
                >
                  بروزرسانی پیش‌نمایش
                </Button>
              </div>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <Label>یادداشت (اختیاری)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
});

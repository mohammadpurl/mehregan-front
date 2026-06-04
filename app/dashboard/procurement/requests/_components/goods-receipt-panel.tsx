'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  createGrnAction,
  getGrnAction,
  getGrnsAction,
  getGrnWarehousesAction,
  postGrnAction,
  uploadGrnInvoiceAction,
} from '@/app/_actions/grn-actions';
import type { PurchaseRequest } from '@/app/_types/purchase-request.types';
import type { Grn } from '@/app/_types/grn.types';
import { useToast } from '@/hooks/use-toast';

type Props = {
  request: PurchaseRequest;
  onUpdated?: () => void;
};

export function GoodsReceiptPanel({ request, onUpdated }: Props) {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [grn, setGrn] = useState<Grn | null>(null);
  const [busy, setBusy] = useState(false);

  const canStart = request.status === 'receiving' || request.status === 'completed';

  const reload = useCallback(async () => {
    const list = await getGrnsAction({ requestId: request.id, pageSize: 5 });
    if (list.success && list.data?.items?.length) {
      const draft = list.data.items.find((g) => g.status === 'draft') ?? list.data.items[0];
      const detail = await getGrnAction(draft.id);
      if (detail.success && detail.data) setGrn(detail.data);
    } else {
      setGrn(null);
    }
  }, [request.id]);

  useEffect(() => {
    void (async () => {
      const wh = await getGrnWarehousesAction();
      if (wh.success && wh.data) setWarehouses(wh.data);
    })();
    void reload();
  }, [reload]);

  const onCreateDraft = async () => {
    if (!warehouseId) {
      toast({ title: 'خطا', description: 'انبار مقصد را انتخاب کنید', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const res = await createGrnAction({
      requestId: request.id,
      warehouseId: Number(warehouseId),
      invoiceNotes: invoiceNotes.trim() || undefined,
      lines: request.items.map((li) => ({
        requestItemId: li.id,
        itemName: li.itemName,
        quantityReceived: li.quantity,
      })),
    });
    setBusy(false);
    if (!res.success) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'رسید پیش‌نویس ایجاد شد' });
    setGrn(res.data);
    onUpdated?.();
  };

  const onUploadInvoice = async () => {
    if (!grn || !file) {
      toast({ title: 'خطا', description: 'فایل فاکتور خرید را انتخاب کنید', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const res = await uploadGrnInvoiceAction(grn.id, file);
    setBusy(false);
    if (!res.success) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'فاکتور ضمیمه شد' });
    setGrn(res.data);
    setFile(null);
  };

  const onPost = async () => {
    if (!grn) return;
    setBusy(true);
    const res = await postGrnAction(grn.id);
    setBusy(false);
    if (!res.success) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'کالا به انبار وارد شد' });
    setGrn(res.data);
    onUpdated?.();
  };

  if (!canStart && !grn) {
    return (
      <p className="text-sm text-muted-foreground">
        رسید انبار پس از تأیید درخواست پرداخت در کارتابل مالی (وضعیت «در حال دریافت انبار») فعال می‌شود.
      </p>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-sky-200/80 bg-sky-50/40 p-4 dark:border-sky-900/40">
      <div>
        <h4 className="font-medium">رسید انبار — فاکتور خرید</h4>
        <p className="text-xs text-muted-foreground mt-1">
          ورود کالا به انبار فقط پس از تحویل و با ضمیمه فاکتور خرید انجام می‌شود (نه از پیش‌فاکتور).
        </p>
      </div>

      {!grn ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>انبار مقصد</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب انبار" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>یادداشت فاکتور (اختیاری)</Label>
            <Input value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} />
          </div>
          <Button disabled={busy || !canStart} onClick={() => void onCreateDraft()}>
            ایجاد رسید پیش‌نویس
          </Button>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p>
            <strong>شماره رسید:</strong> {grn.grnNo ?? grn.id} — <strong>وضعیت:</strong> {grn.status}
          </p>
          <ul className="list-disc pr-5">
            {grn.lines.map((li) => (
              <li key={li.id ?? li.itemId}>
                {li.itemName} — {li.quantityReceived} عدد
              </li>
            ))}
          </ul>

          {grn.status === 'draft' ? (
            <>
              <div>
                <Label>فایل فاکتور خرید</Label>
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {grn.fileName ? (
                  <p className="text-xs mt-1">
                    فایل فعلی:{' '}
                    {grn.downloadUrl ? (
                      <Link href={grn.downloadUrl} target="_blank" className="text-primary underline">
                        {grn.fileName}
                      </Link>
                    ) : (
                      grn.fileName
                    )}
                  </p>
                ) : null}
                <Button className="mt-2" variant="secondary" disabled={busy} onClick={() => void onUploadInvoice()}>
                  ضمیمه فاکتور
                </Button>
              </div>
              <Button disabled={busy} onClick={() => void onPost()}>
                ثبت نهایی و ورود به انبار
              </Button>
            </>
          ) : (
            <p className="text-green-700">رسید ثبت نهایی شده و موجودی به‌روز شده است.</p>
          )}

          <Button variant="link" className="px-0" asChild>
            <Link href={`/dashboard/procurement/grn?requestId=${request.id}`}>مشاهده در لیست رسیدها</Link>
          </Button>
        </div>
      )}
    </section>
  );
}

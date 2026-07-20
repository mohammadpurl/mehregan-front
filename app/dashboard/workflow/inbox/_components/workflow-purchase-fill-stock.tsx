'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { RequiredMark } from '@/app/components/ui/required-mark';
import {
  getPurchaseWarehouseCatalogAction,
  type PurchaseWarehouseCatalogItem,
} from '@/app/_actions/purchase-request-actions';
import { getGrnWarehousesAction } from '@/app/_actions/grn-actions';
import type { PurchaseRequest } from '@/app/_types/purchase-request.types';
import type { WorkflowApprovePayload } from '@/app/_actions/workflow-runtime-actions';

export type PurchaseStockUpdateItem = {
  id: number;
  warehouseStock: number;
};

export type WorkflowPurchaseFillStockHandle = {
  buildApprovePayload: () =>
    | {
        ok: true;
        payload: WorkflowApprovePayload;
        /** برای fill_stock — قبل از approve باید PATCH /stock شود */
        stockUpdates?: PurchaseStockUpdateItem[];
      }
    | { ok: false; error: string };
};

type FillStockProps = {
  record: PurchaseRequest;
  mode: 'fill_stock';
};

type WarehouseSepidarProps = {
  record: PurchaseRequest;
  mode: 'confirm_warehouse_sepidar';
  warehouseId: string;
  onWarehouseIdChange: (value: string) => void;
};

type Props = FillStockProps | WarehouseSepidarProps;

export const WorkflowPurchaseFillStock = forwardRef<
  WorkflowPurchaseFillStockHandle,
  Props
>(function WorkflowPurchaseFillStock(props, ref) {
  const { record, mode } = props;
  const [stocks, setStocks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const li of record.items) {
      const key = String(li.id ?? li.itemId ?? li.itemName);
      init[key] =
        li.stockOnHand != null && Number.isFinite(li.stockOnHand)
          ? String(li.stockOnHand)
          : '';
    }
    return init;
  });
  const [catalogByItemId, setCatalogByItemId] = useState<
    Record<number, PurchaseWarehouseCatalogItem>
  >({});
  const [catalogLoading, setCatalogLoading] = useState(mode === 'fill_stock');
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (mode !== 'fill_stock') return;
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      const res = await getPurchaseWarehouseCatalogAction(
        record.warehouseId != null && record.warehouseId > 0
          ? { warehouseId: record.warehouseId }
          : undefined,
      );
      if (cancelled) return;
      if (res.success && res.data?.items) {
        const map: Record<number, PurchaseWarehouseCatalogItem> = {};
        for (const item of res.data.items) {
          map[item.itemId] = item;
        }
        setCatalogByItemId(map);
        setStocks((prev) => {
          const next = { ...prev };
          for (const li of record.items) {
            const key = String(li.id ?? li.itemId ?? li.itemName);
            if (next[key]?.trim()) continue;
            if (li.itemId != null && map[li.itemId]) {
              next[key] = String(map[li.itemId]!.onHand);
            }
          }
          return next;
        });
      }
      setCatalogLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, record.items, record.warehouseId]);

  useEffect(() => {
    if (mode !== 'confirm_warehouse_sepidar') return;
    let cancelled = false;
    (async () => {
      const res = await getGrnWarehousesAction();
      if (!cancelled && res.success && res.data) setWarehouses(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useImperativeHandle(
    ref,
    () => ({
      buildApprovePayload: () => {
        if (mode === 'fill_stock') {
          const stockUpdates: PurchaseStockUpdateItem[] = [];
          for (const li of record.items) {
            const key = String(li.id ?? li.itemId ?? li.itemName);
            const raw = stocks[key]?.trim() ?? '';
            if (raw === '') {
              return {
                ok: false as const,
                error: `موجودی انبار برای «${li.itemName}» را وارد کنید`,
              };
            }
            const warehouseStock = Number(raw);
            if (!Number.isFinite(warehouseStock) || warehouseStock < 0) {
              return {
                ok: false as const,
                error: `موجودی انبار «${li.itemName}» نامعتبر است`,
              };
            }
            if (li.id == null || !Number.isFinite(Number(li.id))) {
              return {
                ok: false as const,
                error: `شناسه قلم «${li.itemName}» یافت نشد؛ صفحه را تازه کنید`,
              };
            }
            stockUpdates.push({ id: Number(li.id), warehouseStock });
          }
          if (stockUpdates.length === 0) {
            return { ok: false as const, error: 'اقلام خرید یافت نشد' };
          }
          // بک‌اند موجودی را از PATCH /stock می‌خواند، نه از body تأیید
          return { ok: true as const, payload: {}, stockUpdates };
        }

        const warehouseId = props.mode === 'confirm_warehouse_sepidar' ? props.warehouseId : '';
        const id = Number(warehouseId);
        if (!Number.isFinite(id) || id <= 0) {
          return { ok: false as const, error: 'انبار مقصد را انتخاب کنید' };
        }
        return { ok: true as const, payload: { warehouse_id: id } };
      },
    }),
    [mode, props, record.items, stocks],
  );

  if (mode === 'confirm_warehouse_sepidar') {
    return (
      <div className="space-y-3 rounded-lg border border-teal-200/80 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/30">
        <p className="text-sm font-medium">ورود به انبار مقصد</p>
        <p className="text-xs text-muted-foreground">
          انبار مقصد را انتخاب کنید؛ سپس تیک ثبت در سپیدار را بزنید و تأیید کنید.
        </p>
        <div className="space-y-1">
          <Label>
            انبار مقصد
            <RequiredMark />
          </Label>
          <Select
            value={props.warehouseId || undefined}
            onValueChange={props.onWarehouseIdChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب انبار" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={String(wh.id)}>
                  {wh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {record.destinationWarehouseName ? (
          <p className="text-xs text-muted-foreground">
            انبار قبلی ثبت‌شده: {record.destinationWarehouseName}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
      <p className="text-sm font-medium">جدول اقلام و موجودی انبار</p>
      <p className="text-xs text-muted-foreground">
        موجودی فعلی انبار را برای هر قلم بررسی و در صورت نیاز اصلاح کنید؛ سپس تأیید کنید.
      </p>
      {catalogLoading ? (
        <p className="text-xs text-muted-foreground">در حال بارگذاری موجودی انبار…</p>
      ) : null}
      <div className="overflow-x-auto rounded-md border bg-background">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-right font-medium">نام کالا</th>
              <th className="px-3 py-2 text-right font-medium">تعداد درخواستی</th>
              <th className="px-3 py-2 text-right font-medium">
                موجودی انبار
                <RequiredMark />
              </th>
            </tr>
          </thead>
          <tbody>
            {record.items.map((li) => {
              const key = String(li.id ?? li.itemId ?? li.itemName);
              const catalogHint =
                li.itemId != null && catalogByItemId[li.itemId]
                  ? catalogByItemId[li.itemId]!.onHand
                  : null;
              return (
                <tr key={key} className="border-t">
                  <td className="px-3 py-2">
                    <div>{li.itemName}</div>
                    {li.description ? (
                      <div className="text-xs text-muted-foreground">{li.description}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{li.quantity}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      className="h-9 w-28"
                      value={stocks[key] ?? ''}
                      onChange={(e) =>
                        setStocks((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      placeholder={catalogHint != null ? String(catalogHint) : '۰'}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

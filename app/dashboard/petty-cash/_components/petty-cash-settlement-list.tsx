'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { getPettyCashByIdAction, getPettyCashListAction } from '@/app/_actions/petty-cash-actions';
import type { PettyCashResponse } from '../_types/petty-cash.types';
import { canSettlePettyCash, isPettyCashSettled, sumExpenseLines } from '../_utils/petty-cash-mapper';
import { pettyCashSettlementLabel, pettyCashStatusLabel } from '../_utils/petty-cash-labels';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { PettyCashDetailPanel } from './petty-cash-detail-panel';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';

function needsSettlementView(record: PettyCashResponse): boolean {
  if (String(record.status).toLowerCase() !== 'approved') return false;
  return canSettlePettyCash(record) || !isPettyCashSettled(record);
}

export function PettyCashSettlementList() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('pettyCashId')?.trim() || '';
  const [items, setItems] = useState<PettyCashResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();
  const [detailOpen, setDetailOpen] = useState(Boolean(initialId));
  const [selected, setSelected] = useState<PettyCashResponse | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getPettyCashListAction({ page: 1, pageSize: 100 });
    if (result.success && result.data) {
      setItems(result.data.items.filter(needsSettlementView));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => startTransition(() => void load()), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openSettlement = useCallback(async (row: PettyCashResponse) => {
    setSelected(row);
    setDetailOpen(true);
    const refreshed = await getPettyCashByIdAction(row.id);
    if (refreshed.success && refreshed.data) setSelected(refreshed.data);
  }, []);

  useEffect(() => {
    if (!initialId) return;
    void getPettyCashByIdAction(initialId).then((r) => {
      if (r.success && r.data) {
        setSelected(r.data);
        setDetailOpen(true);
      }
    });
  }, [initialId]);

  const columns = useMemo<ColumnDef<PettyCashResponse>[]>(
    () => [
      { accessorKey: 'id', header: 'شناسه' },
      {
        accessorKey: 'amount',
        header: 'مبلغ تنخواه',
        cell: ({ row }) => formatAmount(row.original.amount, { unit: 'ریال' }),
      },
      {
        id: 'spent',
        header: 'ثبت‌شده',
        cell: ({ row }) => formatAmount(sumExpenseLines(row.original.expenseLines ?? []), { unit: 'ریال' }),
      },
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => pettyCashStatusLabel(row.original.status),
      },
      {
        id: 'settlement',
        header: 'تسویه',
        cell: ({ row }) => pettyCashSettlementLabel(row.original.settlementStatus),
      },
      {
        accessorKey: 'createdAt',
        header: 'تاریخ',
        cell: ({ row }) => (row.original.createdAt ? formatJalaliDate(row.original.createdAt) : '—'),
      },
      {
        id: 'actions',
        header: 'عملیات',
        cell: ({ row }) => (
          <Button type="button" variant="outline" size="sm" onClick={() => void openSettlement(row.original)}>
            <Receipt className="ml-1 h-4 w-4" />
            {canSettlePettyCash(row.original) ? 'ثبت خرج' : 'نمایش'}
          </Button>
        ),
      },
    ],
    [openSettlement],
  );

  return (
    <DashboardPageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ثبت خرج تنخواه</h1>
          <p className="text-sm text-muted-foreground">
            پس از تکمیل روال تأیید مالی، اقلام هزینه را ثبت کنید؛ سپس برای تأیید مدیر، مدیر مالی و مدیرعامل ارسال می‌شود.
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/petty-cash/ledger">دفتر تنخواه (گزارش)</Link>
        </Button>
      </div>

      {!loading && items.length === 0 && (
        <Alert className="mb-4">
          <AlertTitle>موردی برای ثبت خرج نیست</AlertTitle>
          <AlertDescription className="text-sm">
            تنخواه تأییدشده‌ای که هنوز تسویه نشده باشد وجود ندارد.{' '}
            <Link href="/dashboard/petty-cash" className="underline">
              درخواست تنخواه جدید
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">تنخواه‌های منتظر ثبت خرج</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<PettyCashResponse>
            columns={columns}
            data={items}
            totalItems={items.length}
            isLoading={loading}
            pagination={{ pageIndex: 0, pageSize: 10 }}
            onPaginationChange={() => {}}
            sorting={[]}
            onSortingChange={() => {}}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            entityName="تسویه تنخواه"
            columnSizingStorageKey="petty-cash-settlement-table"
            onRefresh={() => load()}
            onExport={async () => items}
          />
        </CardContent>
      </Card>

      <AdvancedModal
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        title={selected ? `ثبت خرج — تنخواه #${selected.id}` : 'ثبت خرج تنخواه'}
        size="lg"
      >
        {selected ? (
          <PettyCashDetailPanel
            record={selected}
            onUpdated={(r) => {
              setSelected(r);
              void load();
              if (isPettyCashSettled(r)) setDetailOpen(false);
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
        )}
      </AdvancedModal>
    </DashboardPageShell>
  );
}

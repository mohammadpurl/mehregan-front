'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, FileSpreadsheet } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { getPettyCashByIdAction } from '@/app/_actions/petty-cash-actions';
import type { PettyCashResponse } from '../_types/petty-cash.types';
import { usePettyCashList } from '../_hooks/use-petty-cash-list';
import { usePettyCashListCapabilities } from '../_hooks/use-petty-cash-list-capabilities';
import { pettyCashSettlementLabel, pettyCashStatusLabel } from '../_utils/petty-cash-labels';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { sumExpenseLines } from '../_utils/petty-cash-mapper';
import { PettyCashLedgerDetail } from './petty-cash-ledger-detail';

export function PettyCashLedgerList() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('pettyCashId')?.trim() || '';
  const { scopes } = usePettyCashListCapabilities();
  const canViewAll = scopes.includes('all');
  const listScope = canViewAll ? 'all' : 'mine';

  const { items, total, isLoading, pagination, setPagination, load } = usePettyCashList(listScope);
  const [, startTransition] = useTransition();

  const [detailOpen, setDetailOpen] = useState(Boolean(initialId));
  const [selected, setSelected] = useState<PettyCashResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const openDetail = useCallback(async (row: PettyCashResponse) => {
    setSelected(row);
    setDetailOpen(true);
    setDetailLoading(true);
    const refreshed = await getPettyCashByIdAction(row.id);
    setDetailLoading(false);
    if (refreshed.success && refreshed.data) setSelected(refreshed.data);
  }, []);

  const triggerLoad = useCallback(() => {
    startTransition(() => void load());
  }, [load, startTransition]);

  useEffect(() => {
    const t = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(t);
  }, [triggerLoad, pagination.pageIndex, pagination.pageSize]);

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
        accessorKey: 'requesterName',
        header: 'درخواست‌کننده',
        cell: ({ row }) => row.original.requesterName || '—',
      },
      {
        accessorKey: 'amount',
        header: 'مبلغ تنخواه',
        cell: ({ row }) => formatAmount(row.original.amount, { unit: 'ریال' }),
      },
      {
        id: 'expenseTotal',
        header: 'جمع خرج',
        cell: ({ row }) => {
          const t =
            row.original.totalExpenses ?? sumExpenseLines(row.original.expenseLines ?? []);
          return t > 0 ? formatAmount(t, { unit: 'ریال' }) : '—';
        },
      },
      {
        id: 'expenseCount',
        header: 'تعداد اقلام',
        cell: ({ row }) => {
          const n =
            row.original.expenseLineCount ??
            row.original.expenseLines?.length ??
            0;
          return n > 0 ? n : '—';
        },
      },
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => pettyCashStatusLabel(row.original.status),
      },
      {
        accessorKey: 'settlementStatus',
        header: 'تسویه',
        cell: ({ row }) => pettyCashSettlementLabel(row.original.settlementStatus),
      },
      {
        accessorKey: 'createdAt',
        header: 'تاریخ ثبت',
        cell: ({ row }) =>
          row.original.createdAt ? formatJalaliDate(row.original.createdAt, { withTime: true }) : '—',
      },
      {
        id: 'actions',
        header: 'جزئیات خرج',
        cell: ({ row }) => (
          <Button type="button" variant="outline" size="sm" onClick={() => void openDetail(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [openDetail],
  );

  return (
    <DashboardPageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7 text-primary" />
            دفتر تنخواه
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مشاهده همه تنخواه‌های ثبت‌شده و جزئیات اقلام خرج هر مورد
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/petty-cash">درخواست تنخواه</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/petty-cash/settlement">ثبت خرج</Link>
          </Button>
        </div>
      </div>

      {!canViewAll && (
        <Alert className="mb-4 border-amber-200/80 bg-amber-50/50">
          <AlertTitle>محدودیت نمایش</AlertTitle>
          <AlertDescription className="text-sm">
            فقط تنخواه‌های مرتبط با شما نمایش داده می‌شود. برای مشاهده کل سازمان نقش مدیر مالی یا
            مدیرعامل لازم است.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            {canViewAll ? 'همه تنخواه‌های ثبت‌شده' : 'تنخواه‌های من'}
            {total > 0 ? ` (${total})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<PettyCashResponse>
            columns={columns}
            data={items}
            totalItems={total}
            isLoading={isLoading}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={[]}
            onSortingChange={() => {}}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            entityName="تنخواه"
            columnSizingStorageKey="petty-cash-ledger-table"
            onRefresh={() => load()}
            onExport={async () => items}
          />
        </CardContent>
      </Card>

      <AdvancedModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selected ? `جزئیات تنخواه #${selected.id}` : 'جزئیات تنخواه'}
        description="اقلام خرج و پیوست‌ها"
        size="xl"
        footer={
          <Button type="button" variant="outline" onClick={() => setDetailOpen(false)}>
            بستن
          </Button>
        }
      >
        {detailLoading && !selected ? (
          <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
        ) : selected ? (
          <PettyCashLedgerDetail record={selected} />
        ) : (
          <p className="text-sm text-muted-foreground">موردی انتخاب نشده است.</p>
        )}
      </AdvancedModal>
    </DashboardPageShell>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, PackageCheck } from 'lucide-react';
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import { getGrnsAction, postGrnAction } from '@/app/_actions/grn-actions';
import type { Grn, GrnStatus } from '@/app/_types/grn.types';
import { useFormAction } from '@/app/hooks/use-form-action';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { grnStatusClass, grnStatusLabels } from '../../_utils/grn-status-labels';
import { GrnDetailPanel } from './grn-detail-panel';

const STATUS_FILTER_ALL = 'all';

export function GrnList() {
  const searchParams = useSearchParams();
  const initialRequestId = searchParams.get('requestId')?.trim() || '';
  const { notifyError, notifySuccess } = useFormAction();

  const [items, setItems] = useState<Grn[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [postingId, setPostingId] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [requestIdFilter, setRequestIdFilter] = useState(initialRequestId);
  const [appliedRequestIdFilter, setAppliedRequestIdFilter] = useState(initialRequestId);
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string>(STATUS_FILTER_ALL);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [, startTransition] = useTransition();

  const [globalFilter, setGlobalFilter] = useState('');
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    const requestId = appliedRequestIdFilter.trim();
    const res = await getGrnsAction({
      page: pageIndex + 1,
      pageSize,
      requestId: requestId ? Number(requestId) : undefined,
      search: appliedGlobalFilter.trim() || undefined,
      status: appliedStatusFilter !== STATUS_FILTER_ALL ? appliedStatusFilter : undefined,
    });
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      notifyError(res.error || 'خطا در دریافت رسیدهای انبار');
    }
    setLoading(false);
  }, [
    appliedGlobalFilter,
    appliedRequestIdFilter,
    appliedStatusFilter,
    notifyError,
    pageIndex,
    pageSize,
  ]);

  const triggerLoad = useCallback(() => {
    startTransition(() => void load());
  }, [load, startTransition]);

  useEffect(() => {
    const t = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(t);
  }, [triggerLoad, pageIndex, pageSize, appliedRequestIdFilter, appliedStatusFilter, appliedGlobalFilter]);

  const applyFilters = () => {
    setAppliedRequestIdFilter(requestIdFilter.trim());
    setAppliedStatusFilter(statusFilter);
    setAppliedGlobalFilter(globalFilter.trim());
    setPageIndex(0);
  };

  const openDetail = (id: number) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedId(null);
  };

  const handlePost = useCallback(
    async (id: number) => {
      setPostingId(id);
      const res = await postGrnAction(id);
      setPostingId(null);
      if (!res.success) {
        notifyError(res.error || 'خطا در ثبت نهایی رسید');
        return;
      }
      notifySuccess('ورود به انبار انجام شد');
      triggerLoad();
      if (selectedId === id) closeDetail();
    },
    [notifyError, notifySuccess, selectedId, triggerLoad],
  );

  const columns = useMemo<ColumnDef<Grn>[]>(
    () => [
      {
        accessorKey: 'grnNo',
        header: 'شماره رسید',
        cell: ({ row }) => row.original.grnNo ?? row.original.id,
      },
      {
        accessorKey: 'requestId',
        header: 'درخواست خرید',
        cell: ({ row }) => (
          <Link
            href={`/dashboard/procurement/requests?requestId=${row.original.requestId}`}
            className="text-primary underline"
          >
            #{row.original.requestId}
          </Link>
        ),
      },
      {
        accessorKey: 'supplierName',
        header: 'تأمین‌کننده',
        cell: ({ row }) => row.original.supplierName ?? '—',
      },
      {
        accessorKey: 'warehouseName',
        header: 'انبار',
        cell: ({ row }) => row.original.warehouseName ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => {
          const status = row.original.status as GrnStatus;
          return (
            <Badge className={grnStatusClass[status] ?? ''}>
              {grnStatusLabels[status] ?? status}
            </Badge>
          );
        },
      },
      {
        id: 'date',
        header: 'تاریخ',
        cell: ({ row }) => {
          const d = row.original.receiptDate ?? row.original.createdAt;
          return d ? formatJalaliDate(d) : '—';
        },
      },
      {
        id: 'actions',
        header: 'عملیات',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => openDetail(row.original.id)}>
              <Eye className="h-4 w-4" />
            </Button>
            {row.original.status === 'draft' ? (
              <Button
                type="button"
                size="sm"
                disabled={postingId === row.original.id}
                onClick={() => void handlePost(row.original.id)}
              >
                <PackageCheck className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [handlePost, postingId],
  );

  return (
    <DashboardPageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">رسید انبار (فاکتور خرید)</h1>
          <p className="text-sm text-muted-foreground">
            ورود کالا به انبار فقط از این مسیر و با ضمیمه فاکتور خرید انجام می‌شود.
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/procurement/requests">درخواست‌های خرید</Link>
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-2 pt-6">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">شناسه درخواست خرید</label>
            <Input
              className="w-40"
              value={requestIdFilter}
              onChange={(e) => setRequestIdFilter(e.target.value)}
              placeholder="مثلاً 3"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">وضعیت</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="همه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>همه</SelectItem>
                <SelectItem value="draft">پیش‌نویس</SelectItem>
                <SelectItem value="posted">ثبت‌شده</SelectItem>
                <SelectItem value="cancelled">لغو</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">جستجو</label>
            <Input
              className="w-48"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="شماره رسید، تأمین‌کننده…"
            />
          </div>
          <Button type="button" variant="secondary" onClick={applyFilters}>
            اعمال
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">لیست رسیدها</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<Grn>
            data={items}
            columns={columns}
            totalItems={total}
            isLoading={loading}
            pagination={{ pageIndex, pageSize }}
            onPaginationChange={(updater) => {
              const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
              setPageIndex(next.pageIndex);
            }}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            sorting={sorting}
            onSortingChange={setSorting}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            entityName="رسید انبار"
            onRefresh={triggerLoad}
            enableColumnFilters={false}
          />
        </CardContent>
      </Card>

      <AdvancedModal
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) closeDetail();
          else setDetailOpen(true);
        }}
        title="جزئیات رسید انبار"
        size="lg"
        footer={
          <Button type="button" variant="outline" onClick={closeDetail}>
            بستن
          </Button>
        }
      >
        {selectedId ? (
          <GrnDetailPanel grnId={selectedId} onUpdated={() => triggerLoad()} />
        ) : (
          <p className="text-sm text-muted-foreground">موردی انتخاب نشده است.</p>
        )}
      </AdvancedModal>
    </DashboardPageShell>
  );
}

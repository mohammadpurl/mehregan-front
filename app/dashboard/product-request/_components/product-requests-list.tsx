'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, Plus, Trash2 } from 'lucide-react';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import {
  deleteProductRequestAction,
  getProductRequestsQueryAction,
} from '@/app/_actions/product-request-actions';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { useFormAction } from '@/app/hooks/use-form-action';
import type { ProductRequestResponse } from '@/app/_types/product-request.types';
import { formatJalaliDate } from '@/app/utils/jalali-date';

const statusLabels: Record<string, string> = {
  pending: 'در انتظار',
  approved: 'تایید شده',
  rejected: 'رد شده',
  purchased: 'خریداری شده',
};

const statusClass: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  purchased: 'bg-blue-100 text-blue-800',
};

const typeLabels: Record<string, string> = {
  equipment: 'تجهیزات',
  material: 'مواد اولیه',
  office_supplies: 'ملزومات اداری',
  other: 'سایر',
};

export function ProductRequestsList() {
  const searchParams = useSearchParams();
  const initialRequestId = searchParams.get('requestId')?.trim() || '';
  const { notifyError } = useFormAction();
  const { executeDelete, deletePending } = useDeleteAction();

  const [items, setItems] = useState<ProductRequestResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterId, setFilterId] = useState(initialRequestId);
  const [appliedFilterId, setAppliedFilterId] = useState(initialRequestId);
  const [selected, setSelected] = useState<ProductRequestResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(Boolean(initialRequestId));
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getProductRequestsQueryAction({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      id: appliedFilterId.trim() || undefined,
    });
    if (result.success && result.data) {
      setItems(result.data.items);
      setTotal(result.data.total);
    } else {
      notifyError(result.error || 'خطا در دریافت لیست درخواست‌های کالا');
    }
    setLoading(false);
  }, [appliedFilterId, notifyError, pagination.pageIndex, pagination.pageSize]);

  const triggerLoad = useCallback(() => {
    startTransition(() => void load());
  }, [load, startTransition]);

  useEffect(() => {
    const t = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(t);
  }, [triggerLoad, pagination.pageIndex, pagination.pageSize, appliedFilterId]);

  useEffect(() => {
    if (!initialRequestId || items.length === 0) return;
    const found = items.find((p) => p.id === initialRequestId);
    if (found) {
      setSelected(found);
      setDetailOpen(true);
    }
  }, [initialRequestId, items]);

  const handleDelete = useCallback(
    async (id: string) => {
      await executeDelete(() => deleteProductRequestAction(id), {
        successMessage: 'درخواست کالا حذف شد',
        errorMessage: 'حذف درخواست کالا ناموفق بود',
        onSuccess: () => {
          if (selected?.id === id) {
            setSelected(null);
            setDetailOpen(false);
          }
          triggerLoad();
        },
      });
    },
    [executeDelete, selected?.id, triggerLoad],
  );

  const applyFilters = () => {
    setAppliedFilterId(filterId.trim());
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const columns = useMemo<ColumnDef<ProductRequestResponse>[]>(
    () => [
      { accessorKey: 'id', header: 'شناسه' },
      {
        accessorKey: 'productType',
        header: 'نوع کالا',
        cell: ({ row }) => typeLabels[row.original.productType] ?? row.original.productType,
      },
      { accessorKey: 'requesterName', header: 'درخواست‌کننده' },
      {
        accessorKey: 'reason',
        header: 'دلیل',
        cell: ({ row }) => <span className="max-w-xs truncate block">{row.original.reason}</span>,
      },
      {
        id: 'itemsCount',
        header: 'تعداد اقلام',
        cell: ({ row }) => row.original.items?.length ?? 0,
      },
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => (
          <Badge className={statusClass[row.original.status] ?? ''}>
            {statusLabels[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'تاریخ',
        cell: ({ row }) => formatJalaliDate(row.original.createdAt),
      },
      {
        id: 'actions',
        header: 'عملیات',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelected(row.original);
                setDetailOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              disabled={deletePending}
              onClick={() => void handleDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deletePending, handleDelete],
  );

  return (
    <DashboardPageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">درخواست‌های کالا</h1>
          <p className="text-sm text-muted-foreground">لیست درخواست‌های داخلی کالا</p>
        </div>
        <Button type="button" asChild>
          <Link href="/dashboard/procurement/requests?create=1">
            <Plus className="ml-2 h-4 w-4" />
            ثبت درخواست خرید (PR)
          </Link>
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-2 pt-6">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">شناسه</label>
            <Input
              className="w-40"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              placeholder="جستجو با شناسه"
            />
          </div>
          <Button type="button" variant="secondary" onClick={applyFilters}>
            اعمال
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">لیست درخواست‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<ProductRequestResponse>
            data={items}
            columns={columns}
            totalItems={total}
            isLoading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
            globalFilter=""
            onGlobalFilterChange={() => {}}
            columnFilters={[]}
            onColumnFiltersChange={() => {}}
            sorting={[]}
            onSortingChange={() => {}}
            columnVisibility={{}}
            onColumnVisibilityChange={() => {}}
            entityName="درخواست کالا"
            onRefresh={triggerLoad}
          />
        </CardContent>
      </Card>

      <AdvancedModal
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        title="جزئیات درخواست کالا"
        size="lg"
        footer={
          <Button type="button" variant="outline" onClick={() => setDetailOpen(false)}>
            بستن
          </Button>
        }
      >
        {!selected ? (
          <p className="text-sm text-muted-foreground">موردی انتخاب نشده است.</p>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <span className="text-muted-foreground">شناسه:</span> {selected.id}
              </div>
              <div>
                <span className="text-muted-foreground">نوع:</span> {typeLabels[selected.productType]}
              </div>
              <div>
                <span className="text-muted-foreground">درخواست‌کننده:</span> {selected.requesterName}
              </div>
              <div>
                <span className="text-muted-foreground">وضعیت:</span> {statusLabels[selected.status]}
              </div>
            </div>
            <div>
              <p className="mb-1 text-muted-foreground">دلیل درخواست</p>
              <div className="rounded-lg border bg-muted/10 p-3 whitespace-pre-wrap">{selected.reason}</div>
            </div>
            {selected.description ? (
              <div>
                <p className="mb-1 text-muted-foreground">توضیحات</p>
                <div className="rounded-lg border bg-muted/10 p-3 whitespace-pre-wrap">{selected.description}</div>
              </div>
            ) : null}
          </div>
        )}
      </AdvancedModal>
    </DashboardPageShell>
  );
}

'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { useToast } from '@/hooks/use-toast';
import { getInventoryTransactionsAction } from '@/app/_actions/inventory-actions';
import type { InventoryTransaction } from '@/app/_types/inventory.types';
import { formatJalaliDate } from '@/app/utils/jalali-date';

export default function InventoryTransactionsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<InventoryTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getInventoryTransactionsAction({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: globalFilter || undefined,
      sortBy: sorting[0]?.id,
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    });
    if (result.success && result.data) {
      setRows(result.data.items || []);
      setTotal(result.data.total || 0);
    } else {
      setRows([]);
      setTotal(0);
      toast({ title: 'خطا', description: result.error || 'خطا در دریافت تراکنش‌ها', variant: 'destructive' });
    }
    setLoading(false);
  }, [globalFilter, pagination.pageIndex, pagination.pageSize, sorting, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => void load());
    }, 0);
    return () => clearTimeout(timer);
  }, [load, startTransition]);

  const columns: ColumnDef<InventoryTransaction>[] = [
    { accessorKey: 'id', header: 'شناسه' },
    { accessorKey: 'type', header: 'نوع' },
    { accessorKey: 'source', header: 'مبداء' },
    { accessorKey: 'destination', header: 'مقصد' },
    { accessorKey: 'receiverName', header: 'تحویل‌گیرنده' },
    {
      accessorKey: 'date',
      header: 'تاریخ',
      cell: ({ row }) => formatJalaliDate(row.original.date),
    },
    { accessorKey: 'status', header: 'وضعیت' },
  ];

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle>تراکنش‌های انبار</CardTitle>
          <CardDescription>
            داده از <code className="rounded bg-muted px-1 text-xs">GET /inventory/transactions</code> بارگذاری می‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<InventoryTransaction>
            data={rows}
            columns={columns}
            totalItems={total}
            pagination={pagination}
            onPaginationChange={setPagination}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            sorting={sorting}
            onSortingChange={setSorting}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            isLoading={loading || isPending}
            entityName="تراکنش"
            onRefresh={() => {
              startTransition(() => void load());
            }}
            onExport={async () => rows}
          />
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}

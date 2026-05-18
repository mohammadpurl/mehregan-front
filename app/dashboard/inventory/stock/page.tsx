'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { getStockLevelsAction } from '@/app/_actions/inventory-actions';
import { getItemsAction } from '@/app/_actions/item-actions';
import { Item } from '@/app/_types/item.types';
import { useToast } from '@/hooks/use-toast';

type StockRow = {
  id: number;
  itemName: string;
  sku: string;
  unit: string;
  onHand: number;
  available: number;
};

export default function InventoryStockPage() {
  const { toast } = useToast();
  const fallbackNotified = useRef(false);
  const [rows, setRows] = useState<StockRow[]>([]);
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
    const stockRes = await getStockLevelsAction({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: globalFilter || undefined,
      sortBy: sorting[0]?.id,
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    });

    if (stockRes.success && stockRes.data) {
      setRows(
        (stockRes.data.items || []).map((r) => ({
          id: r.id,
          itemName: r.itemName,
          sku: r.sku,
          unit: r.unit,
          onHand: r.onHand,
          available: r.available,
        })),
      );
      setTotal(stockRes.data.total || 0);
      setLoading(false);
      return;
    }

    const itemsRes = await getItemsAction({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: globalFilter || undefined,
      sortBy: sorting[0]?.id,
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    });
    if (itemsRes.success && itemsRes.data) {
      const mapped = (itemsRes.data.items || []).map((i: Item) => ({
        id: i.id,
        itemName: i.name,
        sku: i.sku || '-',
        unit: i.unit || '-',
        onHand: 0,
        available: 0,
      }));
      setRows(mapped);
      setTotal(itemsRes.data.total || 0);
      if (!fallbackNotified.current) {
        fallbackNotified.current = true;
        toast({
          title: 'توجه',
          description:
            stockRes.error ||
            'سرویس موجودی (/inventory/stock) در دسترس نبود؛ فهرست کالا بدون عدد موجودی نمایش داده شد.',
        });
      }
    } else {
      toast({ title: 'خطا', description: itemsRes.error || stockRes.error || 'خطا در دریافت داده', variant: 'destructive' });
    }
    setLoading(false);
  }, [globalFilter, pagination.pageIndex, pagination.pageSize, sorting, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => void load());
    }, 0);
    return () => clearTimeout(timer);
  }, [load, startTransition]);

  const columns: ColumnDef<StockRow>[] = [
    { accessorKey: 'id', header: 'شناسه' },
    { accessorKey: 'itemName', header: 'کالا' },
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'unit', header: 'واحد' },
    { accessorKey: 'onHand', header: 'موجودی' },
    { accessorKey: 'available', header: 'قابل تخصیص' },
  ];

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle>موجودی انبار</CardTitle>
          <CardDescription>
            داده از <code className="rounded bg-muted px-1 text-xs">GET /inventory/stock</code> خوانده می‌شود؛ در صورت خطای API از فهرست کالا به‌عنوان پشتیبان استفاده می‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<StockRow>
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
            entityName="موجودی"
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

'use client';

import { useMemo, useState, useEffect } from 'react';
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import type { Product } from './_types/product.types';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { formatAmount } from '@/app/utils/number-format';

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } finally {
        setLoading(false);
      }
    };
    void fetchProducts();
  }, []);

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'شناسه',
        enableSorting: true,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'name',
        header: 'نام محصول',
        enableSorting: true,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'category',
        header: 'دسته‌بندی',
        enableSorting: true,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'price',
        header: 'قیمت',
        enableSorting: true,
        cell: (info) => formatAmount(info.getValue<number>(), { unit: 'تومان' }),
      },
      {
        accessorKey: 'stock',
        header: 'موجودی',
        enableSorting: true,
      },
      {
        accessorKey: 'lastUpdated',
        header: 'آخرین بروزرسانی',
        enableSorting: true,
        cell: (info) => formatJalaliDate(info.getValue<string>()),
      },
    ],
    [],
  );

  return (
    <DashboardPageShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">کاتالوگ محصولات</h1>
        <p className="text-sm text-muted-foreground">نمایش نمونه محصولات (دمو)</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">لیست محصولات</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<Product>
            data={data}
            columns={columns}
            totalItems={data.length}
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
            isLoading={loading}
            entityName="محصولات"
            onRefresh={() => window.location.reload()}
            onExport={async () => data}
          />
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}

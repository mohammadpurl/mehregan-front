'use client';

import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Input } from '@/app/components/ui/input';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';
import { Product } from './_types/product.types';
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
  })

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const res = await fetch('/api/products');
      const json = await res.json();
      setData(json);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // ✅ تعریف ستون‌ها با filterComponent
  const columns: ColumnDef<Product>[] = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'شناسه',
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        filterComponent: ({ onFilterChange }: any) => (
          <Input
            type="number"
            placeholder="جستجو..."
            onChange={(e) => onFilterChange(e.target.value)}
          />
        ),
      },
    },
    {
      accessorKey: 'name',
      header: 'نام محصول',
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        filterComponent: ({ onFilterChange }: any) => (
          <Input
            placeholder="جستجو نام..."
            onChange={(e) => onFilterChange(e.target.value)}
          />
        ),
      },
    },
    {
      accessorKey: 'category',
      header: 'دسته‌بندی',
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        filterComponent: ({ onFilterChange }: any) => (
          <select
            className="border rounded px-2 py-1"
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="">همه</option>
            <option value="Electronics">الکترونیک</option>
            <option value="Clothing">پوشاک</option>
            <option value="Home">خانه</option>
            <option value="Sports">ورزشی</option>
          </select>
        ),
      },
    },
    {
      accessorKey: 'price',
      header: 'قیمت',
      enableSorting: true,
      enableColumnFilter: true,
      cell: (info) =>
        formatAmount(info.getValue<number>(), { unit: 'تومان' }),
      meta: {
        filterComponent: ({ onFilterChange }: any) => (
          <Input
            type="number"
            placeholder="حداقل قیمت..."
            onChange={(e) =>
              onFilterChange({ min: Number(e.target.value) })
            }
          />
        ),
      },
    },
    {
      accessorKey: 'stock',
      header: 'موجودی',
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'lastUpdated',
      header: 'آخرین بروزرسانی',
      enableSorting: true,
      enableColumnFilter: true,
      cell: (info) => formatJalaliDate(info.getValue<string>()),
      meta: {
        filterComponent: ({ onFilterChange }: any) => (
          <Input
            type="date"
            onChange={(e) => onFilterChange(e.target.value)}
          />
        ),
      },
    },
  ], []);

  return (
    <DashboardPageShell>
      <h1 className="text-2xl mb-4 font-bold">لیست محصولات</h1>

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
        onRefresh={() => location.reload()}
        onCreateClick={() => console.log('create')}
        onExport={async () => data}
      />
    </DashboardPageShell>
  );
}
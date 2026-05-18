'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import { getItemsAction } from '@/app/_actions/item-actions';
import type { Item } from '@/app/_types/item.types';
import { useFormAction } from '@/app/hooks/use-form-action';
import { parseFiniteId } from '../_utils/item-form.utils';

type UseItemsListOptions = {
  initialItemId?: string;
};

export function useItemsList(options?: UseItemsListOptions) {
  const initialItemId = options?.initialItemId?.trim() || '';
  const initialFilters: ColumnFiltersState = initialItemId ? [{ id: 'id', value: initialItemId }] : [];

  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, startLoadTransition] = useTransition();
  const { notifyError } = useFormAction();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters);
  const [appliedColumnFilters, setAppliedColumnFilters] = useState<ColumnFiltersState>(initialFilters);
  const [sorting, setSorting] = useState<SortingState>([]);

  const loadItems = useCallback(
    (overrides?: {
      appliedColumnFilters?: ColumnFiltersState;
      appliedGlobalFilter?: string;
      pageIndex?: number;
    }) => {
      startLoadTransition(async () => {
        const filters = overrides?.appliedColumnFilters ?? appliedColumnFilters;
        const search = overrides?.appliedGlobalFilter ?? appliedGlobalFilter;
        const pageIndex = overrides?.pageIndex ?? pagination.pageIndex;
        const sortBy = sorting[0]?.id;
        const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
        const idFilter = filters.find((f) => f.id === 'id')?.value;
        const nameFilter = filters.find((f) => f.id === 'name')?.value;
        const skuFilter = filters.find((f) => f.id === 'sku')?.value;

        const result = await getItemsAction({
          page: pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy,
          sortOrder,
          search: search || undefined,
          id: parseFiniteId(idFilter),
          name: nameFilter ? String(nameFilter).trim() || undefined : undefined,
          sku: skuFilter ? String(skuFilter).trim() || undefined : undefined,
        });

        if (result.success && result.data) {
          setItems(result.data.items || []);
          setTotal(result.data.total || 0);
        } else {
          notifyError(result.error || 'خطا در دریافت کالاها');
        }
      });
    },
    [
      appliedColumnFilters,
      appliedGlobalFilter,
      notifyError,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
  );

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    total,
    isLoading,
    pagination,
    setPagination,
    globalFilter,
    setGlobalFilter,
    appliedGlobalFilter,
    setAppliedGlobalFilter,
    columnFilters,
    setColumnFilters,
    appliedColumnFilters,
    setAppliedColumnFilters,
    sorting,
    setSorting,
    loadItems,
    initialItemId,
  };
}

'use client';

import { useCallback, useState } from 'react';
import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import { getPaymentRequestsQueryAction } from '@/app/_actions/payment-request-actions';
import { showNotification } from '@/app/_store/notification.store';
import type { PaymentRequestResponse } from '../_types/payment-request.types';

export type PaymentRequestsListScope = 'mine' | 'approver' | 'participated';

type Options = { initialId?: string; scope?: PaymentRequestsListScope };

export function usePaymentRequestsList({ initialId = '', scope = 'mine' }: Options = {}) {
  const [items, setItems] = useState<PaymentRequestResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialId ? [{ id: 'id', value: initialId }] : [],
  );
  const [appliedColumnFilters, setAppliedColumnFilters] = useState<ColumnFiltersState>(
    initialId ? [{ id: 'id', value: initialId }] : [],
  );

  const load = useCallback(
    async (overrides?: {
      pageIndex?: number;
      appliedColumnFilters?: ColumnFiltersState;
      appliedGlobalFilter?: string;
    }) => {
      setIsLoading(true);
      const pageIndex = overrides?.pageIndex ?? pagination.pageIndex;
      const filters = overrides?.appliedColumnFilters ?? appliedColumnFilters;
      const search = overrides?.appliedGlobalFilter ?? appliedGlobalFilter;
      const idFilter = filters.find((f) => f.id === 'id')?.value;

      const result = await getPaymentRequestsQueryAction({
        page: pageIndex + 1,
        pageSize: pagination.pageSize,
        search: search?.trim() || undefined,
        id: typeof idFilter === 'string' ? idFilter.trim() : undefined,
        scope: scope === 'mine' ? undefined : scope,
      });

      if (result.success && result.data) {
        setItems(result.data.items);
        setTotal(result.data.total);
      } else {
        showNotification([
          {
            type: 'error',
            message: (!result.success && result.error) || 'خطا در دریافت لیست',
          },
        ]);
      }
      setIsLoading(false);
    },
    [appliedColumnFilters, appliedGlobalFilter, pagination.pageIndex, pagination.pageSize, scope],
  );

  return {
    items,
    total,
    isLoading,
    pagination,
    setPagination,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    appliedGlobalFilter,
    setAppliedGlobalFilter,
    columnFilters,
    setColumnFilters,
    appliedColumnFilters,
    setAppliedColumnFilters,
    load,
  };
}

'use client';

import { useCallback, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { getPettyCashListAction, type PettyCashListScope } from '@/app/_actions/petty-cash-actions';
import { showNotification } from '@/app/_store/notification.store';
import type { PettyCashResponse } from '../_types/petty-cash.types';

export function usePettyCashList(scope: PettyCashListScope = 'mine') {
  const [items, setItems] = useState<PettyCashResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const load = useCallback(
    async (pageIndex?: number) => {
      setIsLoading(true);
      const idx = pageIndex ?? pagination.pageIndex;
      const result = await getPettyCashListAction({
        page: idx + 1,
        pageSize: pagination.pageSize,
        scope,
      });
      if (result.success && result.data) {
        setItems(result.data.items);
        setTotal(result.data.total);
      } else {
        showNotification([{ type: 'error', message: result.error || 'خطا در دریافت لیست' }]);
      }
      setIsLoading(false);
    },
    [pagination.pageIndex, pagination.pageSize, scope],
  );

  return { items, total, isLoading, pagination, setPagination, load };
}

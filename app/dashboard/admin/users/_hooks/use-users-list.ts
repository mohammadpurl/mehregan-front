'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import { getUsersAction } from '@/app/_actions/user-actions';
import type { AdminUser } from '@/app/_types/user.types';
import { useFormAction } from '@/app/hooks/use-form-action';
import { parseFiniteId } from '../_utils/user-form.utils';

export function useUsersList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, startLoadTransition] = useTransition();
  const { notifyError } = useFormAction();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [appliedColumnFilters, setAppliedColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const loadUsers = useCallback(
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
        const usernameFilter = filters.find((f) => f.id === 'username')?.value;
        const emailFilter = filters.find((f) => f.id === 'email')?.value;

        const result = await getUsersAction({
          page: pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy,
          sortOrder,
          search: search || undefined,
          id: parseFiniteId(idFilter),
          username: usernameFilter ? String(usernameFilter).trim() || undefined : undefined,
          email: emailFilter ? String(emailFilter).trim() || undefined : undefined,
        });

        if (result.success && result.data) {
          setUsers(result.data.items || []);
          setTotal(result.data.total || 0);
        } else {
          notifyError(result.error || 'خطا در دریافت کاربران');
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
    loadUsers();
  }, [loadUsers]);

  return {
    users,
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
    loadUsers,
  };
}

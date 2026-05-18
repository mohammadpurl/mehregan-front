'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ColumnFiltersState, VisibilityState } from '@tanstack/react-table';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { deleteUserAction } from '@/app/_actions/user-actions';
import type { AdminUser } from '@/app/_types/user.types';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { useUsersList } from '../_hooks/use-users-list';
import { getUsersTableColumns } from './users-table-columns';
import { UserFormModal } from './user-form-modal';

export function UsersList() {
  const { executeDelete, deletePending } = useDeleteAction();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [advancedFilterId, setAdvancedFilterId] = useState('');
  const [advancedFilterUsername, setAdvancedFilterUsername] = useState('');
  const [advancedFilterEmail, setAdvancedFilterEmail] = useState('');

  const {
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
  } = useUsersList();

  const openCreate = useCallback(() => {
    setEditingUser(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((user: AdminUser) => {
    setEditingUser(user);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingUser(null);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      await executeDelete(() => deleteUserAction(id), {
        successMessage: 'کاربر حذف شد',
        onSuccess: () => {
          loadUsers();
          if (editingUser?.id === id) closeModal();
        },
      });
    },
    [closeModal, editingUser?.id, executeDelete, loadUsers],
  );

  const columns = useMemo(
    () => getUsersTableColumns({ onEdit: openEdit, onDelete: handleDelete, deletePending }),
    [deletePending, handleDelete, openEdit],
  );

  const applyAdvancedFilters = () => {
    const nextFilters: ColumnFiltersState = [];
    if (advancedFilterId.trim()) nextFilters.push({ id: 'id', value: advancedFilterId.trim() });
    if (advancedFilterUsername.trim()) nextFilters.push({ id: 'username', value: advancedFilterUsername.trim() });
    if (advancedFilterEmail.trim()) nextFilters.push({ id: 'email', value: advancedFilterEmail.trim() });
    const search = globalFilter.trim();
    setColumnFilters(nextFilters);
    setAppliedColumnFilters(nextFilters);
    setAppliedGlobalFilter(search);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    loadUsers({
      appliedColumnFilters: nextFilters,
      appliedGlobalFilter: search,
      pageIndex: 0,
    });
  };

  const clearFilters = () => {
    setAdvancedFilterId('');
    setAdvancedFilterUsername('');
    setAdvancedFilterEmail('');
    setColumnFilters([]);
    setAppliedColumnFilters([]);
    setGlobalFilter('');
    setAppliedGlobalFilter('');
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    loadUsers({
      appliedColumnFilters: [],
      appliedGlobalFilter: '',
      pageIndex: 0,
    });
  };

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>لیست کاربران</CardTitle>
          <Button type="button" onClick={openCreate}>
            کاربر جدید
          </Button>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid
            data={users}
            columns={columns}
            enableColumnResizing
            columnSizingStorageKey="admin-users-table"
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
            isLoading={isLoading}
            entityName="کاربران"
            onRefresh={() => loadUsers()}
            onExport={async () => users}
            onCreateClick={openCreate}
            globalFilterForm={
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    type="number"
                    placeholder="فیلتر شناسه"
                    value={advancedFilterId}
                    onChange={(e) => setAdvancedFilterId(e.target.value)}
                  />
                  <Input
                    placeholder="فیلتر نام کاربری"
                    value={advancedFilterUsername}
                    onChange={(e) => setAdvancedFilterUsername(e.target.value)}
                  />
                  <Input
                    placeholder="فیلتر ایمیل"
                    value={advancedFilterEmail}
                    onChange={(e) => setAdvancedFilterEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={applyAdvancedFilters}>
                    اعمال فیلتر
                  </Button>
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    پاک‌کردن
                  </Button>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      <UserFormModal
        open={modalOpen}
        editingUser={editingUser}
        onOpenChange={(open) => {
          if (!open) closeModal();
          else setModalOpen(true);
        }}
        onSaved={() => loadUsers()}
      />
    </DashboardPageShell>
  );
}

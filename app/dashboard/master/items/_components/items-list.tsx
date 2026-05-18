'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ColumnFiltersState, VisibilityState } from '@tanstack/react-table';
import { useSearchParams } from 'next/navigation';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { deleteItemAction } from '@/app/_actions/item-actions';
import type { Item } from '@/app/_types/item.types';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { useItemsList } from '../_hooks/use-items-list';
import { getItemsTableColumns } from './items-table-columns';
import { ItemFormModal } from './item-form-modal';

export function ItemsList() {
  const searchParams = useSearchParams();
  const initialItemId = searchParams.get('itemId')?.trim() || '';

  const { executeDelete, deletePending } = useDeleteAction();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [advancedFilterId, setAdvancedFilterId] = useState(initialItemId);
  const [advancedFilterName, setAdvancedFilterName] = useState('');
  const [advancedFilterSku, setAdvancedFilterSku] = useState('');

  const {
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
  } = useItemsList({ initialItemId });

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((item: Item) => {
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      await executeDelete(() => deleteItemAction(id), {
        successMessage: 'کالا حذف شد',
        errorMessage: 'حذف کالا ناموفق بود',
        onSuccess: () => {
          loadItems();
          if (editingItem?.id === id) closeModal();
        },
      });
    },
    [closeModal, editingItem?.id, executeDelete, loadItems],
  );

  const columns = useMemo(
    () => getItemsTableColumns({ onEdit: openEdit, onDelete: handleDelete, deletePending }),
    [deletePending, handleDelete, openEdit],
  );

  const applyAdvancedFilters = () => {
    const nextFilters: ColumnFiltersState = [];
    if (advancedFilterId.trim()) nextFilters.push({ id: 'id', value: advancedFilterId.trim() });
    if (advancedFilterName.trim()) nextFilters.push({ id: 'name', value: advancedFilterName.trim() });
    if (advancedFilterSku.trim()) nextFilters.push({ id: 'sku', value: advancedFilterSku.trim() });
    const search = globalFilter.trim();
    setColumnFilters(nextFilters);
    setAppliedColumnFilters(nextFilters);
    setAppliedGlobalFilter(search);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    loadItems({
      appliedColumnFilters: nextFilters,
      appliedGlobalFilter: search,
      pageIndex: 0,
    });
  };

  const clearFilters = () => {
    setAdvancedFilterId('');
    setAdvancedFilterName('');
    setAdvancedFilterSku('');
    setColumnFilters([]);
    setAppliedColumnFilters([]);
    setGlobalFilter('');
    setAppliedGlobalFilter('');
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    loadItems({
      appliedColumnFilters: [],
      appliedGlobalFilter: '',
      pageIndex: 0,
    });
  };

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle>لیست کالاها</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<Item>
            data={items}
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
            isLoading={isLoading}
            entityName="کالاها"
            onRefresh={() => loadItems()}
            onExport={async () => items}
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
                    placeholder="فیلتر نام کالا"
                    value={advancedFilterName}
                    onChange={(e) => setAdvancedFilterName(e.target.value)}
                  />
                  <Input placeholder="فیلتر SKU" value={advancedFilterSku} onChange={(e) => setAdvancedFilterSku(e.target.value)} />
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

      <ItemFormModal
        open={modalOpen}
        editingItem={editingItem}
        onOpenChange={(open) => {
          if (!open) closeModal();
          else setModalOpen(true);
        }}
        onSaved={() => loadItems()}
      />
    </DashboardPageShell>
  );
}

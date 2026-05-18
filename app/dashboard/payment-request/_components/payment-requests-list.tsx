'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Inbox, Plus } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { deletePaymentRequestAction } from '@/app/_actions/payment-request-actions';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { canEmployeeEditOwn } from '../_utils/payment-request-form.utils';
import type { PaymentRequestResponse } from '../_types/payment-request.types';
import {
  usePaymentRequestsList,
  type PaymentRequestsListScope,
} from '../_hooks/use-payment-requests-list';
import { getPaymentRequestsTableColumns } from './payment-requests-table-columns';
import { PaymentRequestFormModal } from './payment-request-form-modal';

export function PaymentRequestsList() {
  const searchParams = useSearchParams();
  const initialPaymentId = searchParams.get('paymentId')?.trim() || '';
  const { executeDelete, deletePending } = useDeleteAction();
  const [modalOpen, setModalOpen] = useState(Boolean(initialPaymentId));
  const [editing, setEditing] = useState<PaymentRequestResponse | null>(null);
  const [filterId, setFilterId] = useState(initialPaymentId);
  const [listScope, setListScope] = useState<PaymentRequestsListScope>('mine');
  const [, startTransition] = useTransition();

  const {
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
  } = usePaymentRequestsList({ initialId: initialPaymentId, scope: listScope });

  const triggerLoad = useCallback(() => {
    startTransition(() => void load());
  }, [load, startTransition]);

  useEffect(() => {
    const t = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(t);
  }, [triggerLoad, pagination.pageIndex, pagination.pageSize, sorting, appliedColumnFilters, appliedGlobalFilter, listScope]);

  useEffect(() => {
    if (!initialPaymentId || items.length === 0) return;
    const found = items.find((p) => p.id === initialPaymentId);
    if (found) {
      setEditing(found);
      setModalOpen(true);
    }
  }, [initialPaymentId, items]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: PaymentRequestResponse) => {
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = useCallback(
    async (id: string) => {
      await executeDelete(() => deletePaymentRequestAction(id), {
        successMessage: 'درخواست حذف شد',
        errorMessage: 'حذف ناموفق بود',
        onSuccess: () => {
          load();
          if (editing?.id === id) closeModal();
        },
      });
    },
    [closeModal, editing?.id, executeDelete, load],
  );

  const canEditRow = useCallback(
    (row: PaymentRequestResponse) =>
      listScope === 'mine' &&
      canEmployeeEditOwn({ status: row.status, isOwner: true, fromOwnList: true }),
    [listScope],
  );

  const columns = useMemo(
    () =>
      getPaymentRequestsTableColumns({
        onEdit: openEdit,
        onDelete: handleDelete,
        deletePending,
        canEdit: canEditRow,
      }),
    [canEditRow, deletePending, handleDelete],
  );

  const applyFilters = () => {
    const next = filterId.trim() ? [{ id: 'id', value: filterId.trim() }] : [];
    setColumnFilters(next);
    setAppliedColumnFilters(next);
    setAppliedGlobalFilter(globalFilter.trim());
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    void load({ pageIndex: 0, appliedColumnFilters: next, appliedGlobalFilter: globalFilter.trim() });
  };

  return (
    <DashboardPageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">درخواست‌های مالی</h1>
          <p className="text-sm text-muted-foreground">وام، مساعده، تنخواه و پرداخت</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/workflow/inbox">
              <Inbox className="ml-2 h-4 w-4" />
              کارتابل تأیید
            </Link>
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="ml-2 h-4 w-4" />
            درخواست جدید
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-2 pt-6">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">شناسه</label>
            <Input
              className="w-40"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              placeholder="جستجو با شناسه"
            />
          </div>
          <Button type="button" variant="secondary" onClick={applyFilters}>
            اعمال
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-medium">لیست درخواست‌ها</CardTitle>
          <Tabs
            value={listScope}
            onValueChange={(v) => {
              const next = v as PaymentRequestsListScope;
              setListScope(next);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <TabsList>
              <TabsTrigger value="mine">درخواست‌های من</TabsTrigger>
              <TabsTrigger value="approver">نیاز به تأیید من</TabsTrigger>
              <TabsTrigger value="participated">شرکت‌کرده در تأیید</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<PaymentRequestResponse>
            columns={columns}
            data={items}
            rowCount={total}
            isLoading={isLoading}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
          />
        </CardContent>
      </Card>

      <PaymentRequestFormModal
        open={modalOpen}
        editing={editing}
        onOpenChange={(open) => {
          if (!open) closeModal();
          else setModalOpen(true);
        }}
        onSaved={() => load()}
      />
    </DashboardPageShell>
  );
}

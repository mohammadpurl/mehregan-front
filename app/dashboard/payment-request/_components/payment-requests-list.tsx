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
import type { VisibilityState } from '@tanstack/react-table';
import { deletePaymentRequestAction } from '@/app/_actions/payment-request-actions';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { canEmployeeEditOwn } from '../_utils/payment-request-form.utils';
import type { PaymentRequestResponse } from '../_types/payment-request.types';
import {
  usePaymentRequestsList,
  type PaymentRequestsListScope,
} from '../_hooks/use-payment-requests-list';
import {
  paymentRequestScopeLabel,
  usePaymentRequestListCapabilities,
} from '../_hooks/use-payment-request-list-capabilities';
import { getPaymentRequestsTableColumns } from './payment-requests-table-columns';
import { PaymentRequestFormModal } from './payment-request-form-modal';

type PaymentRequestsListProps = {
  /** فیلتر ثابت نوع پرداخت (مثلاً procurement) */
  fixedPaymentType?: string;
  title?: string;
  subtitle?: string;
  showCreateButton?: boolean;
};

export function PaymentRequestsList({
  fixedPaymentType,
  title = 'درخواست‌های مالی',
  subtitle = 'وام، مساعده، تنخواه و پرداخت',
  showCreateButton = true,
}: PaymentRequestsListProps = {}) {
  const searchParams = useSearchParams();
  const initialPaymentId = searchParams.get('paymentId')?.trim() || '';
  const initialScope = (searchParams.get('scope')?.trim() || 'mine') as PaymentRequestsListScope;
  const { executeDelete, deletePending } = useDeleteAction();
  const [modalOpen, setModalOpen] = useState(Boolean(initialPaymentId));
  const [editing, setEditing] = useState<PaymentRequestResponse | null>(null);
  const [filterId, setFilterId] = useState(initialPaymentId);
  const { scopes: availableScopes } = usePaymentRequestListCapabilities();
  const [listScope, setListScope] = useState<PaymentRequestsListScope>(initialScope);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!availableScopes.includes(listScope)) {
      setListScope(availableScopes[0] ?? 'mine');
    }
  }, [availableScopes, listScope]);

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
  } = usePaymentRequestsList({
    initialId: initialPaymentId,
    scope: listScope,
    paymentType: fixedPaymentType,
  });

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
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {fixedPaymentType === 'procurement' ? (
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/procurement/requests">درخواست‌های خرید</Link>
            </Button>
          ) : null}
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/workflow/inbox">
              <Inbox className="ml-2 h-4 w-4" />
              کارتابل تأیید
            </Link>
          </Button>
          {showCreateButton ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="ml-2 h-4 w-4" />
              درخواست جدید
            </Button>
          ) : null}
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
            <TabsList className="flex h-auto flex-wrap">
              {availableScopes.map((scope) => (
                <TabsTrigger key={scope} value={scope}>
                  {paymentRequestScopeLabel(scope)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<PaymentRequestResponse>
            columns={columns}
            data={items}
            totalItems={total}
            isLoading={isLoading}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            entityName={title}
            columnSizingStorageKey="payment-requests-table"
            onRefresh={() => load()}
            onExport={async () => items}
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

'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, Inbox, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import {
  deletePurchaseRequestAction,
  getPurchaseRequestsAction,
  type PurchaseRequestListScope,
} from '@/app/_actions/purchase-request-actions';
import type { PurchaseRequest } from '@/app/_types/purchase-request.types';
import { useFormAction } from '@/app/hooks/use-form-action';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import {
  purchaseRequestStatusClass,
  purchaseRequestStatusLabels,
} from '../../_utils/procurement-status-labels';
import { canEditPurchaseRequest } from '../../_utils/can-edit-purchase-request';
import { PurchaseRequestDetailPanel } from './purchase-request-detail-panel';
import { PurchaseRequestFormModal } from './purchase-request-form-modal';
import {
  purchaseRequestScopeLabel,
  usePurchaseRequestListCapabilities,
} from '../_hooks/use-purchase-request-list-capabilities';

export function ProcurementRequestsList() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('requestId')?.trim() || '';
  const openCreateFromQuery = searchParams.get('create') === '1';
  const { notifyError } = useFormAction();
  const { executeDelete, deletePending } = useDeleteAction();
  const { scopes: availableScopes } = usePurchaseRequestListCapabilities();
  const [listScope, setListScope] = useState<PurchaseRequestListScope>('mine');

  const [items, setItems] = useState<PurchaseRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [idFilter, setIdFilter] = useState(initialId);
  const [appliedIdFilter, setAppliedIdFilter] = useState(initialId);
  const [selectedId, setSelectedId] = useState<number | null>(initialId ? Number(initialId) : null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(Boolean(initialId));
  const [, startTransition] = useTransition();
  const pageSize = 10;

  useEffect(() => {
    if (!availableScopes.includes(listScope)) {
      setListScope(availableScopes[0] ?? 'mine');
    }
  }, [availableScopes, listScope]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getPurchaseRequestsAction({
      page: pageIndex + 1,
      pageSize,
      scope: listScope,
      filterBy: appliedIdFilter.trim() ? 'id' : undefined,
      filterValue: appliedIdFilter.trim() || undefined,
    });
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      notifyError(res.error || 'خطا در دریافت درخواست‌های خرید');
    }
    setLoading(false);
  }, [appliedIdFilter, listScope, notifyError, pageIndex, pageSize]);

  const triggerLoad = useCallback(() => {
    startTransition(() => void load());
  }, [load, startTransition]);

  useEffect(() => {
    const t = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(t);
  }, [triggerLoad, pageIndex, appliedIdFilter, listScope]);

  const openedCreateRef = useRef(false);
  useEffect(() => {
    if (!openCreateFromQuery || openedCreateRef.current) return;
    openedCreateRef.current = true;
    const t = setTimeout(() => {
      setEditing(null);
      setModalOpen(true);
    }, 0);
    return () => clearTimeout(t);
  }, [openCreateFromQuery]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: PurchaseRequest) => {
    setEditing(row);
    setModalOpen(true);
  };

  const closeFormModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const openDetail = (id: number) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedId(null);
  };

  const handleDelete = useCallback(
    async (id: number) => {
      await executeDelete(() => deletePurchaseRequestAction(id), {
        successMessage: 'درخواست خرید حذف شد',
        errorMessage: 'حذف درخواست خرید ناموفق بود',
        onSuccess: () => {
          triggerLoad();
          if (editing?.id === id) closeFormModal();
          if (selectedId === id) closeDetail();
        },
      });
    },
    [closeDetail, closeFormModal, editing?.id, executeDelete, selectedId, triggerLoad],
  );

  const applyFilters = () => {
    setAppliedIdFilter(idFilter.trim());
    setPageIndex(0);
  };

  const showRequester = listScope !== 'mine';

  const columns = useMemo<ColumnDef<PurchaseRequest>[]>(
    () => [
      { accessorKey: 'id', header: 'شناسه' },
      ...(showRequester
        ? [
            {
              accessorKey: 'requesterName',
              header: 'درخواست‌کننده',
              cell: ({ row }: { row: { original: PurchaseRequest } }) =>
                row.original.requesterName ?? '—',
            } as ColumnDef<PurchaseRequest>,
          ]
        : []),
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => (
          <Badge className={purchaseRequestStatusClass[row.original.status] ?? ''}>
            {purchaseRequestStatusLabels[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: 'items',
        header: 'اقلام',
        cell: ({ row }) => (
          <span className="max-w-xs truncate block">
            {row.original.items.map((i) => `${i.itemName} (${i.quantity})`).join('، ')}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'تاریخ',
        cell: ({ row }) => (row.original.createdAt ? formatJalaliDate(row.original.createdAt) : '—'),
      },
      {
        id: 'actions',
        header: 'عملیات',
        cell: ({ row }) => {
          const editable = canEditPurchaseRequest(row.original);
          return (
            <div className="flex flex-wrap gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => openDetail(row.original.id)}>
                <Eye className="h-4 w-4" />
              </Button>
              {editable ? (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row.original)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={deletePending}
                    onClick={() => void handleDelete(row.original.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
            </div>
          );
        },
      },
    ],
    [deletePending, handleDelete, showRequester],
  );

  return (
    <DashboardPageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">درخواست‌های خرید</h1>
          <p className="text-sm text-muted-foreground">ثبت، ویرایش (قبل از تأیید)، پیگیری و پیش‌فاکتور</p>
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

      {availableScopes.length > 1 ? (
        <Tabs
          value={listScope}
          onValueChange={(v) => {
            setListScope(v as PurchaseRequestListScope);
            setPageIndex(0);
          }}
          className="mb-4"
        >
          <TabsList className="flex h-auto flex-wrap gap-1">
            {availableScopes.map((scope) => (
              <TabsTrigger key={scope} value={scope}>
                {purchaseRequestScopeLabel(scope)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-2 pt-6">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">شناسه درخواست</label>
            <Input
              className="w-40"
              value={idFilter}
              onChange={(e) => setIdFilter(e.target.value)}
              placeholder="جستجو با شناسه"
            />
          </div>
          <Button type="button" variant="secondary" onClick={applyFilters}>
            اعمال
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">لیست درخواست‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<PurchaseRequest>
            data={items}
            columns={columns}
            totalItems={total}
            isLoading={loading}
            pagination={{ pageIndex, pageSize }}
            onPaginationChange={(updater) => {
              const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
              setPageIndex(next.pageIndex);
            }}
            globalFilter=""
            onGlobalFilterChange={() => {}}
            columnFilters={[]}
            onColumnFiltersChange={() => {}}
            sorting={[]}
            onSortingChange={() => {}}
            columnVisibility={{}}
            onColumnVisibilityChange={() => {}}
            entityName="درخواست خرید"
            onRefresh={triggerLoad}
            onCreateClick={openCreate}
          />
        </CardContent>
      </Card>

      <PurchaseRequestFormModal
        open={modalOpen}
        editing={editing}
        onOpenChange={(open) => {
          if (!open) closeFormModal();
          else setModalOpen(true);
        }}
        onSaved={() => triggerLoad()}
      />

      <AdvancedModal
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) closeDetail();
          else setDetailOpen(true);
        }}
        title="جزئیات درخواست خرید"
        size="lg"
        footer={
          <Button type="button" variant="outline" onClick={closeDetail}>
            بستن
          </Button>
        }
      >
        {selectedId ? (
          <PurchaseRequestDetailPanel requestId={selectedId} onUpdated={() => triggerLoad()} />
        ) : (
          <p className="text-sm text-muted-foreground">موردی انتخاب نشده است.</p>
        )}
      </AdvancedModal>
    </DashboardPageShell>
  );
}

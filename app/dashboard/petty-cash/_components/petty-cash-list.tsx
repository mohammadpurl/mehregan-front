'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, Inbox, Loader2, Plus, Trash2 } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { deletePettyCashAction, getPettyCashByIdAction, getPettyCashEligibilityAction } from '@/app/_actions/petty-cash-actions';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import type { PettyCashEligibility, PettyCashResponse } from '../_types/petty-cash.types';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { usePettyCashList } from '../_hooks/use-petty-cash-list';
import {
  pettyCashScopeLabel,
  usePettyCashListCapabilities,
} from '../_hooks/use-petty-cash-list-capabilities';
import type { PettyCashListScope } from '@/app/_actions/petty-cash-actions';
import { pettyCashSettlementLabel, pettyCashStatusLabel } from '../_utils/petty-cash-labels';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { PettyCashNewForm } from './petty-cash-new-form';
import { PettyCashDetailPanel } from './petty-cash-detail-panel';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { canSettlePettyCash } from '../_utils/petty-cash-mapper';

export function PettyCashList() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('pettyCashId')?.trim() || '';
  const initialScope = (searchParams.get('scope')?.trim() || 'mine') as PettyCashListScope;
  const { scopes: availableScopes } = usePettyCashListCapabilities();
  const [listScope, setListScope] = useState<PettyCashListScope>(initialScope);
  const { executeDelete, deletePending } = useDeleteAction();
  const { items, total, isLoading, pagination, setPagination, load } = usePettyCashList(listScope);
  const [, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(Boolean(initialId));
  const [selected, setSelected] = useState<PettyCashResponse | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [eligibility, setEligibility] = useState<PettyCashEligibility | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const triggerLoad = useCallback(() => {
    startTransition(() => void load());
  }, [load, startTransition]);

  useEffect(() => {
    if (!availableScopes.includes(listScope)) {
      setListScope(availableScopes[0] ?? 'mine');
    }
  }, [availableScopes, listScope]);

  useEffect(() => {
    const t = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(t);
  }, [triggerLoad, pagination.pageIndex, pagination.pageSize, listScope]);

  useEffect(() => {
    void getPettyCashEligibilityAction().then((r) => {
      if (r.success && r.data) setEligibility(r.data);
    });
  }, [items]);

  const openDetail = useCallback(async (row: PettyCashResponse) => {
    setSelected(row);
    setDetailOpen(true);
    const refreshed = await getPettyCashByIdAction(row.id);
    if (refreshed.success && refreshed.data) setSelected(refreshed.data);
  }, []);

  useEffect(() => {
    if (!initialId || items.length === 0) return;
    const found = items.find((p) => String(p.id) === initialId);
    if (found) void openDetail(found);
    else {
      void getPettyCashByIdAction(initialId).then((r) => {
        if (r.success && r.data) {
          setSelected(r.data);
          setDetailOpen(true);
        }
      });
    }
  }, [initialId, items, openDetail]);

  const handleDelete = useCallback(
    async (id: number) => {
      await executeDelete(() => deletePettyCashAction(id), {
        successMessage: 'درخواست حذف شد',
        errorMessage: 'حذف ناموفق بود',
        onSuccess: () => {
          load();
          if (selected?.id === id) {
            setDetailOpen(false);
            setSelected(null);
          }
        },
      });
    },
    [executeDelete, load, selected?.id],
  );

  const columns = useMemo<ColumnDef<PettyCashResponse>[]>(
    () => [
      { accessorKey: 'id', header: 'شناسه' },
      {
        accessorKey: 'amount',
        header: 'مبلغ',
        cell: ({ row }) => formatAmount(row.original.amount, { unit: 'ریال' }),
      },
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => pettyCashStatusLabel(row.original.status),
      },
      {
        id: 'settlement',
        header: 'تسویه',
        cell: ({ row }) => pettyCashSettlementLabel(row.original.settlementStatus),
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
          const pending = String(row.original.status).toLowerCase() === 'pending';
          return (
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => void openDetail(row.original)}>
                <Eye className="h-4 w-4" />
              </Button>
              {pending && (
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
              )}
            </div>
          );
        },
      },
    ],
    [deletePending, handleDelete, openDetail],
  );

  const openCreate = () => {
    if (eligibility && !eligibility.canCreate) return;
    setCreateOpen(true);
  };

  return (
    <DashboardPageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تنخواه</h1>
          <p className="text-sm text-muted-foreground">
            ثبت مبلغ → تأیید مدیر مالی و مدیرعامل → ثبت خرج (دستی یا اکسل)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/petty-cash/ledger">دفتر تنخواه</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/petty-cash/settlement">ثبت خرج تنخواه</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/workflow/inbox">
              <Inbox className="ml-2 h-4 w-4" />
              کارتابل تأیید
            </Link>
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            disabled={eligibility != null && !eligibility.canCreate}
            title={eligibility && !eligibility.canCreate ? eligibility.message || eligibility.reason : undefined}
          >
            <Plus className="ml-2 h-4 w-4" />
            درخواست تنخواه جدید
          </Button>
        </div>
      </div>

      {eligibility && !eligibility.canCreate && (
        <Alert className="mb-4 border-amber-200/80 bg-amber-50/50">
          <AlertTitle>ثبت تنخواه جدید موقتاً غیرفعال است</AlertTitle>
          <AlertDescription className="text-sm">
            {eligibility.message || eligibility.reason || 'تنخواه قبلی را ابتدا تسویه کنید.'}
            {eligibility.blockingPettyCashId != null && (
              <>
                {' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void getPettyCashByIdAction(eligibility.blockingPettyCashId!).then((r) => {
                    if (r.success && r.data) void openDetail(r.data);
                  })}
                >
                  مشاهده تنخواه باز
                </button>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-medium">لیست تنخواه</CardTitle>
          {availableScopes.length > 1 ? (
            <Tabs
              value={listScope}
              onValueChange={(v) => {
                setListScope(v as PettyCashListScope);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <TabsList className="flex h-auto flex-wrap">
                {availableScopes.map((scope) => (
                  <TabsTrigger key={scope} value={scope}>
                    {pettyCashScopeLabel(scope)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<PettyCashResponse>
            columns={columns}
            data={items}
            totalItems={total}
            isLoading={isLoading}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={[]}
            onSortingChange={() => {}}
            globalFilter=""
            onGlobalFilterChange={() => {}}
            columnFilters={[]}
            onColumnFiltersChange={() => {}}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            entityName="تنخواه"
            columnSizingStorageKey="petty-cash-table"
            onRefresh={() => load()}
            onExport={async () => items}
          />
        </CardContent>
      </Card>

      <AdvancedModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="درخواست تنخواه جدید"
        description="پس از ثبت، درخواست برای تأیید مدیر مالی و مدیرعامل ارسال می‌شود."
        footer={
          <div className="flex gap-2">
            <Button type="submit" form="petty-cash-new-form" disabled={formBusy}>
              {formBusy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              ثبت
            </Button>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={formBusy}>
              انصراف
            </Button>
          </div>
        }
      >
        <PettyCashNewForm
          onSuccess={() => {
            setCreateOpen(false);
            load();
            void getPettyCashEligibilityAction().then((r) => {
              if (r.success && r.data) setEligibility(r.data);
            });
          }}
          onBusyChange={setFormBusy}
        />
      </AdvancedModal>

      <AdvancedModal
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        title={selected ? `تنخواه #${selected.id}` : 'جزئیات تنخواه'}
        size="lg"
        footer={
          selected && canSettlePettyCash(selected) ? (
            <p className="text-xs text-muted-foreground">اقلام هزینه را در همین صفحه ثبت کنید.</p>
          ) : null
        }
      >
        {selected ? (
          <PettyCashDetailPanel
            record={selected}
            onUpdated={(r) => {
              setSelected(r);
              load();
              void getPettyCashEligibilityAction().then((res) => {
                if (res.success && res.data) setEligibility(res.data);
              });
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
        )}
      </AdvancedModal>
    </DashboardPageShell>
  );
}


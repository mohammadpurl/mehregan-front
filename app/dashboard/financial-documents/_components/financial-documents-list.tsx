'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, Inbox, Loader2, Plus, Trash2 } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import {
  deleteFinancialDocumentAction,
  getFinancialDocumentByIdAction,
  getFinancialDocumentListAction,
  getFinancialDocumentListCapabilitiesAction,
  type FinancialDocumentListScope,
} from '@/app/_actions/financial-document-actions';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import type { FinancialDocumentResponse } from '../_types/financial-document.types';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  financialDocumentStatusLabel,
  financialDocumentTypeLabel,
} from '../_utils/financial-document-labels';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { FinancialDocumentNewForm } from './financial-document-new-form';
import { FinancialDocumentDetailPanel } from './financial-document-detail-panel';
import Link from 'next/link';

const SCOPE_LABELS: Record<FinancialDocumentListScope, string> = {
  mine: 'ثبت‌های من',
  team: 'تیم من',
  all: 'همه',
  approver: 'در انتظار تأیید من',
  participated: 'مشارکت‌کرده',
};

export function FinancialDocumentsList() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('financialDocumentId')?.trim() || '';
  const [availableScopes, setAvailableScopes] = useState<FinancialDocumentListScope[]>(['mine']);
  const [listScope, setListScope] = useState<FinancialDocumentListScope>('mine');
  const [items, setItems] = useState<FinancialDocumentResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(Boolean(initialId));
  const [selected, setSelected] = useState<FinancialDocumentResponse | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const { executeDelete, deletePending } = useDeleteAction();

  useEffect(() => {
    void getFinancialDocumentListCapabilitiesAction().then((r) => {
      if (r.success && r.data?.scopes?.length) setAvailableScopes(r.data.scopes);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getFinancialDocumentListAction({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      scope: listScope,
    });
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    }
    setLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, listScope]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openDetail = useCallback(async (row: FinancialDocumentResponse) => {
    setSelected(row);
    setDetailOpen(true);
    const refreshed = await getFinancialDocumentByIdAction(row.id);
    if (refreshed.success && refreshed.data) setSelected(refreshed.data);
  }, []);

  useEffect(() => {
    if (!initialId) return;
    const id = Number(initialId);
    if (!Number.isFinite(id)) return;
    const found = items.find((p) => p.id === id);
    if (found) void openDetail(found);
    else {
      void getFinancialDocumentByIdAction(id).then((r) => {
        if (r.success && r.data) {
          setSelected(r.data);
          setDetailOpen(true);
        }
      });
    }
  }, [initialId, items, openDetail]);

  const columns = useMemo<ColumnDef<FinancialDocumentResponse>[]>(
    () => [
      { accessorKey: 'id', header: 'شناسه' },
      {
        accessorKey: 'documentType',
        header: 'نوع',
        cell: ({ row }) => financialDocumentTypeLabel(row.original.documentType),
      },
      {
        accessorKey: 'amount',
        header: 'مبلغ',
        cell: ({ row }) =>
          row.original.amount != null && row.original.amount > 0
            ? formatAmount(row.original.amount, { unit: 'ریال' })
            : '—',
      },
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => financialDocumentStatusLabel(row.original.status),
      },
      {
        accessorKey: 'createdAt',
        header: 'تاریخ ثبت',
        cell: ({ row }) => (row.original.createdAt ? formatJalaliDate(row.original.createdAt) : '—'),
      },
      {
        id: 'actions',
        header: 'عملیات',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => void openDetail(row.original)}>
              <Eye className="ml-1 h-4 w-4" />
              جزئیات
            </Button>
            {row.original.workflowInstanceId && (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={`/dashboard/workflow/inbox?instanceId=${row.original.workflowInstanceId}`}>
                  <Inbox className="ml-1 h-4 w-4" />
                  کارتابل
                </Link>
              </Button>
            )}
            {row.original.status === 'pending' && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deletePending}
                onClick={() =>
                  void executeDelete(() => deleteFinancialDocumentAction(row.original.id), {
                    successMessage: 'سند حذف شد',
                    errorMessage: 'حذف ناموفق بود',
                    onSuccess: () => void load(),
                  })
                }
              >
                <Trash2 className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [openDetail, executeDelete, deletePending, load],
  );

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>لیست اسناد مالی</CardTitle>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="ml-1 h-4 w-4" />
            ثبت سند جدید
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={listScope} onValueChange={(v) => setListScope(v as FinancialDocumentListScope)}>
            <TabsList>
              {availableScopes.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {SCOPE_LABELS[s] ?? s}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال بارگذاری…
            </div>
          ) : (
            <AdvancedDataGrid<FinancialDocumentResponse>
              columns={columns}
              data={items}
              totalItems={total}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          )}
        </CardContent>
      </Card>

      <AdvancedModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="ثبت سند مالی"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <Button type="submit" form="financial-document-new-form" disabled={formBusy}>
              ثبت و ارسال
            </Button>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              انصراف
            </Button>
          </div>
        }
      >
        <FinancialDocumentNewForm
          onSuccess={() => {
            setCreateOpen(false);
            void load();
          }}
          onBusyChange={setFormBusy}
        />
      </AdvancedModal>

      <AdvancedModal open={detailOpen} onOpenChange={setDetailOpen} title="جزئیات سند مالی" size="lg">
        {selected ? <FinancialDocumentDetailPanel record={selected} /> : null}
      </AdvancedModal>
    </DashboardPageShell>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Plus } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { getAdHocTasksAction } from '@/app/_actions/ad-hoc-task-actions';
import type { AdHocTaskListItem } from '@/app/_types/ad-hoc-task.types';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { AdHocTaskCreateDialog } from './_components/ad-hoc-task-create-dialog';

type Scope = 'all' | 'mine' | 'assigned';

export default function AdHocTasksPage() {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>('all');
  const [items, setItems] = useState<AdHocTaskListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [canViewAll, setCanViewAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updated_at', desc: true }]);
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdHocTasksAction({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      scope,
    });
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
      setCanViewAll(Boolean(res.data.canViewAll));
    }
    setLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, scope]);

  useEffect(() => {
    const t = setTimeout(() => startTransition(() => void load()), 0);
    return () => clearTimeout(t);
  }, [load]);

  const columns = useMemo<ColumnDef<AdHocTaskListItem>[]>(
    () => [
      { accessorKey: 'title', header: 'عنوان' },
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => (row.original.status === 'open' ? 'باز' : 'بسته'),
      },
      { accessorKey: 'currentAssigneeName', header: 'گیرنده فعلی' },
      {
        accessorKey: 'dueAt',
        header: 'مهلت انجام',
        cell: ({ row }) =>
          row.original.dueAt
            ? formatJalaliDate(row.original.dueAt, { withTime: true, persianDigits: true })
            : '—',
      },
      { accessorKey: 'createdByName', header: 'ایجادکننده' },
      {
        accessorKey: 'updated_at',
        header: 'آخرین به‌روزرسانی',
        cell: ({ row }) =>
          formatJalaliDate(row.original.updatedAt, { withTime: true, persianDigits: true }),
      },
      {
        id: 'actions',
        header: 'عملیات',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/ad-hoc-tasks/${row.original.id}`)}
          >
            <Eye className="ml-1 h-4 w-4" />
            جزئیات
          </Button>
        ),
      },
    ],
    [router],
  );

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>کارهای پیش‌بینی‌نشده</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="ml-1 h-4 w-4" />
            کار جدید
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <TabsList>
              <TabsTrigger value="all">
                {canViewAll ? 'همه (سازمان)' : 'مرتبط با من'}
              </TabsTrigger>
              <TabsTrigger value="assigned">ارجاع‌شده به من</TabsTrigger>
              <TabsTrigger value="mine">ایجادشده توسط من</TabsTrigger>
            </TabsList>
          </Tabs>
          <AdvancedDataGrid<AdHocTaskListItem>
            data={items}
            columns={columns}
            totalItems={total}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={setSorting}
            isLoading={loading}
            entityName="کار"
            onRefresh={() => void load()}
            onExport={async () => items}
          />
        </CardContent>
      </Card>

      <AdHocTaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => router.push(`/dashboard/ad-hoc-tasks/${id}`)}
      />
    </DashboardPageShell>
  );
}

'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { useToast } from '@/hooks/use-toast';
import { getNotificationsAction, markNotificationReadAction } from '@/app/_actions/notification-actions';
import { NotificationCenterItem } from '@/app/_types/notification-center.types';
import { BadgeCheck, BellRing, Eye } from 'lucide-react';
import { useNotificationCenterStore } from '@/app/_store/notification-center.store';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { buildNotificationHref } from '@/app/utils/notification-href';

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<NotificationCenterItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const setReadLocal = useNotificationCenterStore((s) => s.setReadLocal);
  const fetchLatest = useNotificationCenterStore((s) => s.fetchLatest);

  const [unreadOnlyDraft, setUnreadOnlyDraft] = useState(false);
  const [unreadOnlyApplied, setUnreadOnlyApplied] = useState(false);

  const loadNotifications = useCallback(
    async (overrides?: { appliedGlobalFilter?: string; pageIndex?: number; unreadOnlyApplied?: boolean }) => {
      setLoading(true);
      const search = overrides?.appliedGlobalFilter ?? appliedGlobalFilter;
      const pageIndex = overrides?.pageIndex ?? pagination.pageIndex;
      const unreadOnly = overrides?.unreadOnlyApplied ?? unreadOnlyApplied;
      const result = await getNotificationsAction({
        page: pageIndex + 1,
        pageSize: pagination.pageSize,
        search: search || undefined,
        unreadOnly,
      });
      if (result.success && result.data) {
        setItems(result.data.items || []);
        setTotal(result.data.total || 0);
        setUnread(result.data.unread ?? (result.data.items || []).filter((i) => !i.is_read).length);
      } else {
        toast({ title: 'خطا', description: result.error || 'خطا در دریافت اعلان‌ها', variant: 'destructive' });
      }
      setLoading(false);
    },
    [appliedGlobalFilter, pagination.pageIndex, pagination.pageSize, toast, unreadOnlyApplied],
  );

  const triggerLoad = useCallback(() => {
    startTransition(() => void loadNotifications());
  }, [loadNotifications, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(timer);
  }, [triggerLoad]);

  const applyFilters = () => {
    const search = globalFilter.trim();
    setAppliedGlobalFilter(search);
    setUnreadOnlyApplied(unreadOnlyDraft);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    void loadNotifications({ appliedGlobalFilter: search, pageIndex: 0, unreadOnlyApplied: unreadOnlyDraft });
  };

  const markAsRead = async (id: string) => {
    setReadLocal(id);
    const res = await markNotificationReadAction(id);
    if (!res.success) {
      toast({ title: 'خطا', description: res.error || 'ثبت وضعیت خوانده‌شده ناموفق بود', variant: 'destructive' });
      return;
    }
    void fetchLatest(6);
    void loadNotifications();
  };

  const openItem = (item: NotificationCenterItem) => {
    const href = buildNotificationHref(item);
    if (!href) {
      toast({ title: 'مسیر نامشخص', description: 'برای این اعلان صفحهٔ نمایش تعریف نشده است.', variant: 'destructive' });
      return;
    }
    if (!item.is_read && !item.id.startsWith('inbox-')) {
      void markAsRead(item.id);
    }
    router.push(href);
  };

  const columns: ColumnDef<NotificationCenterItem>[] = [
    {
      accessorKey: 'title',
      header: 'عنوان',
      cell: ({ row }) => (
        <div className={row.original.is_read ? '' : 'font-semibold'}>{row.original.title || row.original.message}</div>
      ),
    },
    { accessorKey: 'message', header: 'متن' },
    { accessorKey: 'level', header: 'سطح' },
    {
      accessorKey: 'is_read',
      header: 'خوانده شده',
      cell: ({ row }) => (row.original.is_read ? 'بله' : 'خیر'),
    },
    {
      accessorKey: 'created_at',
      header: 'زمان',
      cell: ({ row }) => formatJalaliDate(row.original.created_at, { withTime: true }),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => openItem(row.original)}>
            <Eye className="ml-1 h-4 w-4" />
            نمایش
          </Button>
          {!row.original.is_read && !row.original.id.startsWith('inbox-') && (
            <Button type="button" size="sm" variant="ghost" onClick={() => void markAsRead(row.original.id)}>
              <BadgeCheck className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            مرکز اعلان‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<NotificationCenterItem>
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
            isLoading={loading || isPending}
            entityName={`اعلان‌ها (${unread} خوانده‌نشده)`}
            onRefresh={triggerLoad}
            onExport={async () => items}
            globalFilterForm={
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={unreadOnlyDraft}
                    onChange={(e) => setUnreadOnlyDraft(e.target.checked)}
                  />
                  فقط خوانده‌نشده‌ها
                </label>
                <div className="flex gap-2">
                  <Button type="button" onClick={applyFilters}>
                    اعمال فیلتر
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUnreadOnlyDraft(false);
                      setUnreadOnlyApplied(false);
                      setGlobalFilter('');
                      setAppliedGlobalFilter('');
                      setColumnFilters([]);
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                      void loadNotifications({ appliedGlobalFilter: '', pageIndex: 0, unreadOnlyApplied: false });
                    }}
                  >
                    پاک‌کردن
                  </Button>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}


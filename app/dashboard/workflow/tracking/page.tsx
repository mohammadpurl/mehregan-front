'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { AdvancedModal } from '@/app/components/Modal';
import {
  getWorkflowInstancesListCapabilitiesAction,
  getWorkflowInstancesQueryAction,
} from '@/app/_actions/workflow-actions';
import type { WorkflowInstanceListScope, WorkflowInstanceRow } from '@/app/_types/workflow.types';
import { formatJalaliDate } from '@/app/utils/jalali-date';

const SCOPE_LABELS: Record<WorkflowInstanceListScope, string> = {
  mine: 'مرتبط با من',
  team: 'واحد / زیرمجموعه',
  all: 'همه گردش‌کارها',
  approver: 'نیاز به تأیید من',
  participated: 'شرکت‌کرده در تأیید',
};

function refDetailHref(row: WorkflowInstanceRow): string {
  const rt = row.ref_type;
  const id = row.ref_id;
  if (rt === 'payment_request') return `/dashboard/payment-request?paymentId=${id}`;
  if rt === 'petty_cash') return `/dashboard/petty-cash?pettyCashId=${id}`;
  if (rt === 'mission_request') return `/dashboard/mission-requests?missionRequestId=${id}`;
  if (rt === 'financial_document') return `/dashboard/financial-documents?financialDocumentId=${id}`;
  if (rt === 'request' || rt === 'procurement' || rt === 'product_request') {
    return `/dashboard/procurement/requests?requestId=${id}`;
  }
  return `/dashboard/workflow/inbox?instanceId=${row.id}`;
}

export default function WorkflowTrackingPage() {
  const searchParams = useSearchParams();
  const initialScope = (searchParams.get('scope')?.trim() || 'mine') as WorkflowInstanceListScope;
  const initialInstanceId = searchParams.get('workflowId')?.trim() || searchParams.get('instanceId')?.trim() || '';
  const { toast } = useToast();

  const [availableScopes, setAvailableScopes] = useState<WorkflowInstanceListScope[]>(['mine', 'approver', 'participated']);
  const [listScope, setListScope] = useState<WorkflowInstanceListScope>(initialScope);
  const [rows, setRows] = useState<WorkflowInstanceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [appliedColumnFilters, setAppliedColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [advancedFilterId, setAdvancedFilterId] = useState(initialInstanceId);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<WorkflowInstanceRow | null>(null);

  useEffect(() => {
    void getWorkflowInstancesListCapabilitiesAction().then((r) => {
      if (r.success && r.data?.scopes?.length) setAvailableScopes(r.data.scopes);
    });
  }, []);

  useEffect(() => {
    if (!availableScopes.includes(listScope)) {
      setListScope(availableScopes[0] ?? 'mine');
    }
  }, [availableScopes, listScope]);

  const loadTracking = useCallback(
    async (overrides?: {
      appliedColumnFilters?: ColumnFiltersState;
      appliedGlobalFilter?: string;
      pageIndex?: number;
      id?: string;
      scope?: WorkflowInstanceListScope;
    }) => {
      setLoading(true);
      const filters = overrides?.appliedColumnFilters ?? appliedColumnFilters;
      const search = overrides?.appliedGlobalFilter ?? appliedGlobalFilter;
      const pageIndex = overrides?.pageIndex ?? pagination.pageIndex;
      const scope = overrides?.scope ?? listScope;
      const sortBy = sorting[0]?.id;
      const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
      const statusFilter = filters.find((f) => f.id === 'status')?.value;
      const id = overrides?.id ?? (advancedFilterId.trim() || undefined);

      const result = await getWorkflowInstancesQueryAction({
        page: pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy,
        sortOrder,
        search: search || undefined,
        status: statusFilter ? String(statusFilter) : undefined,
        id,
        scope,
      });

      if (result.success && result.data) {
        setRows(result.data.items || []);
        setTotal(result.data.total || 0);
      } else {
        toast({ title: 'خطا', description: result.error || 'خطا در دریافت پیگیری', variant: 'destructive' });
      }
      setLoading(false);
    },
    [advancedFilterId, appliedColumnFilters, appliedGlobalFilter, listScope, pagination.pageIndex, pagination.pageSize, sorting, toast],
  );

  const triggerLoad = useCallback(() => {
    startTransition(() => void loadTracking());
  }, [loadTracking, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(timer);
  }, [triggerLoad, listScope]);

  const columns: ColumnDef<WorkflowInstanceRow>[] = [
    { accessorKey: 'id', header: 'شناسه' },
    { accessorKey: 'ref_label', header: 'نوع' },
    {
      accessorKey: 'title',
      header: 'عنوان',
      cell: ({ row }) => (
        <Link href={refDetailHref(row.original)} className="text-primary hover:underline">
          {row.original.title}
        </Link>
      ),
    },
    { accessorKey: 'requester_name', header: 'درخواست‌کننده' },
    { accessorKey: 'current_assignee_name', header: 'تأییدکننده فعلی' },
    { accessorKey: 'status', header: 'وضعیت' },
    {
      accessorKey: 'updated_at',
      header: 'آخرین تغییر',
      cell: ({ row }) =>
        row.original.updated_at ? formatJalaliDate(row.original.updated_at, { withTime: true }) : '—',
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected(row.original);
              setDetailsOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/workflow/instances/${row.original.id}`}>تایم‌لاین</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/workflow/inbox?instanceId=${row.original.id}`}>کارتابل</Link>
          </Button>
        </div>
      ),
    },
  ];

  const applyAdvancedFilters = () => {
    const next: ColumnFiltersState = [...columnFilters];
    setAppliedColumnFilters(next);
    const search = globalFilter.trim();
    setAppliedGlobalFilter(search);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    void loadTracking({
      appliedColumnFilters: next,
      appliedGlobalFilter: search,
      pageIndex: 0,
      id: advancedFilterId.trim() || undefined,
    });
  };

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>پیگیری گردش‌کار سازمانی</CardTitle>
          {availableScopes.length > 1 ? (
            <Tabs
              value={listScope}
              onValueChange={(v) => {
                setListScope(v as WorkflowInstanceListScope);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <TabsList className="flex h-auto flex-wrap">
                {availableScopes.map((scope) => (
                  <TabsTrigger key={scope} value={scope}>
                    {SCOPE_LABELS[scope]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<WorkflowInstanceRow>
            data={rows}
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
            entityName="پیگیری"
            onRefresh={triggerLoad}
            onExport={async () => rows}
            globalFilterForm={
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    placeholder="شناسه نمونه گردش‌کار"
                    value={advancedFilterId}
                    onChange={(e) => setAdvancedFilterId(e.target.value)}
                  />
                  <Input
                    placeholder="وضعیت (pending / approved / rejected)"
                    value={String(columnFilters.find((f) => f.id === 'status')?.value ?? '')}
                    onChange={(e) => {
                      const v = e.target.value;
                      setColumnFilters((prev) => {
                        const rest = prev.filter((f) => f.id !== 'status');
                        return v.trim() ? [...rest, { id: 'status', value: v.trim() }] : rest;
                      });
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={applyAdvancedFilters}>
                    اعمال فیلتر
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAdvancedFilterId('');
                      setColumnFilters([]);
                      setAppliedColumnFilters([]);
                      setGlobalFilter('');
                      setAppliedGlobalFilter('');
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                      void loadTracking({
                        appliedColumnFilters: [],
                        appliedGlobalFilter: '',
                        pageIndex: 0,
                        id: undefined,
                      });
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

      <AdvancedModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title="جزئیات گردش‌کار"
        size="lg"
        footer={
          <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)}>
            بستن
          </Button>
        }
      >
        {!selected ? (
          <div className="text-sm text-muted-foreground">موردی انتخاب نشده است.</div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <span className="text-muted-foreground">شناسه:</span> {selected.id}
              </div>
              <div>
                <span className="text-muted-foreground">وضعیت:</span> {selected.status}
              </div>
              <div className="md:col-span-2">
                <span className="text-muted-foreground">عنوان:</span> {selected.title}
              </div>
              <div>
                <span className="text-muted-foreground">درخواست‌کننده:</span>{' '}
                {selected.requester_name || '—'}
              </div>
              <div>
                <span className="text-muted-foreground">تأییدکننده فعلی:</span>{' '}
                {selected.current_assignee_name || '—'}
              </div>
            </div>
            <Button asChild variant="secondary">
              <Link href={`/dashboard/workflow/instances/${selected.id}`}>تایم‌لاین تأیید</Link>
            </Button>
            <Button asChild>
              <Link href={refDetailHref(selected)}>مشاهده درخواست مرتبط</Link>
            </Button>
          </div>
        )}
      </AdvancedModal>
    </DashboardPageShell>
  );
}

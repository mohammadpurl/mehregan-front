'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { AdvancedModal } from '@/app/components/Modal';
import { WorkflowResponse } from '@/app/_types/workflow.types';
import { getWorkflowsQueryAction } from '@/app/_actions/workflow-actions';
import { useSearchParams } from 'next/navigation';
import { formatJalaliDate } from '@/app/utils/jalali-date';

export default function WorkflowTrackingPage() {
  const searchParams = useSearchParams();
  const initialWorkflowId = searchParams.get('workflowId')?.trim() || '';
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
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

  const [advancedFilterId, setAdvancedFilterId] = useState(initialWorkflowId);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadTracking = useCallback(
    async (overrides?: { appliedColumnFilters?: ColumnFiltersState; appliedGlobalFilter?: string; pageIndex?: number; id?: string }) => {
      setLoading(true);
      const filters = overrides?.appliedColumnFilters ?? appliedColumnFilters;
      const search = overrides?.appliedGlobalFilter ?? appliedGlobalFilter;
      const pageIndex = overrides?.pageIndex ?? pagination.pageIndex;
      const sortBy = sorting[0]?.id;
      const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
      const statusFilter = filters.find((f) => f.id === 'status')?.value;
      const id = overrides?.id ?? (advancedFilterId.trim() || undefined);

      const result = await getWorkflowsQueryAction({
        page: pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy,
        sortOrder,
        search: search || undefined,
        status: statusFilter ? String(statusFilter) : undefined,
        id: id || undefined,
      });

      if (result.success && result.data) {
        setWorkflows(result.data.items || []);
        setTotal(result.data.total || 0);
      } else {
        toast({ title: 'خطا', description: result.error || 'خطا در دریافت پیگیری', variant: 'destructive' });
      }
      setLoading(false);
    },
    [advancedFilterId, appliedColumnFilters, appliedGlobalFilter, pagination.pageIndex, pagination.pageSize, sorting, toast],
  );

  const triggerLoad = useCallback(() => {
    startTransition(() => void loadTracking());
  }, [loadTracking, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(timer);
  }, [triggerLoad]);

  const selectedWorkflow = useMemo(
    () => workflows.find((w) => w.id === selectedId) || null,
    [workflows, selectedId],
  );

  const applyAdvancedFilters = () => {
    const next: ColumnFiltersState = [...columnFilters];
    setAppliedColumnFilters(next);
    const search = globalFilter.trim();
    setAppliedGlobalFilter(search);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    void loadTracking({ appliedColumnFilters: next, appliedGlobalFilter: search, pageIndex: 0, id: advancedFilterId.trim() || undefined });
  };

  const columns: ColumnDef<WorkflowResponse>[] = [
    { accessorKey: 'id', header: 'شناسه' },
    { accessorKey: 'title', header: 'عنوان' },
    { accessorKey: 'status', header: 'وضعیت' },
    {
      accessorKey: 'updatedAt',
      header: 'آخرین تغییر',
      cell: ({ row }) => formatJalaliDate(row.original.updatedAt, { withTime: true }),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedId(row.original.id);
              setDetailsOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle>پیگیری گردش کار</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<WorkflowResponse>
            data={workflows}
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
            onExport={async () => workflows}
            globalFilterForm={
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    placeholder="شناسه گردش کار"
                    value={advancedFilterId}
                    onChange={(e) => setAdvancedFilterId(e.target.value)}
                  />
                  <Input
                    placeholder="فیلتر وضعیت (pending/in_progress/...)"
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
                      void loadTracking({ appliedColumnFilters: [], appliedGlobalFilter: '', pageIndex: 0, id: undefined });
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
        title="جزئیات"
        size="lg"
        footer={
          <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)}>
            بستن
          </Button>
        }
      >
        {!selectedWorkflow ? (
          <div className="text-sm text-muted-foreground">موردی انتخاب نشده است.</div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div><span className="text-muted-foreground">شناسه:</span> {selectedWorkflow.id}</div>
              <div><span className="text-muted-foreground">وضعیت:</span> {selectedWorkflow.status}</div>
              <div className="md:col-span-2"><span className="text-muted-foreground">عنوان:</span> {selectedWorkflow.title}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">توضیحات</div>
              <div className="whitespace-pre-wrap rounded-lg border p-3 bg-background">{selectedWorkflow.description}</div>
            </div>
          </div>
        )}
      </AdvancedModal>
    </DashboardPageShell>
  );
}


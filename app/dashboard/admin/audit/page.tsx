'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { getAuditLogsAction, type AuditLogRow } from '@/app/_actions/audit-actions';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck } from 'lucide-react';

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAuditLogsAction({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      entity: entityFilter.trim() || undefined,
      action: actionFilter.trim() || undefined,
    });
    if (res.success && res.data) {
      setRows(res.data.items);
      setTotal(res.data.total);
    } else {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
    }
    setLoading(false);
  }, [actionFilter, entityFilter, pagination.pageIndex, pagination.pageSize, toast]);

  useEffect(() => {
    startTransition(() => void load());
  }, [load]);

  const columns: ColumnDef<AuditLogRow>[] = [
    { accessorKey: 'id', header: 'شناسه' },
    { accessorKey: 'created_at', header: 'زمان', cell: ({ row }) =>
      row.original.created_at ? formatJalaliDate(row.original.created_at, { withTime: true }) : '—' },
    { accessorKey: 'user_name', header: 'کاربر' },
    { accessorKey: 'action', header: 'عمل' },
    { accessorKey: 'entity', header: 'موجودیت' },
    { accessorKey: 'entity_id', header: 'شناسه موجودیت' },
  ];

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            مرکز ممیزی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Input
              placeholder="موجودیت (مثلاً workflow_instance)"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="max-w-xs"
            />
            <Input
              placeholder="عمل (مثلاً workflow.approved)"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="max-w-xs"
            />
            <Button type="button" onClick={() => void load()}>
              اعمال فیلتر
            </Button>
          </div>
          <AdvancedDataGrid<AuditLogRow>
            data={rows}
            columns={columns}
            totalItems={total}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={loading || isPending}
            entityName="audit"
            onRefresh={() => void load()}
            onExport={async () => rows}
          />
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}

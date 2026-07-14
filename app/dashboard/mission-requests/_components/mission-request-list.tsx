'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  deleteMissionRequestAction,
  getMissionRequestByIdAction,
  getMissionRequestListAction,
  getMissionRequestListCapabilitiesAction,
} from '@/app/_actions/mission-request-actions';
import type { MissionListScope, MissionRequestResponse } from '../_types/mission-request.types';
import { missionStatusLabel } from '../_utils/mission-request-labels';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { MissionRequestNewForm } from './mission-request-new-form';
import { MissionRequestDetailPanel } from './mission-request-detail-panel';
import { useDeleteAction } from '@/app/hooks/use-delete-action';

const SCOPE_LABELS: Record<MissionListScope, string> = {
  mine: 'درخواست‌های من',
  team: 'واحد / زیرمجموعه',
  all: 'همه',
  approver: 'نیاز به تأیید من',
  participated: 'شرکت‌کرده در تأیید',
};

export function MissionRequestList() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('missionRequestId')?.trim() || '';
  const [availableScopes, setAvailableScopes] = useState<MissionListScope[]>(['mine']);
  const [listScope, setListScope] = useState<MissionListScope>('mine');
  const [items, setItems] = useState<MissionRequestResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(Boolean(initialId));
  const [selected, setSelected] = useState<MissionRequestResponse | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [, startTransition] = useTransition();
  const { executeDelete, deletePending } = useDeleteAction();

  useEffect(() => {
    void getMissionRequestListCapabilitiesAction().then((r) => {
      if (r.success && r.data?.scopes?.length) setAvailableScopes(r.data.scopes);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getMissionRequestListAction({
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
    const t = setTimeout(() => startTransition(() => void load()), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openDetail = useCallback(async (row: MissionRequestResponse) => {
    setSelected(row);
    setDetailOpen(true);
    const refreshed = await getMissionRequestByIdAction(row.id);
    if (refreshed.success && refreshed.data) setSelected(refreshed.data);
  }, []);

  useEffect(() => {
    if (!initialId || items.length === 0) return;
    const found = items.find((p) => String(p.id) === initialId);
    if (found) void openDetail(found);
    else {
      void getMissionRequestByIdAction(initialId).then((r) => {
        if (r.success && r.data) {
          setSelected(r.data);
          setDetailOpen(true);
        }
      });
    }
  }, [initialId, items, openDetail]);

  const columns = useMemo<ColumnDef<MissionRequestResponse>[]>(
    () => [
      { accessorKey: 'destination', header: 'محل ماموریت' },
      { accessorKey: 'vehicle', header: 'وسیله نقلیه' },
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => missionStatusLabel(row.original.status),
      },
      { accessorKey: 'requesterName', header: 'درخواست‌کننده' },
      {
        accessorKey: 'createdAt',
        header: 'تاریخ ثبت',
        cell: ({ row }) =>
          row.original.createdAt
            ? formatJalaliDate(row.original.createdAt, { withTime: true, persianDigits: true })
            : '—',
      },
      {
        id: 'actions',
        header: 'عملیات',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => void openDetail(row.original)}>
              <Eye className="ml-1 h-4 w-4" />
              جزئیات
            </Button>
            {row.original.status === 'PENDING' ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={deletePending}
                onClick={() =>
                  void executeDelete(() => deleteMissionRequestAction(row.original.id), {
                    successMessage: 'درخواست حذف شد',
                    onSuccess: () => void load(),
                  })
                }
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [deletePending, executeDelete, load, openDetail],
  );

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>درخواست ماموریت</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="ml-1 h-4 w-4" />
            درخواست جدید
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={listScope} onValueChange={(v) => setListScope(v as MissionListScope)}>
            <TabsList>
              {availableScopes.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {SCOPE_LABELS[s] ?? s}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <AdvancedDataGrid<MissionRequestResponse>
            data={items}
            columns={columns}
            totalItems={total}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={[]}
            onSortingChange={() => {}}
            isLoading={loading}
            entityName="درخواست"
            onRefresh={() => void load()}
            onExport={async () => items}
          />
        </CardContent>
      </Card>

      <AdvancedModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="ثبت درخواست ماموریت"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={formBusy}>
              انصراف
            </Button>
            <Button type="submit" form="mission-request-new-form" disabled={formBusy}>
              ثبت و ارسال
            </Button>
          </>
        }
      >
        <MissionRequestNewForm
          onSuccess={() => {
            setCreateOpen(false);
            void load();
          }}
          onBusyChange={setFormBusy}
        />
      </AdvancedModal>

      <AdvancedModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="جزئیات درخواست ماموریت"
        size="lg"
      >
        {selected ? (
          <MissionRequestDetailPanel
            data={selected}
            onUpdated={(updated) => {
              setSelected(updated);
              void load();
            }}
          />
        ) : null}
      </AdvancedModal>
    </DashboardPageShell>
  );
}

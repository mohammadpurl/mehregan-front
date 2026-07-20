'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { getExecutiveSlaReportAction } from '@/app/_actions/sla-report-actions';
import type { SlaReport, SlaReportItem } from '@/app/_types/sla-report.types';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { cn } from '@/lib/utils';
import { Timer, TrendingUp } from 'lucide-react';

const REF_TYPE_OPTIONS = [
  { value: '', label: 'همه انواع' },
  { value: 'payment_request', label: 'درخواست مالی' },
  { value: 'payment_order', label: 'دستور پرداخت' },
  { value: 'financial_document', label: 'سند مالی' },
  { value: 'petty_cash', label: 'تنخواه' },
  { value: 'purchase_request', label: 'درخواست خرید' },
  { value: 'workflow_form', label: 'درخواست اداری' },
  { value: 'warehouse_form', label: 'فرم انبار' },
  { value: 'mission_request', label: 'درخواست ماموریت' },
  { value: 'ad_hoc_task', label: 'کار ارجاعی / پیش‌بینی‌نشده' },
];

function statusBadgeClass(status: SlaReportItem['status']) {
  switch (status) {
    case 'on_time':
      return 'bg-teal-50 text-teal-800 ring-teal-100';
    case 'late':
      return 'bg-amber-50 text-amber-900 ring-amber-100';
    case 'overdue':
      return 'bg-rose-50 text-rose-800 ring-rose-100';
    case 'in_progress':
      return 'bg-sky-50 text-sky-800 ring-sky-100';
    case 'without_deadline':
      return 'bg-violet-50 text-violet-800 ring-violet-100';
    case 'unknown':
      return 'bg-slate-50 text-slate-700 ring-slate-200';
    default:
      return 'bg-muted text-muted-foreground ring-border';
  }
}

function formatDuration(minutes: number | null | undefined) {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} دقیقه`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ساعت و ${m} دقیقه` : `${h} ساعت`;
}

function itemHref(item: SlaReportItem): string | null {
  if (item.kind === 'ad_hoc' && item.taskId) {
    return `/dashboard/ad-hoc-tasks/${item.taskId}`;
  }
  if (item.kind === 'workflow' && item.instanceId) {
    return `/dashboard/workflow/tracking?instanceId=${item.instanceId}`;
  }
  return null;
}

export default function SlaReportPage() {
  const [report, setReport] = useState<SlaReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refType, setRefType] = useState('');
  const [kind, setKind] = useState('all');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getExecutiveSlaReportAction({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      refType: refType || undefined,
      kind,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    });
    if (res.success && res.data) setReport(res.data);
    setLoading(false);
  }, [dateFrom, dateTo, refType, kind, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    const t = setTimeout(() => startTransition(() => void load()), 0);
    return () => clearTimeout(t);
  }, [load]);

  const columns = useMemo<ColumnDef<SlaReportItem>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'عنوان',
        cell: ({ row }) => {
          const href = itemHref(row.original);
          const title = row.original.title;
          return href ? (
            <Link href={href} className="font-medium text-primary hover:underline">
              {title}
            </Link>
          ) : (
            title
          );
        },
      },
      {
        accessorKey: 'kind',
        header: 'نوع',
        cell: ({ row }) => (row.original.kind === 'ad_hoc' ? 'پیش‌بینی‌نشده' : row.original.refLabel),
      },
      { accessorKey: 'assigneeName', header: 'مسئول' },
      {
        accessorKey: 'startedAt',
        header: 'شروع',
        cell: ({ row }) =>
          row.original.startedAt
            ? formatJalaliDate(row.original.startedAt, { withTime: true, persianDigits: true })
            : '—',
      },
      {
        accessorKey: 'dueAt',
        header: 'مهلت',
        cell: ({ row }) =>
          row.original.dueAt
            ? formatJalaliDate(row.original.dueAt, { withTime: true, persianDigits: true })
            : '—',
      },
      {
        accessorKey: 'completedAt',
        header: 'زمان انجام',
        cell: ({ row }) =>
          row.original.completedAt
            ? formatJalaliDate(row.original.completedAt, { withTime: true, persianDigits: true })
            : '—',
      },
      {
        accessorKey: 'durationMinutes',
        header: 'مدت',
        cell: ({ row }) => formatDuration(row.original.durationMinutes),
      },
      {
        accessorKey: 'statusLabel',
        header: 'وضعیت SLA',
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
              statusBadgeClass(row.original.status),
            )}
          >
            {row.original.statusLabel}
          </span>
        ),
      },
    ],
    [],
  );

  const summary = report?.summary;

  return (
    <DashboardPageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">گزارش SLA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            زمان انجام کارها توسط اشخاص — برای مدیرعامل و پیگیری مدیریتی
          </p>
        </div>

        {summary ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">کل موارد</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold tabular-nums">{summary.total}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-teal-700">به‌موقع</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold tabular-nums text-teal-700">{summary.onTime}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-700">با تأخیر</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold tabular-nums text-amber-700">{summary.late}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-rose-700">معوق</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold tabular-nums text-rose-700">
                {summary.overduePending}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-violet-700">بدون مهلت</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold tabular-nums text-violet-700">
                {summary.withoutDeadline}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">نامشخص</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold tabular-nums text-slate-700">
                {summary.unknown}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">نرخ رعایت SLA</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-2xl font-bold tabular-nums">
                <TrendingUp className="h-5 w-5 text-primary" />
                {summary.complianceRatePercent}%
              </CardContent>
            </Card>
          </div>
        ) : null}

        {summary && summary.byAssignee.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">عملکرد افراد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b text-right text-muted-foreground">
                      <th className="pb-2 pe-4 font-medium">نام</th>
                      <th className="pb-2 pe-4 font-medium">کل</th>
                      <th className="pb-2 pe-4 font-medium">به‌موقع</th>
                      <th className="pb-2 pe-4 font-medium">تأخیر</th>
                      <th className="pb-2 pe-4 font-medium">معوق</th>
                      <th className="pb-2 pe-4 font-medium">میانگین مدت</th>
                      <th className="pb-2 font-medium">رعایت SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.byAssignee.map((row) => (
                      <tr key={row.userId} className="border-b last:border-0">
                        <td className="py-2.5 pe-4 font-medium">{row.assigneeName ?? `#${row.userId}`}</td>
                        <td className="py-2.5 pe-4 tabular-nums">{row.total}</td>
                        <td className="py-2.5 pe-4 tabular-nums text-teal-700">{row.onTime}</td>
                        <td className="py-2.5 pe-4 tabular-nums text-amber-700">{row.late}</td>
                        <td className="py-2.5 pe-4 tabular-nums text-rose-700">{row.overdue}</td>
                        <td className="py-2.5 pe-4">{formatDuration(row.avgDurationMinutes ?? null)}</td>
                        <td className="py-2.5 tabular-nums">
                          {row.complianceRatePercent != null ? `${row.complianceRatePercent}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-4 w-4" />
              فیلترها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">از تاریخ</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                    setDateFrom(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">تا تاریخ</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                    setDateTo(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>نوع گردش‌کار</Label>
                <Select
                  value={refType || '__all__'}
                  onValueChange={(v) => {
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                    setRefType(v === '__all__' ? '' : v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه" />
                  </SelectTrigger>
                  <SelectContent>
                    {REF_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value || '__all__'} value={opt.value || '__all__'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>دسته</Label>
                <Select
                  value={kind}
                  onValueChange={(v) => {
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                    setKind(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="workflow">گردش‌کار</SelectItem>
                    <SelectItem value="ad_hoc">پیش‌بینی‌نشده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                بروزرسانی
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">جزئیات موارد</CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedDataGrid<SlaReportItem>
              data={report?.items ?? []}
              columns={columns}
              totalItems={report?.pagination.total ?? 0}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={[]}
              onSortingChange={() => {}}
              isLoading={loading}
              entityName="مورد SLA"
              onRefresh={() => void load()}
              onExport={async () => report?.items ?? []}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardPageShell>
  );
}

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
import { JalaliDateInput } from '@/app/components/ui/jalali-date-input';
import {
  exportRequestsReportAction,
  getRequestTypesAction,
  getRequestsReportAction,
} from '@/app/_actions/requests-report-actions';
import { lookupUsersForManagerAction } from '@/app/_actions/user-actions';
import type { RequestReportItem, RequestReportTypeOption } from '@/app/_types/requests-report.types';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { formatAmount } from '@/app/utils/number-format';
import { downloadBase64File } from '@/app/utils/download-base64.client';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet } from 'lucide-react';

const FALLBACK_TYPES: RequestReportTypeOption[] = [
  { value: 'payment_request', label: 'درخواست مالی (وام/مساعده)' },
  { value: 'payment_order', label: 'دستور پرداخت' },
  { value: 'petty_cash', label: 'تنخواه' },
  { value: 'financial_document', label: 'سند مالی' },
  { value: 'purchase_request', label: 'درخواست خرید' },
  { value: 'mission_request', label: 'درخواست ماموریت' },
  { value: 'warehouse_form', label: 'فرم انبار' },
  { value: 'workflow_form', label: 'درخواست اداری' },
];

function itemHref(item: RequestReportItem): string | null {
  if (item.workflowInstanceId) {
    return `/dashboard/workflow/tracking?instanceId=${item.workflowInstanceId}`;
  }
  switch (item.refType) {
    case 'payment_request':
    case 'payment_order':
      return item.businessRefId || item.id
        ? `/dashboard/payment-request?paymentRequestId=${item.businessRefId || item.id}`
        : null;
    case 'petty_cash':
      return item.businessRefId || item.id
        ? `/dashboard/petty-cash?pettyCashId=${item.businessRefId || item.id}`
        : null;
    case 'purchase_request':
    case 'request':
      return item.businessRefId || item.id
        ? `/dashboard/procurement/requests?purchaseRequestId=${item.businessRefId || item.id}`
        : null;
    case 'mission_request':
      return item.businessRefId || item.id
        ? `/dashboard/mission-requests?missionRequestId=${item.businessRefId || item.id}`
        : null;
    case 'financial_document':
      return item.businessRefId || item.id
        ? `/dashboard/financial-documents?financialDocumentId=${item.businessRefId || item.id}`
        : null;
    default:
      return null;
  }
}

export default function RequestsReportPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<RequestReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refTypes, setRefTypes] = useState<RequestReportTypeOption[]>(FALLBACK_TYPES);
  const [refType, setRefType] = useState('');
  const [requesterId, setRequesterId] = useState('');
  const [requesterOptions, setRequesterOptions] = useState<{ id: number; label: string }[]>([]);
  const [requesterSearch, setRequesterSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [, startTransition] = useTransition();

  useEffect(() => {
    void getRequestTypesAction().then((res) => {
      if (res.success && res.data.length) setRefTypes(res.data);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void lookupUsersForManagerAction({
        search: requesterSearch,
        page: 1,
        pageSize: 30,
      }).then((res) => {
        if (res.success && res.data) setRequesterOptions(res.data.items);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [requesterSearch]);

  const filters = useMemo(
    () => ({
      refType: refType || undefined,
      requesterId: requesterId ? Number(requesterId) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    }),
    [refType, requesterId, dateFrom, dateTo, pagination.pageIndex, pagination.pageSize],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getRequestsReportAction(filters);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    } else {
      setItems([]);
      setTotal(0);
      toast({
        title: 'خطا',
        description: res.success === false ? res.error : 'بارگذاری گزارش ناموفق بود',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [filters, toast]);

  useEffect(() => {
    const t = setTimeout(() => startTransition(() => void load()), 0);
    return () => clearTimeout(t);
  }, [load]);

  const onExport = async () => {
    setExporting(true);
    const res = await exportRequestsReportAction({
      refType: filters.refType,
      requesterId: filters.requesterId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });
    setExporting(false);
    if (!res.success || !res.data) {
      toast({
        title: 'خروجی اکسل ناموفق',
        description: res.success === false ? res.error : undefined,
        variant: 'destructive',
      });
      return;
    }
    downloadBase64File(res.data.base64, res.data.filename, res.data.contentType);
    toast({ title: 'فایل اکسل دانلود شد' });
  };

  const columns = useMemo<ColumnDef<RequestReportItem>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'عنوان',
        cell: ({ row }) => {
          const href = itemHref(row.original);
          const title = row.original.title || '—';
          return href ? (
            <Link href={href} className="font-medium text-primary hover:underline">
              {title}
            </Link>
          ) : (
            <span className="font-medium">{title}</span>
          );
        },
      },
      {
        accessorKey: 'refLabel',
        header: 'نوع درخواست',
        cell: ({ row }) => row.original.refLabel || row.original.refType || '—',
      },
      {
        accessorKey: 'requesterName',
        header: 'درخواست‌دهنده',
        cell: ({ row }) => row.original.requesterName || '—',
      },
      {
        accessorKey: 'amount',
        header: 'مبلغ',
        cell: ({ row }) =>
          row.original.amount != null
            ? formatAmount(row.original.amount, { unit: 'ریال' })
            : '—',
      },
      {
        accessorKey: 'statusLabel',
        header: 'وضعیت درخواست',
        cell: ({ row }) => row.original.statusLabel || row.original.status || '—',
      },
      {
        id: 'workflowStatus',
        header: 'وضعیت گردش‌کار',
        cell: ({ row }) =>
          row.original.workflowStatusLabel || row.original.workflowStatus || '—',
      },
      {
        accessorKey: 'createdAt',
        header: 'تاریخ ثبت',
        cell: ({ row }) =>
          row.original.createdAt
            ? formatJalaliDate(row.original.createdAt, { withTime: true })
            : '—',
      },
      {
        id: 'workflowLink',
        header: 'پیگیری',
        cell: ({ row }) => {
          const id = row.original.workflowInstanceId;
          if (!id) return '—';
          return (
            <Link
              href={`/dashboard/workflow/tracking?instanceId=${id}`}
              className="text-primary hover:underline"
            >
              #{id}
            </Link>
          );
        },
      },
    ],
    [],
  );

  return (
    <DashboardPageShell>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            گزارش درخواست‌ها
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            فیلتر بر اساس نوع درخواست، درخواست‌دهنده و بازه تاریخ — خروجی اکسل
          </p>
        </div>
        <Button type="button" onClick={() => void onExport()} disabled={exporting || loading}>
          <Download className="ml-1 h-4 w-4" />
          {exporting ? 'در حال آماده‌سازی…' : 'خروجی اکسل'}
        </Button>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">فیلترها</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label>نوع درخواست</Label>
            <Select
              value={refType || '__all__'}
              onValueChange={(v) => {
                setRefType(v === '__all__' ? '' : v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="همه انواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">همه انواع</SelectItem>
                {refTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>درخواست‌دهنده</Label>
            <Input
              value={requesterSearch}
              onChange={(e) => setRequesterSearch(e.target.value)}
              placeholder="جستجوی نام کاربر…"
              className="mb-1"
            />
            <Select
              value={requesterId || '__all__'}
              onValueChange={(v) => {
                setRequesterId(v === '__all__' ? '' : v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="همه درخواست‌دهندگان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">همه درخواست‌دهندگان</SelectItem>
                {requesterOptions.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>از تاریخ</Label>
            <JalaliDateInput
              value={dateFrom}
              onChange={(v) => {
                setDateFrom(v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>تا تاریخ</Label>
            <JalaliDateInput
              value={dateTo}
              onChange={(v) => {
                setDateTo(v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <AdvancedDataGrid<RequestReportItem>
            data={items}
            columns={columns}
            totalItems={total}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={loading}
            entityName="درخواست"
            onRefresh={() => void load()}
          />
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}

'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import { FormGenerator } from '@/app/components/form-input/form-generator/form-generator';
import { FormSchema } from '@/app/components/form-input/form-generator/form-generator.types';
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import Link from 'next/link';
import { Loader2, PackageCheck, Pencil, Trash2 } from 'lucide-react';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { useFormAction } from '@/app/hooks/use-form-action';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import {
  createPurchaseOrderAction,
  deletePurchaseOrderAction,
  getPurchaseOrdersAction,
  updatePurchaseOrderAction,
} from '@/app/_actions/purchase-order-actions';
import { PurchaseOrder } from '@/app/_types/purchase-order.types';
import { PurchaseOrderCreateSchema, PurchaseOrderUpdateSchema } from '@/app/_types/purchase-order.schema';

function parseOptionalNumber(value: string | undefined | null): number | undefined {
  const s = String(value ?? '').trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

type PurchaseOrderFormSubmit = {
  request_id: string;
  supplier_name: string;
  item_name: string;
  quantity: string;
  unit_price: string;
  expected_date: string;
  status: 'draft' | 'pending' | 'approved' | 'sent' | 'closed' | 'cancelled';
  description: string;
};

export default function ProcurementOrdersPage() {
  const searchParams = useSearchParams();
  const initialRequestId = searchParams.get('requestId')?.trim() || '';
  const { notifyError, notifySuccess } = useFormAction();
  const { executeDelete } = useDeleteAction();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialRequestId ? [{ id: 'request_id', value: initialRequestId }] : []);
  const [appliedColumnFilters, setAppliedColumnFilters] = useState<ColumnFiltersState>(initialRequestId ? [{ id: 'request_id', value: initialRequestId }] : []);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [advancedFilterRequestId, setAdvancedFilterRequestId] = useState(initialRequestId);
  const [advancedFilterSupplier, setAdvancedFilterSupplier] = useState('');
  const [advancedFilterStatus, setAdvancedFilterStatus] = useState('');

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: number) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const loadOrders = useCallback(
    async (overrides?: { appliedColumnFilters?: ColumnFiltersState; appliedGlobalFilter?: string; pageIndex?: number }) => {
      setLoading(true);
      const filters = overrides?.appliedColumnFilters ?? appliedColumnFilters;
      const search = overrides?.appliedGlobalFilter ?? appliedGlobalFilter;
      const pageIndex = overrides?.pageIndex ?? pagination.pageIndex;
      const requestId = filters.find((f) => f.id === 'request_id')?.value;
      const supplier = filters.find((f) => f.id === 'supplier_name')?.value;
      const status = filters.find((f) => f.id === 'status')?.value;

      const result = await getPurchaseOrdersAction({
        page: pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
        search: search || undefined,
        request_id: requestId ? String(requestId) : undefined,
        supplier_name: supplier ? String(supplier) : undefined,
        status: status ? String(status) : undefined,
      });

      if (result.success && result.data) {
        setOrders(result.data.items || []);
        setTotal(result.data.total || 0);
      } else {
        notifyError(result.error || 'خطا در دریافت سفارش‌های خرید');
      }
      setLoading(false);
    },
    [appliedColumnFilters, appliedGlobalFilter, pagination.pageIndex, pagination.pageSize, sorting, notifyError],
  );

  const triggerLoad = useCallback(() => {
    startTransition(() => void loadOrders());
  }, [loadOrders, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(timer);
  }, [triggerLoad]);

  const selected = orders.find((o) => o.id === editingId);

  const formSchema: FormSchema = useMemo(
    () => ({
      fields: [
        { name: 'request_id', label: 'شناسه درخواست PR', type: 'text', row: 0, lgSpan: 6 },
        { name: 'supplier_name', label: 'تامین‌کننده', type: 'text', required: true, row: 0, lgSpan: 6 },
        { name: 'item_name', label: 'کالا', type: 'text', row: 1, lgSpan: 6 },
        { name: 'status', label: 'وضعیت', type: 'select', required: true, row: 1, lgSpan: 6, options: [
          { label: 'پیش‌نویس', value: 'draft' },
          { label: 'در انتظار', value: 'pending' },
          { label: 'تایید شده', value: 'approved' },
          { label: 'ارسال شده', value: 'sent' },
          { label: 'بسته شده', value: 'closed' },
          { label: 'لغو شده', value: 'cancelled' },
        ] },
        { name: 'quantity', label: 'تعداد', type: 'number', row: 2, lgSpan: 6 },
        { name: 'unit_price', label: 'قیمت واحد', type: 'amount', row: 2, lgSpan: 6 },
        { name: 'expected_date', label: 'تاریخ تحویل', type: 'date', row: 3, lgSpan: 6 },
        { name: 'description', label: 'توضیحات', type: 'textarea', row: 4, lgSpan: 12 },
      ],
    }),
    [],
  );

  const defaultValues = useMemo(
    () => ({
      request_id: selected?.request_id ?? initialRequestId ?? '',
      supplier_name: selected?.supplier_name ?? '',
      item_name: selected?.item_name ?? '',
      quantity: selected?.quantity != null ? String(selected.quantity) : '',
      unit_price: selected?.unit_price != null ? String(selected.unit_price) : '',
      expected_date: selected?.expected_date ?? '',
      status: selected?.status ?? 'draft',
      description: selected?.description ?? '',
    }),
    [selected, initialRequestId],
  );

  const handleSave = async (formData: PurchaseOrderFormSubmit) => {
    setSaving(true);
    const parsed = editingId ? PurchaseOrderUpdateSchema.safeParse(formData) : PurchaseOrderCreateSchema.safeParse(formData);
    if (!parsed.success) {
      notifyError(parsed.error.issues[0]?.message || 'مقادیر فرم نامعتبر است');
      setSaving(false);
      return;
    }

    const payload = {
      request_id: parsed.data.request_id || undefined,
      supplier_name: parsed.data.supplier_name,
      item_name: parsed.data.item_name || undefined,
      quantity: parseOptionalNumber(parsed.data.quantity),
      unit_price: parseOptionalNumber(parsed.data.unit_price),
      expected_date: parsed.data.expected_date || undefined,
      status: parsed.data.status,
      description: parsed.data.description || undefined,
    };

    const result = editingId ? await updatePurchaseOrderAction(editingId, payload) : await createPurchaseOrderAction(payload);
    if (result.success) {
      notifySuccess(editingId ? 'سفارش خرید ویرایش شد' : 'سفارش خرید ایجاد شد');
      closeModal();
      triggerLoad();
    } else {
      notifyError(result.error || 'عملیات ناموفق بود');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    await executeDelete(() => deletePurchaseOrderAction(id), {
      successMessage: 'سفارش خرید حذف شد',
      errorMessage: 'حذف سفارش خرید ناموفق بود',
      onSuccess: () => {
        triggerLoad();
        if (editingId === id) closeModal();
      },
    });
  };

  const applyAdvancedFilters = () => {
    const next: ColumnFiltersState = [];
    if (advancedFilterRequestId.trim()) next.push({ id: 'request_id', value: advancedFilterRequestId.trim() });
    if (advancedFilterSupplier.trim()) next.push({ id: 'supplier_name', value: advancedFilterSupplier.trim() });
    if (advancedFilterStatus.trim()) next.push({ id: 'status', value: advancedFilterStatus.trim() });
    const search = globalFilter.trim();
    setColumnFilters(next);
    setAppliedColumnFilters(next);
    setAppliedGlobalFilter(search);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    void loadOrders({ appliedColumnFilters: next, appliedGlobalFilter: search, pageIndex: 0 });
  };

  const columns: ColumnDef<PurchaseOrder>[] = [
    { accessorKey: 'id', header: 'شناسه' },
    { accessorKey: 'order_no', header: 'شماره سفارش', cell: ({ row }) => row.original.order_no ?? '—' },
    { accessorKey: 'request_id', header: 'شماره PR', cell: ({ row }) => row.original.request_id ?? '—' },
    { accessorKey: 'supplier_name', header: 'تامین‌کننده' },
    { accessorKey: 'item_name', header: 'کالا', cell: ({ row }) => row.original.item_name ?? '—' },
    { accessorKey: 'status', header: 'وضعیت' },
    {
      accessorKey: 'expected_date',
      header: 'تاریخ تحویل',
      cell: ({ row }) => formatJalaliDate(row.original.expected_date),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" asChild title="ثبت رسید کالا (GRN) برای این PO">
            <Link
              href={`/dashboard/procurement/grn?poId=${encodeURIComponent(String(row.original.id))}&create=1`}
            >
              <PackageCheck className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={() => openEdit(row.original.id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" type="button" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardPageShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">سفارش‌های خرید (PO)</h1>
        <p className="text-sm text-muted-foreground">ایجاد و پیگیری سفارش پس از تأیید درخواست خرید</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">لیست سفارش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<PurchaseOrder>
            data={orders}
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
            entityName="سفارش خرید"
            onRefresh={triggerLoad}
            onExport={async () => orders}
            onCreateClick={openCreate}
            globalFilterForm={
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    placeholder="فیلتر شماره PR"
                    value={advancedFilterRequestId}
                    onChange={(e) => setAdvancedFilterRequestId(e.target.value)}
                  />
                  <Input
                    placeholder="فیلتر تامین‌کننده"
                    value={advancedFilterSupplier}
                    onChange={(e) => setAdvancedFilterSupplier(e.target.value)}
                  />
                  <Input
                    placeholder="فیلتر وضعیت"
                    value={advancedFilterStatus}
                    onChange={(e) => setAdvancedFilterStatus(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={applyAdvancedFilters}>اعمال فیلتر</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAdvancedFilterRequestId('');
                      setAdvancedFilterSupplier('');
                      setAdvancedFilterStatus('');
                      setColumnFilters([]);
                      setAppliedColumnFilters([]);
                      setGlobalFilter('');
                      setAppliedGlobalFilter('');
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                      void loadOrders({ appliedColumnFilters: [], appliedGlobalFilter: '', pageIndex: 0 });
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
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingId(null);
        }}
        title={editingId ? 'ویرایش سفارش خرید' : 'ایجاد سفارش خرید'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button type="submit" form="purchase-order-form" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              ذخیره
            </Button>
            <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
              بستن
            </Button>
          </div>
        }
      >
        <FormGenerator
          key={editingId ?? 'new-order'}
          schema={formSchema}
          formId="purchase-order-form"
          defaultValues={defaultValues}
          onSubmit={handleSave}
          isLoading={saving}
        />
      </AdvancedModal>
    </DashboardPageShell>
  );
}


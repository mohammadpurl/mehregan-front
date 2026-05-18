'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import { FormGenerator } from '@/app/components/form-input/form-generator/form-generator';
import { FormSchema } from '@/app/components/form-input/form-generator/form-generator.types';
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { createGrnAction, deleteGrnAction, getGrnsAction, updateGrnAction } from '@/app/_actions/grn-actions';
import { Grn } from '@/app/_types/grn.types';
import { GrnCreateSchema, GrnUpdateSchema } from '@/app/_types/grn.schema';

function parseOptionalNumber(value: string): number | undefined {
  const s = value.trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

type GrnFormSubmit = {
  po_id: string;
  supplier_name: string;
  item_name: string;
  received_qty: string;
  warehouse_name: string;
  receipt_date: string;
  status: 'draft' | 'received' | 'inspected' | 'posted' | 'cancelled';
  description: string;
};

export default function ProcurementGrnPage() {
  const searchParams = useSearchParams();
  const initialPoId = searchParams.get('poId')?.trim() || '';
  const openCreateFromQuery = searchParams.get('create') === '1';
  const { toast } = useToast();
  const { executeDelete } = useDeleteAction();

  const [rows, setRows] = useState<Grn[]>([]);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialPoId ? [{ id: 'po_id', value: initialPoId }] : []);
  const [appliedColumnFilters, setAppliedColumnFilters] = useState<ColumnFiltersState>(initialPoId ? [{ id: 'po_id', value: initialPoId }] : []);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [advancedFilterPoId, setAdvancedFilterPoId] = useState(initialPoId);
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

  const loadRows = useCallback(
    async (overrides?: { appliedColumnFilters?: ColumnFiltersState; appliedGlobalFilter?: string; pageIndex?: number }) => {
      setLoading(true);
      const filters = overrides?.appliedColumnFilters ?? appliedColumnFilters;
      const search = overrides?.appliedGlobalFilter ?? appliedGlobalFilter;
      const pageIndex = overrides?.pageIndex ?? pagination.pageIndex;
      const poId = filters.find((f) => f.id === 'po_id')?.value;
      const supplier = filters.find((f) => f.id === 'supplier_name')?.value;
      const status = filters.find((f) => f.id === 'status')?.value;

      const result = await getGrnsAction({
        page: pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
        search: search || undefined,
        po_id: poId ? String(poId) : undefined,
        supplier_name: supplier ? String(supplier) : undefined,
        status: status ? String(status) : undefined,
      });

      if (result.success && result.data) {
        setRows(result.data.items || []);
        setTotal(result.data.total || 0);
      } else {
        toast({ title: 'خطا', description: result.error || 'خطا در دریافت رسیدهای کالا', variant: 'destructive' });
      }
      setLoading(false);
    },
    [appliedColumnFilters, appliedGlobalFilter, pagination.pageIndex, pagination.pageSize, sorting, toast],
  );

  const triggerLoad = useCallback(() => {
    startTransition(() => void loadRows());
  }, [loadRows, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(timer);
  }, [triggerLoad]);

  const openedCreateFromPoRef = useRef(false);
  useEffect(() => {
    if (!initialPoId || !openCreateFromQuery || openedCreateFromPoRef.current) return;
    openedCreateFromPoRef.current = true;
    const t = setTimeout(() => {
      setEditingId(null);
      setModalOpen(true);
    }, 0);
    return () => clearTimeout(t);
  }, [initialPoId, openCreateFromQuery]);

  const selected = rows.find((r) => r.id === editingId);

  const formSchema: FormSchema = useMemo(
    () => ({
      fields: [
        { name: 'po_id', label: 'شناسه PO', type: 'text', row: 0, lgSpan: 6 },
        { name: 'supplier_name', label: 'تامین‌کننده', type: 'text', row: 0, lgSpan: 6 },
        { name: 'item_name', label: 'کالا', type: 'text', row: 1, lgSpan: 6 },
        { name: 'warehouse_name', label: 'انبار مقصد', type: 'text', row: 1, lgSpan: 6 },
        { name: 'received_qty', label: 'تعداد دریافتی', type: 'number', row: 2, lgSpan: 6 },
        { name: 'receipt_date', label: 'تاریخ رسید', type: 'date', row: 2, lgSpan: 6 },
        {
          name: 'status',
          label: 'وضعیت',
          type: 'select',
          required: true,
          row: 3,
          lgSpan: 6,
          options: [
            { label: 'پیش‌نویس', value: 'draft' },
            { label: 'دریافت شده', value: 'received' },
            { label: 'بازرسی شده', value: 'inspected' },
            { label: 'ثبت انبار شده', value: 'posted' },
            { label: 'لغو شده', value: 'cancelled' },
          ],
        },
        { name: 'description', label: 'توضیحات', type: 'textarea', row: 4, lgSpan: 12 },
      ],
    }),
    [],
  );

  const defaultValues = useMemo(
    () => ({
      po_id: selected?.po_id ?? initialPoId,
      supplier_name: selected?.supplier_name ?? '',
      item_name: selected?.item_name ?? '',
      warehouse_name: selected?.warehouse_name ?? '',
      received_qty: selected?.received_qty != null ? String(selected.received_qty) : '',
      receipt_date: selected?.receipt_date ?? '',
      status: selected?.status ?? 'draft',
      description: selected?.description ?? '',
    }),
    [selected, initialPoId],
  );

  const handleSave = async (formData: GrnFormSubmit) => {
    setSaving(true);
    const parsed = editingId ? GrnUpdateSchema.safeParse(formData) : GrnCreateSchema.safeParse(formData);
    if (!parsed.success) {
      toast({ title: 'خطا', description: parsed.error.issues[0]?.message || 'مقادیر فرم نامعتبر است', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const payload = {
      po_id: parsed.data.po_id || undefined,
      supplier_name: parsed.data.supplier_name || undefined,
      item_name: parsed.data.item_name || undefined,
      received_qty: parseOptionalNumber(parsed.data.received_qty),
      warehouse_name: parsed.data.warehouse_name || undefined,
      receipt_date: parsed.data.receipt_date || undefined,
      status: parsed.data.status,
      description: parsed.data.description || undefined,
    };

    const result = editingId ? await updateGrnAction(editingId, payload) : await createGrnAction(payload);
    if (result.success) {
      toast({ title: 'موفق', description: editingId ? 'رسید کالا ویرایش شد' : 'رسید کالا ایجاد شد' });
      closeModal();
      triggerLoad();
    } else {
      toast({ title: 'خطا', description: result.error || 'عملیات ناموفق بود', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    await executeDelete(() => deleteGrnAction(id), {
      successMessage: 'رسید کالا حذف شد',
      errorMessage: 'حذف رسید کالا ناموفق بود',
      onSuccess: () => {
        triggerLoad();
        if (editingId === id) closeModal();
      },
    });
  };

  const applyAdvancedFilters = () => {
    const next: ColumnFiltersState = [];
    if (advancedFilterPoId.trim()) next.push({ id: 'po_id', value: advancedFilterPoId.trim() });
    if (advancedFilterSupplier.trim()) next.push({ id: 'supplier_name', value: advancedFilterSupplier.trim() });
    if (advancedFilterStatus.trim()) next.push({ id: 'status', value: advancedFilterStatus.trim() });
    const search = globalFilter.trim();
    setColumnFilters(next);
    setAppliedColumnFilters(next);
    setAppliedGlobalFilter(search);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    void loadRows({ appliedColumnFilters: next, appliedGlobalFilter: search, pageIndex: 0 });
  };

  const columns: ColumnDef<Grn>[] = [
    { accessorKey: 'id', header: 'شناسه' },
    { accessorKey: 'grn_no', header: 'شماره رسید', cell: ({ row }) => row.original.grn_no ?? '—' },
    { accessorKey: 'po_id', header: 'شماره PO', cell: ({ row }) => row.original.po_id ?? '—' },
    { accessorKey: 'supplier_name', header: 'تامین‌کننده', cell: ({ row }) => row.original.supplier_name ?? '—' },
    { accessorKey: 'item_name', header: 'کالا', cell: ({ row }) => row.original.item_name ?? '—' },
    { accessorKey: 'received_qty', header: 'تعداد دریافتی', cell: ({ row }) => row.original.received_qty ?? '—' },
    { accessorKey: 'warehouse_name', header: 'انبار مقصد', cell: ({ row }) => row.original.warehouse_name ?? '—' },
    {
      accessorKey: 'receipt_date',
      header: 'تاریخ رسید',
      cell: ({ row }) => formatJalaliDate(row.original.receipt_date),
    },
    { accessorKey: 'status', header: 'وضعیت' },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
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
      <Card>
        <CardHeader>
          <CardTitle>دریافت کالا (GRN)</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<Grn>
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
            entityName="رسید کالا"
            onRefresh={triggerLoad}
            onExport={async () => rows}
            onCreateClick={openCreate}
            globalFilterForm={
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    placeholder="فیلتر شماره PO"
                    value={advancedFilterPoId}
                    onChange={(e) => setAdvancedFilterPoId(e.target.value)}
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
                      setAdvancedFilterPoId('');
                      setAdvancedFilterSupplier('');
                      setAdvancedFilterStatus('');
                      setColumnFilters([]);
                      setAppliedColumnFilters([]);
                      setGlobalFilter('');
                      setAppliedGlobalFilter('');
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                      void loadRows({ appliedColumnFilters: [], appliedGlobalFilter: '', pageIndex: 0 });
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
        title={editingId ? 'ویرایش رسید کالا' : 'ایجاد رسید کالا'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button type="submit" form="grn-form" disabled={saving}>
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
          key={editingId ?? 'new-grn'}
          schema={formSchema}
          formId="grn-form"
          defaultValues={defaultValues}
          onSubmit={handleSave}
          isLoading={saving}
        />
      </AdvancedModal>
    </DashboardPageShell>
  );
}


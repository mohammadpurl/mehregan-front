'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { AdvancedModal } from '@/app/components/Modal';
import { FormGenerator } from '@/app/components/form-input/form-generator/form-generator';
import { FormSchema } from '@/app/components/form-input/form-generator/form-generator.types';
import {
  createWarehouseMasterAction,
  deleteWarehouseMasterAction,
  getWarehouseMastersAction,
  updateWarehouseMasterAction,
} from '@/app/_actions/warehouse-master-actions';
import { Warehouse } from '@/app/_types/warehouse-master.types';
import { WarehouseCreateSchema, WarehouseUpdateSchema } from '@/app/_types/warehouse-master.schema';
import { useSearchParams } from 'next/navigation';

function parseFiniteId(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

type WarehouseFormSubmit = {
  name: string;
  code: string;
  address: string;
  is_active: string;
  description: string;
};

export default function WarehousesPage() {
  const searchParams = useSearchParams();
  const initialWarehouseId = searchParams.get('warehouseId')?.trim() || '';
  const initialFilters: ColumnFiltersState = initialWarehouseId ? [{ id: 'id', value: initialWarehouseId }] : [];
  const { toast } = useToast();
  const { executeDelete } = useDeleteAction();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters);
  const [appliedColumnFilters, setAppliedColumnFilters] = useState<ColumnFiltersState>(initialFilters);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [advancedFilterId, setAdvancedFilterId] = useState(initialWarehouseId);
  const [advancedFilterName, setAdvancedFilterName] = useState('');
  const [advancedFilterCode, setAdvancedFilterCode] = useState('');

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

  const loadWarehouses = useCallback(
    async (overrides?: {
      appliedColumnFilters?: ColumnFiltersState;
      appliedGlobalFilter?: string;
      pageIndex?: number;
    }) => {
      setLoading(true);
      const filters = overrides?.appliedColumnFilters ?? appliedColumnFilters;
      const search = overrides?.appliedGlobalFilter ?? appliedGlobalFilter;
      const pageIndex = overrides?.pageIndex ?? pagination.pageIndex;
      const sortBy = sorting[0]?.id;
      const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
      const idFilter = filters.find((f) => f.id === 'id')?.value;
      const nameFilter = filters.find((f) => f.id === 'name')?.value;
      const codeFilter = filters.find((f) => f.id === 'code')?.value;

      const result = await getWarehouseMastersAction({
        page: pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy,
        sortOrder,
        search: search || undefined,
        id: parseFiniteId(idFilter),
        name: nameFilter ? String(nameFilter).trim() || undefined : undefined,
        code: codeFilter ? String(codeFilter).trim() || undefined : undefined,
      });

      if (result.success && result.data) {
        setWarehouses(result.data.items || []);
        setTotal(result.data.total || 0);
      } else {
        toast({ title: 'خطا', description: result.error || 'خطا در دریافت انبارها', variant: 'destructive' });
      }
      setLoading(false);
    },
    [appliedColumnFilters, appliedGlobalFilter, pagination.pageIndex, pagination.pageSize, sorting, toast],
  );

  const triggerLoadWarehouses = useCallback(() => {
    startTransition(() => {
      void loadWarehouses();
    });
  }, [loadWarehouses, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerLoadWarehouses();
    }, 0);
    return () => clearTimeout(timer);
  }, [triggerLoadWarehouses]);

  const selected = warehouses.find((w) => w.id === editingId);

  const formSchema: FormSchema = useMemo(
    () => ({
      fields: [
        { name: 'name', label: 'نام انبار', type: 'text', required: true, row: 0, lgSpan: 6 },
        { name: 'code', label: 'کد انبار', type: 'text', required: false, row: 0, lgSpan: 6 },
        { name: 'address', label: 'آدرس', type: 'text', required: false, row: 1, lgSpan: 6 },
        {
          name: 'is_active',
          label: 'وضعیت',
          type: 'select',
          required: true,
          row: 1,
          lgSpan: 6,
          options: [
            { label: 'فعال', value: 'true' },
            { label: 'غیرفعال', value: 'false' },
          ],
        },
        { name: 'description', label: 'توضیحات', type: 'textarea', required: false, row: 2, lgSpan: 12 },
      ],
    }),
    [],
  );

  const defaultValues = useMemo(
    () => ({
      name: selected?.name ?? '',
      code: selected?.code ?? '',
      address: selected?.address ?? '',
      is_active: selected?.is_active === false ? 'false' : 'true',
      description: selected?.description ?? '',
    }),
    [selected],
  );

  const handleSave = async (formData: WarehouseFormSubmit) => {
    setSaving(true);
    const parsed = editingId ? WarehouseUpdateSchema.safeParse(formData) : WarehouseCreateSchema.safeParse(formData);
    if (!parsed.success) {
      toast({ title: 'خطا', description: parsed.error.issues[0]?.message || 'مقادیر فرم نامعتبر است', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const payload = {
      name: parsed.data.name,
      code: parsed.data.code || undefined,
      address: parsed.data.address || undefined,
      is_active: parsed.data.is_active === 'true',
      description: parsed.data.description || undefined,
    };

    const result = editingId ? await updateWarehouseMasterAction(editingId, payload) : await createWarehouseMasterAction(payload);
    if (result.success) {
      toast({ title: 'موفق', description: editingId ? 'انبار ویرایش شد' : 'انبار ایجاد شد' });
      closeModal();
      triggerLoadWarehouses();
    } else {
      toast({ title: 'خطا', description: result.error || 'عملیات ناموفق بود', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    await executeDelete(() => deleteWarehouseMasterAction(id), {
      successMessage: 'انبار حذف شد',
      errorMessage: 'حذف انبار ناموفق بود',
      onSuccess: () => {
        triggerLoadWarehouses();
        if (editingId === id) closeModal();
      },
    });
  };

  const applyAdvancedFilters = () => {
    const nextFilters: ColumnFiltersState = [];
    if (advancedFilterId.trim()) nextFilters.push({ id: 'id', value: advancedFilterId.trim() });
    if (advancedFilterName.trim()) nextFilters.push({ id: 'name', value: advancedFilterName.trim() });
    if (advancedFilterCode.trim()) nextFilters.push({ id: 'code', value: advancedFilterCode.trim() });
    const search = globalFilter.trim();
    setColumnFilters(nextFilters);
    setAppliedColumnFilters(nextFilters);
    setAppliedGlobalFilter(search);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    void loadWarehouses({ appliedColumnFilters: nextFilters, appliedGlobalFilter: search, pageIndex: 0 });
  };

  const columns: ColumnDef<Warehouse>[] = [
    {
      accessorKey: 'id',
      header: 'شناسه',
      meta: {
        filterComponent: ({ onFilterChange, value }: { onFilterChange: (value: unknown) => void; value: unknown }) => (
          <Input type="number" placeholder="شناسه..." defaultValue={String(value ?? '')} onChange={(e) => onFilterChange(e.target.value)} />
        ),
      },
    },
    {
      accessorKey: 'name',
      header: 'نام',
      meta: {
        filterComponent: ({ onFilterChange, value }: { onFilterChange: (value: unknown) => void; value: unknown }) => (
          <Input placeholder="نام..." defaultValue={String(value ?? '')} onChange={(e) => onFilterChange(e.target.value)} />
        ),
      },
    },
    {
      accessorKey: 'code',
      header: 'کد',
      cell: ({ row }) => row.original.code ?? '—',
      meta: {
        filterComponent: ({ onFilterChange, value }: { onFilterChange: (value: unknown) => void; value: unknown }) => (
          <Input placeholder="کد..." defaultValue={String(value ?? '')} onChange={(e) => onFilterChange(e.target.value)} />
        ),
      },
    },
    { accessorKey: 'address', header: 'آدرس', cell: ({ row }) => row.original.address ?? '—' },
    { accessorKey: 'is_active', header: 'فعال', cell: ({ row }) => (row.original.is_active === false ? 'خیر' : 'بله') },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => {
        const w = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => openEdit(w.id)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" type="button" onClick={() => handleDelete(w.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle>لیست انبارها</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<Warehouse>
            data={warehouses}
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
            entityName="انبارها"
            onRefresh={triggerLoadWarehouses}
            onExport={async () => warehouses}
            onCreateClick={openCreate}
            globalFilterForm={
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input type="number" placeholder="فیلتر شناسه" value={advancedFilterId} onChange={(e) => setAdvancedFilterId(e.target.value)} />
                  <Input placeholder="فیلتر نام" value={advancedFilterName} onChange={(e) => setAdvancedFilterName(e.target.value)} />
                  <Input placeholder="فیلتر کد" value={advancedFilterCode} onChange={(e) => setAdvancedFilterCode(e.target.value)} />
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
                      setAdvancedFilterName('');
                      setAdvancedFilterCode('');
                      setColumnFilters([]);
                      setAppliedColumnFilters([]);
                      setGlobalFilter('');
                      setAppliedGlobalFilter('');
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                      void loadWarehouses({ appliedColumnFilters: [], appliedGlobalFilter: '', pageIndex: 0 });
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
        title={editingId ? 'ویرایش انبار' : 'ایجاد انبار'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button type="submit" form="warehouses-form" disabled={saving}>
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
          key={editingId ?? 'new-warehouse'}
          schema={formSchema}
          formId="warehouses-form"
          defaultValues={defaultValues}
          onSubmit={handleSave}
          isLoading={saving}
        />
      </AdvancedModal>
    </DashboardPageShell>
  );
}


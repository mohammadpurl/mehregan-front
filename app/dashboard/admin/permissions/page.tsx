'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  createPermissionAction,
  deletePermissionAction,
  getPermissionsAction,
  updatePermissionAction,
} from '@/app/_actions/permission-actions';
import { Permission } from '@/app/_types/permission.types';
import { PermissionCreateSchema, PermissionUpdateSchema } from '@/app/_types/rbac.schema';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { FormGenerator } from '@/app/components/form-input/form-generator/form-generator';
import { FormSchema } from '@/app/components/form-input/form-generator/form-generator.types';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { AdvancedModal } from '@/app/components/Modal';
import { useDeleteAction } from '@/app/hooks/use-delete-action';

function parseFiniteId(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default function PermissionsPage() {
  const { toast } = useToast();
  const { executeDelete } = useDeleteAction();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [total, setTotal] = useState(0);
  const [editingPermissionId, setEditingPermissionId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [appliedGlobalFilter, setAppliedGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [appliedColumnFilters, setAppliedColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [advancedFilterId, setAdvancedFilterId] = useState('');
  const [advancedFilterName, setAdvancedFilterName] = useState('');

  const permissionFormSchema: FormSchema = useMemo(
    () => ({
      fields: [
        {
          name: 'code',
          label: 'کد مجوز',
          type: 'text',
          required: true,
          row: 0,
          lgSpan: 6,
          placeholder: 'مثال: workflow.create',
        },
        {
          name: 'name',
          label: 'نام مجوز',
          type: 'text',
          required: true,
          row: 0,
          lgSpan: 6,
          placeholder: 'مثال: ایجاد گردش کار',
        },
      ],
    }),
    [],
  );

  const closeModal = () => {
    setModalOpen(false);
    setEditingPermissionId(null);
  };

  const openCreate = () => {
    setEditingPermissionId(null);
    setModalOpen(true);
  };

  const openEdit = (id: number) => {
    setEditingPermissionId(id);
    setModalOpen(true);
  };

  const loadPermissions = useCallback(
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
      const permissionIdFilter = filters.find((f) => f.id === 'id')?.value;
      const permissionNameFilter = filters.find((f) => f.id === 'name')?.value;
      const result = await getPermissionsAction({
        page: pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy,
        sortOrder,
        search: search || undefined,
        id: parseFiniteId(permissionIdFilter),
        name: permissionNameFilter ? String(permissionNameFilter) : undefined,
      });
      if (result.success && result.data) {
        setPermissions(result.data.items || []);
        setTotal(result.data.total || 0);
      } else {
        toast({ title: 'خطا', description: result.error || 'خطا در دریافت مجوزها', variant: 'destructive' });
      }
      setLoading(false);
    },
    [appliedColumnFilters, appliedGlobalFilter, pagination.pageIndex, pagination.pageSize, sorting, toast],
  );

  const triggerLoadPermissions = useCallback(() => {
    startTransition(() => {
      void loadPermissions();
    });
  }, [loadPermissions, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerLoadPermissions();
    }, 0);
    return () => clearTimeout(timer);
  }, [triggerLoadPermissions]);

  const handleSave = async (formData: { code: string; name: string }) => {
    setSaving(true);

    if (editingPermissionId) {
      const parsed = PermissionUpdateSchema.safeParse({
        code: formData.code,
        name: formData.name,
      });
      if (!parsed.success) {
        toast({ title: 'خطا', description: parsed.error.issues[0]?.message || 'مقدار نامعتبر', variant: 'destructive' });
        setSaving(false);
        return;
      }
      const result = await updatePermissionAction(editingPermissionId, {
        id: editingPermissionId,
        code: parsed.data.code,
        name: parsed.data.name,
      });
      if (result.success) {
        toast({ title: 'موفق', description: 'مجوز ویرایش شد' });
        closeModal();
        triggerLoadPermissions();
      } else {
        toast({ title: 'خطا', description: result.error || 'عملیات ناموفق بود', variant: 'destructive' });
      }
      setSaving(false);
      return;
    }

    const parsed = PermissionCreateSchema.safeParse({
      code: formData.code,
      name: formData.name,
    });
    if (!parsed.success) {
      toast({ title: 'خطا', description: parsed.error.issues[0]?.message || 'مقدار نامعتبر', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const result = await createPermissionAction(parsed.data);

    if (result.success) {
      toast({ title: 'موفق', description: 'مجوز ایجاد شد' });
      closeModal();
      triggerLoadPermissions();
    } else {
      toast({ title: 'خطا', description: result.error || 'عملیات ناموفق بود', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    await executeDelete(() => deletePermissionAction(id), {
      successMessage: 'مجوز حذف شد',
      errorMessage: 'حذف مجوز ناموفق بود',
      onSuccess: () => {
        triggerLoadPermissions();
        if (editingPermissionId === id) setEditingPermissionId(null);
      },
    });
  };

  const columns: ColumnDef<Permission>[] = [
    {
      accessorKey: 'id',
      header: 'شناسه',
      meta: {
        filterComponent: ({ onFilterChange, value }: { onFilterChange: (value: unknown) => void; value: unknown }) => (
          <Input
            type="number"
            placeholder="شناسه..."
            defaultValue={String(value ?? '')}
            onChange={(e) => onFilterChange(e.target.value)}
          />
        ),
      },
    },
    {
      accessorKey: 'code',
      header: 'کد',
      cell: ({ row }) => row.original.code ?? '—',
    },
    {
      accessorKey: 'name',
      header: 'نام',
      meta: {
        filterComponent: ({ onFilterChange, value }: { onFilterChange: (value: unknown) => void; value: unknown }) => (
          <Input
            placeholder="نام مجوز..."
            defaultValue={String(value ?? '')}
            onChange={(e) => onFilterChange(e.target.value)}
          />
        ),
      },
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => openEdit(permission.id)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" type="button" onClick={() => handleDelete(permission.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const selectedPermission = permissions.find((item) => item.id === editingPermissionId);

  const applyAdvancedFilters = () => {
    const nextFilters: ColumnFiltersState = [];
    if (advancedFilterId.trim()) nextFilters.push({ id: 'id', value: advancedFilterId.trim() });
    if (advancedFilterName.trim()) nextFilters.push({ id: 'name', value: advancedFilterName.trim() });
    const search = globalFilter.trim();
    setColumnFilters(nextFilters);
    setAppliedColumnFilters(nextFilters);
    setAppliedGlobalFilter(search);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    void loadPermissions({
      appliedColumnFilters: nextFilters,
      appliedGlobalFilter: search,
      pageIndex: 0,
    });
  };

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle>لیست مجوزها</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<Permission>
            data={permissions}
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
            entityName="مجوزها"
            onRefresh={triggerLoadPermissions}
            onExport={async () => permissions}
            onCreateClick={openCreate}
            globalFilterForm={
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    type="number"
                    placeholder="فیلتر شناسه"
                    value={advancedFilterId}
                    onChange={(e) => setAdvancedFilterId(e.target.value)}
                  />
                  <Input
                    placeholder="فیلتر نام مجوز"
                    value={advancedFilterName}
                    onChange={(e) => setAdvancedFilterName(e.target.value)}
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
                      setAdvancedFilterName('');
                      setColumnFilters([]);
                      setAppliedColumnFilters([]);
                      setGlobalFilter('');
                      setAppliedGlobalFilter('');
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                      void loadPermissions({
                        appliedColumnFilters: [],
                        appliedGlobalFilter: '',
                        pageIndex: 0,
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
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingPermissionId(null);
        }}
        title={editingPermissionId ? 'ویرایش مجوز' : 'ایجاد مجوز'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button type="submit" form="permissions-form" disabled={saving}>
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
          key={editingPermissionId ?? 'new-permission'}
          schema={permissionFormSchema}
          formId="permissions-form"
          defaultValues={{
            code: selectedPermission?.code ?? '',
            name: selectedPermission?.name ?? '',
          }}
          onSubmit={handleSave}
          isLoading={saving}
        />
      </AdvancedModal>
    </DashboardPageShell>
  );
}


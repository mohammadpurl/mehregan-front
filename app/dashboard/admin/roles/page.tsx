'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createRoleAction, deleteRoleAction, getRolesAction, updateRoleAction } from '@/app/_actions/role-actions';
import { Role } from '@/app/_types/role.types';
import { RoleSchema } from '@/app/_types/rbac.schema';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { FormGenerator } from '@/app/components/form-input/form-generator/form-generator';
import { FormSchema } from '@/app/components/form-input/form-generator/form-generator.types';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { useNotificationStore } from '@/app/_store/notification.store';
import { AdvancedModal } from '@/app/components/Modal';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';

function parseFiniteId(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default function RolesPage() {
  const { toast } = useToast();
  const { executeDelete } = useDeleteAction();
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
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

  const showNotification = useNotificationStore(
    (state) => state.showNotification
    );

  const roleFormSchema: FormSchema = {
    fields: [
      {
        name: 'name',
        label: 'نام نقش',
        type: 'text',
        required: true,
        row: 0,
        placeholder: 'مثال: admin',
      },
    ],
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRoleId(null);
  };

  const openCreate = () => {
    setEditingRoleId(null);
    setModalOpen(true);
  };

  const openEdit = (id: number) => {
    setEditingRoleId(id);
    setModalOpen(true);
  };

  const loadRoles = useCallback(
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
      const roleIdFilter = filters.find((f) => f.id === 'id')?.value;
      const roleNameFilter = filters.find((f) => f.id === 'name')?.value;
      const result = await getRolesAction({
        page: pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy,
        sortOrder,
        search: search || undefined,
        id: parseFiniteId(roleIdFilter),
        name: roleNameFilter ? String(roleNameFilter) : undefined,
      });
      if (result.success && result.data) {
        setRoles(result.data.items || []);
        setTotal(result.data.total || 0);
      } else {
        showNotification({
          message: extractActionErrorMessage(result.error, 'خطا در دریافت نقش‌ها'),
          type: 'error',
        });
      }
      setLoading(false);
    },
    [appliedColumnFilters, appliedGlobalFilter, pagination.pageIndex, pagination.pageSize, showNotification, sorting],
  );

  const triggerLoadRoles = useCallback(() => {
    startTransition(() => {
      void loadRoles();
    });
  }, [loadRoles, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerLoadRoles();
    }, 0);
    return () => clearTimeout(timer);
  }, [triggerLoadRoles]);

  const handleSave = async (formData: { name: string }) => {
    const parsed = RoleSchema.safeParse({ name: formData.name });
    if (!parsed.success) {
      toast({ title: 'خطا', description: parsed.error.issues[0]?.message || 'مقدار نامعتبر', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const result = editingRoleId
      ? await updateRoleAction(editingRoleId, parsed.data)
      : await createRoleAction(parsed.data);

    if (result.success) {
      toast({ title: 'موفق', description: editingRoleId ? 'نقش ویرایش شد' : 'نقش ایجاد شد' });
      closeModal();
      triggerLoadRoles();
    } else {
      toast({ title: 'خطا', description: result.error || 'عملیات ناموفق بود', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    await executeDelete(() => deleteRoleAction(id), {
      successMessage: 'نقش حذف شد',
      errorMessage: 'حذف نقش ناموفق بود',
      onSuccess: () => {
        triggerLoadRoles();
        if (editingRoleId === id) setEditingRoleId(null);
      },
    });
  };

  const applyAdvancedFilters = () => {
    const nextFilters: ColumnFiltersState = [];
    if (advancedFilterId.trim()) {
      nextFilters.push({ id: 'id', value: advancedFilterId.trim() });
    }
    if (advancedFilterName.trim()) {
      nextFilters.push({ id: 'name', value: advancedFilterName.trim() });
    }
    const search = globalFilter.trim();
    setColumnFilters(nextFilters);
    setAppliedColumnFilters(nextFilters);
    setAppliedGlobalFilter(search);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    void loadRoles({
      appliedColumnFilters: nextFilters,
      appliedGlobalFilter: search,
      pageIndex: 0,
    });
  };

  const columns: ColumnDef<Role>[] = [
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
      accessorKey: 'name',
      header: 'نام',
      meta: {
        filterComponent: ({ onFilterChange, value }: { onFilterChange: (value: unknown) => void; value: unknown }) => (
          <Input
            placeholder="نام نقش..."
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
        const role = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => openEdit(role.id)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" type="button" onClick={() => handleDelete(role.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const selectedRole = roles.find((item) => item.id === editingRoleId);

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle>لیست نقش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<Role>
            data={roles}
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
            entityName="نقش‌ها"
            onRefresh={triggerLoadRoles}
            onExport={async () => roles}
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
                    placeholder="فیلتر نام نقش"
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
                      void loadRoles({
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
          if (!open) setEditingRoleId(null);
        }}
        title={editingRoleId ? 'ویرایش نقش' : 'ایجاد نقش'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button type="submit" form="roles-form" disabled={saving}>
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
          key={editingRoleId ?? 'new-role'}
          schema={roleFormSchema}
          formId="roles-form"
          defaultValues={{ name: selectedRole?.name || '' }}
          onSubmit={handleSave}
          isLoading={saving}
        />
      </AdvancedModal>
    </DashboardPageShell>
  );
}


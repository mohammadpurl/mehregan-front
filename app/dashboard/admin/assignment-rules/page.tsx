'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Role } from '@/app/_types/role.types';
import { Permission } from '@/app/_types/permission.types';
import { getAllRolesAction } from '@/app/_actions/role-actions';
import { getAllPermissionsAction } from '@/app/_actions/permission-actions';
import { getRolePermissionsAction, replaceRolePermissionsAction } from '@/app/_actions/role-permission-actions';
import { Loader2 } from 'lucide-react';
import { useFormAction } from '@/app/hooks/use-form-action';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { Input } from '@/app/components/ui/input';

export default function AssignmentRulesPage() {
  const { runAction, notifyError, isPending } = useFormAction();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [loadingBaseData, setLoadingBaseData] = useState(true);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const loadBaseData = useCallback(async () => {
    setLoadingBaseData(true);
    const [rolesResult, permissionsResult] = await Promise.all([
      getAllRolesAction(),
      getAllPermissionsAction(),
    ]);

    if (!rolesResult.success) {
      notifyError(rolesResult.error || 'دریافت نقش‌ها ناموفق بود');
    } else {
      setRoles(rolesResult.data?.items ?? []);
    }

    if (!permissionsResult.success) {
      notifyError(permissionsResult.error || 'دریافت مجوزها ناموفق بود');
    } else {
      setPermissions(permissionsResult.data?.items ?? []);
    }

    setLoadingBaseData(false);
  }, [notifyError]);

  useEffect(() => {
    const timer = setTimeout(() => void loadBaseData(), 0);
    return () => clearTimeout(timer);
  }, [loadBaseData]);

  /** با هر تغییر نقش، مجوزهای همان نقش از API خوانده می‌شود */
  const loadRolePermissions = useCallback(
    async (roleId: number) => {
      setLoadingRolePermissions(true);
      setSelectedPermissionIds([]);

      const result = await getRolePermissionsAction(roleId);
      if (result.success && Array.isArray(result.data)) {
        setSelectedPermissionIds(result.data.map((item) => item.permission_id));
      } else {
        notifyError(result.error || 'دریافت دسترسی‌های نقش ناموفق بود');
        setSelectedPermissionIds([]);
      }

      setLoadingRolePermissions(false);
    },
    [notifyError],
  );

  const handleRoleChange = (value: string) => {
    const roleId = Number(value);
    if (!Number.isFinite(roleId) || roleId <= 0) {
      setSelectedRoleId(null);
      setSelectedPermissionIds([]);
      return;
    }
    setSelectedRoleId(roleId);
    setGlobalFilter('');
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    void loadRolePermissions(roleId);
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId],
    );
  };

  const handleSave = () => {
    if (!selectedRoleId) {
      notifyError('ابتدا یک نقش انتخاب کنید');
      return;
    }

    runAction(
      () =>
        replaceRolePermissionsAction({
          role_id: selectedRoleId,
          permission_ids: selectedPermissionIds,
        }),
      {
        successMessage: 'دسترسی‌های نقش با موفقیت ذخیره شد',
        errorMessage: 'ذخیره دسترسی‌ها ناموفق بود',
        onSuccess: () => void loadRolePermissions(selectedRoleId),
      },
    );
  };

  const allPermissionIds = useMemo(() => permissions.map((p) => p.id), [permissions]);
  const isAllSelected =
    allPermissionIds.length > 0 && allPermissionIds.every((id) => selectedPermissionIds.includes(id));

  const selectAllPermissions = () => {
    setSelectedPermissionIds(allPermissionIds);
  };

  const clearAllPermissions = () => {
    setSelectedPermissionIds([]);
  };

  const filteredPermissions = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(
      (p) =>
        String(p.id).includes(q) ||
        (p.name?.toLowerCase().includes(q) ?? false) ||
        (p.code?.toLowerCase().includes(q) ?? false),
    );
  }, [globalFilter, permissions]);

  const paginatedPermissions = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return filteredPermissions.slice(start, start + pagination.pageSize);
  }, [filteredPermissions, pagination.pageIndex, pagination.pageSize]);

  const busy = loadingBaseData || loadingRolePermissions || isPending;

  const permissionColumns: ColumnDef<Permission>[] = useMemo(
    () => [
      {
        id: 'selected',
        header: 'انتخاب',
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={selectedPermissionIds.includes(row.original.id)}
              onCheckedChange={() => togglePermission(row.original.id)}
              disabled={busy}
            />
          </div>
        ),
      },
      {
        accessorKey: 'id',
        header: 'شناسه',
      },
      {
        accessorKey: 'code',
        header: 'کد',
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.code ?? '—'}</span>,
      },
      {
        accessorKey: 'name',
        header: 'نام',
      },
    ],
    [busy, selectedPermissionIds],
  );

  const applySearch = () => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader>
          <CardTitle>تخصیص مجوز به نقش</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>انتخاب نقش</Label>
            <Select
              value={selectedRoleId ? String(selectedRoleId) : ''}
              onValueChange={handleRoleChange}
              disabled={busy}
            >
              <SelectTrigger>
                <SelectValue placeholder="یک نقش انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingBaseData ? (
            <p className="text-sm text-muted-foreground">در حال بارگذاری نقش‌ها و مجوزها...</p>
          ) : !selectedRole ? (
            <p className="text-sm text-muted-foreground">برای مشاهده و ویرایش مجوزها یک نقش انتخاب کنید.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>مجوزهای نقش «{selectedRole.name}»</Label>
                {loadingRolePermissions && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    در حال بارگذاری مجوزهای نقش...
                  </span>
                )}
              </div>

              <AdvancedDataGrid<Permission>
                data={paginatedPermissions}
                columns={permissionColumns}
                totalItems={filteredPermissions.length}
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
                isLoading={busy}
                entityName="مجوزها"
                onRefresh={() => void loadBaseData()}
                onExport={async () => permissions}
                globalFilterForm={
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={selectAllPermissions}
                        disabled={busy || permissions.length === 0 || isAllSelected}
                      >
                        انتخاب همه
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearAllPermissions}
                        disabled={busy || selectedPermissionIds.length === 0}
                      >
                        پاک‌کردن همه
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedPermissionIds.length} از {permissions.length} مجوز انتخاب شده
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Input
                        placeholder="جستجو در نام، کد یا شناسه..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={applySearch}>
                        اعمال فیلتر
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setGlobalFilter('');
                          setPagination((p) => ({ ...p, pageIndex: 0 }));
                        }}
                      >
                        پاک‌کردن
                      </Button>
                    </div>
                  </div>
                }
              />
            </>
          )}

          <Button type="button" onClick={handleSave} disabled={!selectedRoleId || busy}>
            {(isPending || loadingRolePermissions) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            ذخیره دسترسی‌ها
          </Button>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}

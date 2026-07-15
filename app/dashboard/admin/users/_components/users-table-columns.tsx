'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import type { AdminUser } from '@/app/_types/user.types';
import { displayUserFullName } from '../_utils/user-form.utils';

type UsersTableColumnsProps = {
  onEdit: (user: AdminUser) => void;
  onDelete: (id: number) => void;
  deletePending: boolean;
};

export function getUsersTableColumns({
  onEdit,
  onDelete,
  deletePending,
}: UsersTableColumnsProps): ColumnDef<AdminUser>[] {
  return [
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
      accessorKey: 'username',
      header: 'شناسه فنی',
      meta: {
        filterComponent: ({ onFilterChange, value }: { onFilterChange: (value: unknown) => void; value: unknown }) => (
          <Input
            placeholder="شناسه فنی..."
            defaultValue={String(value ?? '')}
            onChange={(e) => onFilterChange(e.target.value)}
          />
        ),
      },
    },
    {
      accessorKey: 'email',
      header: 'ایمیل',
      meta: {
        filterComponent: ({ onFilterChange, value }: { onFilterChange: (value: unknown) => void; value: unknown }) => (
          <Input
            placeholder="ایمیل..."
            defaultValue={String(value ?? '')}
            onChange={(e) => onFilterChange(e.target.value)}
          />
        ),
      },
    },
    {
      accessorKey: 'full_name',
      header: 'نام نمایشی',
      cell: ({ row }) => displayUserFullName(row.original),
    },
    {
      accessorKey: 'phone',
      header: 'موبایل',
      cell: ({ row }) => row.original.phone ?? '—',
    },
    {
      accessorKey: 'account_number',
      header: 'شماره حساب',
      cell: ({ row }) => {
        const v = row.original.account_number?.trim();
        return v ? <span className="font-mono text-xs">{v}</span> : '—';
      },
    },
    {
      accessorKey: 'card_number',
      header: 'شماره کارت',
      cell: ({ row }) => {
        const v = row.original.card_number?.trim();
        return v ? <span className="font-mono text-xs">{v}</span> : '—';
      },
    },
    {
      accessorKey: 'sheba_number',
      header: 'شماره شبا',
      cell: ({ row }) => {
        const v = row.original.sheba_number?.trim();
        return v ? <span className="font-mono text-xs">{v}</span> : '—';
      },
    },
    {
      accessorKey: 'is_active',
      header: 'فعال',
      cell: ({ row }) => (row.original.is_active === false ? 'خیر' : 'بله'),
    },
    {
      id: 'role',
      header: 'نقش',
      cell: ({ row }) =>
        row.original.role_display_name ??
        row.original.role_name ??
        (row.original.role_id != null ? `#${row.original.role_id}` : '—'),
    },
    {
      id: 'department',
      header: 'واحد سازمانی',
      cell: ({ row }) =>
        row.original.department_name ??
        (row.original.department_id != null ? `#${row.original.department_id}` : '—'),
    },
    {
      id: 'manager',
      header: 'مدیر مستقیم',
      cell: ({ row }) =>
        row.original.manager_name ??
        (row.original.manager_id != null ? `#${row.original.manager_id}` : '—'),
    },
    {
      id: 'actions',
      header: 'عملیات',
      enableResizing: false,
      size: 108,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => onEdit(user)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              type="button"
              disabled={deletePending}
              onClick={() => onDelete(user.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}

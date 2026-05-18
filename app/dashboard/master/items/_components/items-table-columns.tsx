'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import type { Item } from '@/app/_types/item.types';

type ItemsTableColumnsProps = {
  onEdit: (item: Item) => void;
  onDelete: (id: number) => void;
  deletePending: boolean;
};

export function getItemsTableColumns({
  onEdit,
  onDelete,
  deletePending,
}: ItemsTableColumnsProps): ColumnDef<Item>[] {
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
      accessorKey: 'name',
      header: 'نام',
      meta: {
        filterComponent: ({ onFilterChange, value }: { onFilterChange: (value: unknown) => void; value: unknown }) => (
          <Input placeholder="نام کالا..." defaultValue={String(value ?? '')} onChange={(e) => onFilterChange(e.target.value)} />
        ),
      },
    },
    {
      accessorKey: 'category_name',
      header: 'گروه کالا',
      cell: ({ row }) => row.original.category_name ?? (row.original.category_id != null ? `#${row.original.category_id}` : '—'),
    },
    {
      accessorKey: 'sku',
      header: 'کد کالا',
      cell: ({ row }) => row.original.sku ?? '—',
      meta: {
        filterComponent: ({ onFilterChange, value }: { onFilterChange: (value: unknown) => void; value: unknown }) => (
          <Input placeholder="SKU..." defaultValue={String(value ?? '')} onChange={(e) => onFilterChange(e.target.value)} />
        ),
      },
    },
    {
      accessorKey: 'unit',
      header: 'واحد',
      cell: ({ row }) => row.original.unit ?? '—',
    },
    {
      accessorKey: 'is_active',
      header: 'فعال',
      cell: ({ row }) => (row.original.is_active === false ? 'خیر' : 'بله'),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => onEdit(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              type="button"
              disabled={deletePending}
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}

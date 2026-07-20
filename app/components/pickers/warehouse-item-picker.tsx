'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { PackagePlus, Search } from 'lucide-react';
import { AdvancedModal } from '@/app/components/Modal';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { getPurchaseWarehouseCatalogAction } from '@/app/_actions/purchase-request-actions';
import type {
  WarehouseCatalogItem,
  WarehouseItemSelection,
  WarehouseItemSelectionMap,
} from './warehouse-item-picker.types';

export type { WarehouseItemSelection, WarehouseItemSelectionMap, WarehouseCatalogItem };

type GridRow = WarehouseCatalogItem & {
  quantity: number;
  description: string;
  selected: boolean;
};

type Props = {
  value: WarehouseItemSelectionMap;
  onChange: (value: WarehouseItemSelectionMap) => void;
  /** انبار الزامی برای فیلتر کاتالوگ و ثبت درخواست */
  warehouseId: number | null;
  warehouseName?: string | null;
  disabled?: boolean;
};

function mapToDraft(value: WarehouseItemSelectionMap): WarehouseItemSelectionMap {
  return { ...value };
}

function selectionsFromDraft(draft: WarehouseItemSelectionMap): WarehouseItemSelectionMap {
  const out: WarehouseItemSelectionMap = {};
  for (const row of Object.values(draft)) {
    if (row.quantity < 1) continue;
    out[row.itemId] = {
      itemId: row.itemId,
      itemName: row.itemName,
      quantity: row.quantity,
      description: row.description?.trim() || undefined,
    };
  }
  return out;
}

export function WarehouseItemPicker({
  value,
  onChange,
  warehouseId,
  warehouseName,
  disabled,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [catalogItems, setCatalogItems] = useState<WarehouseCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<WarehouseItemSelectionMap>({});

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const selectedList = useMemo(() => Object.values(value), [value]);
  const selectedCount = selectedList.length;
  const canPick = warehouseId != null && Number.isFinite(warehouseId) && warehouseId > 0;

  const loadCatalog = useCallback(async () => {
    if (!canPick || warehouseId == null) {
      setCatalogItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await getPurchaseWarehouseCatalogAction({
      warehouseId,
      search: search.trim() || undefined,
    });
    setLoading(false);
    if (!res.success || !res.data) {
      setCatalogItems([]);
      setError(res.error ?? 'بارگذاری لیست کالاها ناموفق بود');
      return;
    }
    setCatalogItems(res.data.items);
  }, [canPick, warehouseId, search]);

  useEffect(() => {
    if (!pickerOpen) return;
    const timer = window.setTimeout(() => void loadCatalog(), 250);
    return () => window.clearTimeout(timer);
  }, [pickerOpen, loadCatalog]);

  const openPicker = () => {
    if (!canPick) return;
    setDraft(mapToDraft(value));
    setPickerOpen(true);
  };

  const toggleRow = (item: WarehouseCatalogItem, checked: boolean) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (checked) {
        next[item.itemId] = prev[item.itemId] ?? {
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: 1,
          description: '',
        };
      } else {
        delete next[item.itemId];
      }
      return next;
    });
  };

  const patchDraft = (itemId: number, patch: Partial<WarehouseItemSelection>) => {
    setDraft((prev) => {
      const row = prev[itemId];
      if (!row) return prev;
      return { ...prev, [itemId]: { ...row, ...patch } };
    });
  };

  const gridRows: GridRow[] = useMemo(
    () =>
      catalogItems.map((item) => {
        const sel = draft[item.itemId];
        return {
          ...item,
          selected: Boolean(sel),
          quantity: sel?.quantity ?? 1,
          description: sel?.description ?? '',
        };
      }),
    [catalogItems, draft],
  );

  const columns: ColumnDef<GridRow>[] = [
    {
      id: 'select',
      header: 'انتخاب',
      size: 72,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Checkbox
            checked={row.original.selected}
            onCheckedChange={(v) => toggleRow(row.original, v === true)}
            aria-label={`انتخاب ${row.original.itemName}`}
          />
        </div>
      ),
    },
    {
      accessorKey: 'itemName',
      header: 'نام کالا',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.itemName}</p>
          {row.original.sku ? (
            <p className="text-xs text-muted-foreground">کد: {row.original.sku}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'onHand',
      header: 'موجودی انبار',
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.onHand}
          {row.original.unit ? ` ${row.original.unit}` : ''}
        </span>
      ),
    },
    {
      id: 'quantity',
      header: 'تعداد درخواست',
      size: 120,
      cell: ({ row }) =>
        row.original.selected ? (
          <Input
            type="number"
            min={1}
            className="h-8 w-24"
            value={row.original.quantity}
            onChange={(e) =>
              patchDraft(row.original.itemId, {
                quantity: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: 'description',
      header: 'توضیح / مدل',
      cell: ({ row }) =>
        row.original.selected ? (
          <Input
            className="h-8"
            value={row.original.description}
            onChange={(e) => patchDraft(row.original.itemId, { description: e.target.value })}
            placeholder="اختیاری"
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  const draftCount = Object.keys(draft).length;

  return (
    <div className="space-y-3">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">اقلام درخواست</CardTitle>
              <CardDescription className="mt-1">
                {canPick
                  ? `پیشنهاد اقلام بر اساس انبار${warehouseName ? ` «${warehouseName}»` : ''}`
                  : 'ابتدا انبار را انتخاب کنید، سپس کالاها را از همان انبار برگزینید'}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={disabled || !canPick}
              onClick={openPicker}
            >
              <PackagePlus className="ml-2 h-4 w-4" />
              {selectedCount > 0 ? 'ویرایش انتخاب کالا' : 'انتخاب کالا از انبار'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedCount === 0 ? (
            <p className="text-sm text-muted-foreground">هنوز کالایی انتخاب نشده است.</p>
          ) : (
            <ul className="divide-y rounded-md border bg-card">
              {selectedList.map((li) => (
                <li
                  key={li.itemId}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{li.itemName}</span>
                  <Badge variant="secondary">تعداد {li.quantity}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AdvancedModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="انتخاب کالا از انبار"
        description={
          warehouseName
            ? `کالاهای انبار «${warehouseName}» — تعداد و توضیح هر قلم را در ردیف مشخص کنید.`
            : 'کالاها را تیک بزنید؛ تعداد و توضیح هر قلم را در همان ردیف جدول مشخص کنید.'
        }
        size="xl"
        footer={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                onChange(selectionsFromDraft(draft));
                setPickerOpen(false);
              }}
            >
              تأیید انتخاب ({draftCount} قلم)
            </Button>
            <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
              انصراف
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>جستجو</Label>
            <div className="relative">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pr-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="نام یا کد کالا"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <AdvancedDataGrid<GridRow>
            data={gridRows}
            columns={columns}
            totalItems={gridRows.length}
            pagination={pagination}
            onPaginationChange={setPagination}
            globalFilter=""
            onGlobalFilterChange={() => {}}
            columnFilters={[]}
            onColumnFiltersChange={() => {}}
            sorting={sorting}
            onSortingChange={setSorting}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            isLoading={loading}
            onRefresh={() => void loadCatalog()}
            entityName="کالای انبار"
          />
        </div>
      </AdvancedModal>
    </div>
  );
}

'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  VisibilityState,
  ColumnSizingState,
  OnChangeFn,
  type Cell,
  type Column,
} from '@tanstack/react-table';

import { ColumnFilter } from '../column-filter';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Download, Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface AdvancedDataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  totalItems: number;

  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;

  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;

  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;

  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;

  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: () => Promise<T[]>;

  entityName?: string;
  onCreateClick?: () => void;

  globalFilterForm?: React.ReactNode;
  enableColumnFilters?: boolean;
  /**
   * true = فیلتر سمت سرور (والد با API اعمال می‌کند).
   * false = فیلتر روی دادهٔ همین صفحه (پیش‌فرض — بدون آن فیلترها عملاً بی‌اثرند).
   */
  manualFiltering?: boolean;
  /** کشیدن لبهٔ ستون برای تغییر عرض (فقط نمای جدول دسکتاپ) */
  enableColumnResizing?: boolean;
  /** ذخیرهٔ عرض ستون‌ها در localStorage (مثلاً admin-users-table) */
  columnSizingStorageKey?: string;
  /** گزینه‌های تعداد ردیف در هر صفحه — پیش‌فرض ۱۰ / ۲۰ / ۵۰ / ۱۰۰ */
  pageSizeOptions?: number[];
  variant?: 'default' | 'erpClassic';
}

function DefaultTextColumnFilter({
  value,
  onFilterChange,
  placeholder,
}: {
  value: unknown;
  onFilterChange: (value: unknown) => void;
  placeholder?: string;
}) {
  return (
    <Input
      autoFocus
      placeholder={placeholder ?? 'جستجو…'}
      value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
      onChange={(e) => onFilterChange(e.target.value)}
      className="h-9"
    />
  );
}

function readStoredColumnSizing(key: string): ColumnSizingState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ColumnSizingState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** کلید پایدار localStorage برای ذخیرهٔ عرض ستون‌ها (بر اساس entityName یا کلید صریح). */
function resolveColumnSizingStorageKey(entityName?: string, explicit?: string): string | undefined {
  if (explicit) return explicit;
  if (entityName == null || typeof entityName !== 'string') return undefined;
  const normalized = entityName.replace(/\s*\([^)]*\)\s*/g, '').trim();
  return normalized ? `erp-column-sizing:${normalized}` : undefined;
}

function getColumnHeaderLabel<T>(column: Column<T, unknown>): string {
  const h = column.columnDef.header;
  if (typeof h === 'string') return h;
  const meta = column.columnDef.meta as { mobileLabel?: string } | undefined;
  return meta?.mobileLabel ?? column.id;
}

/** روی موبایل: چند سلول اول + آخر (معمولاً اکشن) در پیش‌نمایش؛ بقیه پشت «بیشتر». */
function partitionCellsForMobile<T>(cells: Cell<T, unknown>[]) {
  const n = cells.length;
  if (n <= 4) return { preview: cells, hidden: [] as Cell<T, unknown>[] };
  return {
    preview: [cells[0], cells[1], cells[n - 1]],
    hidden: cells.slice(2, n - 1),
  };
}

export function AdvancedDataGrid<T>({
  data,
  columns,
  totalItems,
  pagination,
  onPaginationChange,
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  onColumnFiltersChange,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  isLoading = false,
  onRefresh,
  onExport,
  entityName = 'داده',
  onCreateClick,
  globalFilterForm,
  enableColumnFilters = true,
  manualFiltering = false,
  enableColumnResizing = true,
  columnSizingStorageKey,
  pageSizeOptions = [...DEFAULT_PAGE_SIZE_OPTIONS],
  variant = 'erpClassic',
}: AdvancedDataGridProps<T>) {
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState('');
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({});

  const resolvedGlobalFilter = globalFilter ?? internalGlobalFilter;
  const resolvedOnGlobalFilterChange = onGlobalFilterChange ?? setInternalGlobalFilter;
  const resolvedColumnFilters = columnFilters ?? internalColumnFilters;
  const resolvedOnColumnFiltersChange = onColumnFiltersChange ?? setInternalColumnFilters;
  const resolvedSorting = sorting ?? internalSorting;
  const resolvedOnSortingChange = onSortingChange ?? setInternalSorting;
  const baseColumnVisibility = columnVisibility ?? internalColumnVisibility;
  /** ستون شناسه (id) همیشه مخفی — در همه جداول */
  const resolvedColumnVisibility: VisibilityState = {
    ...baseColumnVisibility,
    id: false,
  };
  const baseOnColumnVisibilityChange = onColumnVisibilityChange ?? setInternalColumnVisibility;
  const resolvedOnColumnVisibilityChange: OnChangeFn<VisibilityState> = React.useCallback(
    (updater) => {
      baseOnColumnVisibilityChange((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return { ...next, id: false };
      });
    },
    [baseOnColumnVisibilityChange],
  );

  const displayColumns = React.useMemo(
    () =>
      columns.map((col) => {
        const key =
          ('id' in col && col.id != null ? String(col.id) : null) ??
          ('accessorKey' in col && col.accessorKey != null ? String(col.accessorKey) : null);
        if (key === 'id') {
          return { ...col, enableHiding: false };
        }
        return col;
      }),
    [columns],
  );

  const resolvedColumnSizingStorageKey = React.useMemo(
    () =>
      enableColumnResizing
        ? resolveColumnSizingStorageKey(entityName, columnSizingStorageKey)
        : undefined,
    [enableColumnResizing, entityName, columnSizingStorageKey],
  );

  const [columnPanelOpen, setColumnPanelOpen] = React.useState(false);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(() =>
    resolvedColumnSizingStorageKey
      ? readStoredColumnSizing(resolvedColumnSizingStorageKey)
      : {},
  );
  const [mobileRowExpanded, setMobileRowExpanded] = React.useState<Record<string, boolean>>({});

  const panelRef = React.useRef<HTMLDivElement>(null);

  // بستن پنل با کلیک بیرون
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setColumnPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // debounce
  const useDebouncedCallback = <TArgs extends unknown[]>(
    callback: (...args: TArgs) => void,
    delay = 400
  ) => {
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    return React.useCallback((...args: TArgs) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);
  };

  const debouncedGlobalFilter = useDebouncedCallback(resolvedOnGlobalFilterChange);

  // filter helpers
  const isEmptyFilter = (value: unknown) => {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).every(v => v === undefined || v === '');
    }
    return false;
  };

  const isFilterActive = (value: unknown) => !isEmptyFilter(value);

  const handleColumnFilterChange = React.useCallback((columnId: string, value: unknown) => {
    resolvedOnColumnFiltersChange((prev) => {
      const filters = prev ?? [];
      const filtered = filters.filter((f) => f.id !== columnId);
      if (isEmptyFilter(value)) return filtered;
      return [...filtered, { id: columnId, value }];
    });
  }, [resolvedOnColumnFiltersChange]);

  const handleColumnSizingChange: OnChangeFn<ColumnSizingState> = React.useCallback(
    (updater) => {
      setColumnSizing((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (resolvedColumnSizingStorageKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(resolvedColumnSizingStorageKey, JSON.stringify(next));
          } catch {
            /* ignore quota / private mode */
          }
        }
        return next;
      });
    },
    [resolvedColumnSizingStorageKey],
  );

  const table = useReactTable({
    data,
    columns: displayColumns,
    defaultColumn: enableColumnResizing
      ? { minSize: 56, size: 128, maxSize: 720 }
      : undefined,
    state: {
      pagination,
      globalFilter: resolvedGlobalFilter,
      columnFilters: resolvedColumnFilters,
      sorting: resolvedSorting,
      columnVisibility: resolvedColumnVisibility,
      ...(enableColumnResizing ? { columnSizing } : {}),
    },
    onPaginationChange,
    onGlobalFilterChange: resolvedOnGlobalFilterChange,
    onColumnFiltersChange: resolvedOnColumnFiltersChange,
    onSortingChange: resolvedOnSortingChange,
    onColumnVisibilityChange: resolvedOnColumnVisibilityChange,
    ...(enableColumnResizing ? { onColumnSizingChange: handleColumnSizingChange } : {}),
    enableColumnFilters,
    enableColumnResizing,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'rtl',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering,
    pageCount: Math.ceil(totalItems / pagination.pageSize),
  });

  const getColumnFilterValue = (id: string) =>
    resolvedColumnFilters.find((f) => f.id === id)?.value;

  const canShowColumnFilter = (column: Column<T, unknown>) => {
    if (!enableColumnFilters || !column.getCanFilter()) return false;
    // ستون‌های فقط نمایشی (عملیات و…) بدون accessor فیلترپذیر نیستند
    const def = column.columnDef as { accessorKey?: unknown; accessorFn?: unknown };
    return def.accessorKey != null || typeof def.accessorFn === 'function';
  };

  const renderColumnFilter = (columnId: string, header: { column: Column<T, unknown> }) => {
    const filterValue = getColumnFilterValue(columnId);
    const custom = header.column.columnDef.meta?.filterComponent?.({
      column: header.column,
      value: filterValue,
      onFilterChange: (v: unknown) => handleColumnFilterChange(columnId, v),
    });
    if (custom) return custom;
    return (
      <DefaultTextColumnFilter
        value={filterValue}
        onFilterChange={(v) => handleColumnFilterChange(columnId, v)}
        placeholder={`فیلتر ${String(header.column.columnDef.header ?? columnId)}`}
      />
    );
  };

  const handleExport = async () => {
    let exportData = data;
    if (onExport) exportData = await onExport();

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, entityName);

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), `${entityName}-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const isClassic = variant === 'erpClassic';
  const tableShellClass = isClassic
    ? 'border border-sky-200 rounded-xl bg-white dark:bg-zinc-950'
    : 'border-blue-400 rounded-2xl bg-white dark:bg-zinc-950';
  const theadClass = isClassic ? 'bg-sky-50 dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-900';
  const columnDividerClass = isClassic ? 'border-l border-sky-200' : 'border-l border-zinc-200';
  /** در RTL، ps = فاصله از راست (شروع سطر) */
  const headerCellClass = cn(
    isClassic
      ? 'ps-5 pe-3 py-2.5 text-xs text-right text-sky-900 border-b border-sky-200 whitespace-nowrap'
      : 'ps-6 pe-4 py-3 text-xs text-right text-zinc-500',
    enableColumnResizing && columnDividerClass,
  );
  const rowClass = isClassic
    ? 'border-b border-sky-100 even:bg-sky-50/40 hover:bg-sky-100/40 dark:hover:bg-zinc-900/50 transition-colors'
    : 'border-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors';
  const cellClass = cn(
    isClassic
      ? cn('ps-5 pe-3 py-2 text-sm whitespace-nowrap', !enableColumnResizing && 'border-l border-sky-100')
      : 'ps-6 pe-4 py-4 text-sm',
    enableColumnResizing && columnDividerClass,
  );

  const mobileCardClass = isClassic
    ? 'rounded-xl border border-sky-200 bg-white p-3 shadow-sm dark:border-sky-900/40 dark:bg-zinc-950'
    : 'rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-950';

  const mobileDivide = isClassic
    ? 'divide-sky-100/80 dark:divide-zinc-800'
    : 'divide-zinc-100 dark:divide-zinc-800';

  const toggleMobileRow = (rowId: string) => {
    setMobileRowExpanded((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const mobileFilterableHeaders = enableColumnFilters
    ? table.getHeaderGroups().flatMap((hg) => hg.headers.filter((h) => canShowColumnFilter(h.column)))
    : [];

  return (
    <div className="space-y-4 min-w-0 w-full max-w-full">

      {/* Toolbar — موبایل‌اول: ستون روی xs، ردیف از sm */}
      <div className="flex flex-col gap-3 pe-1 ps-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:ps-4">

        <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:gap-3">
          <Input
            placeholder={`جستجو در ${entityName}...`}
            value={resolvedGlobalFilter}
            onChange={(e) => {
              const value = e.target.value;
              if (manualFiltering) debouncedGlobalFilter(value);
              else resolvedOnGlobalFilterChange(value);
            }}
            className="min-h-9 w-full min-w-0 sm:max-w-md sm:flex-1 md:min-w-72"
          />

        </div>

        <div className="flex w-full flex-wrap items-stretch gap-2 sm:w-auto sm:items-center sm:justify-end">

          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            بروزرسانی
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            اکسپورت
          </Button>

          {/* Column Toggle */}
          <div className="relative">
            <Button size="sm" variant="outline" onClick={() => setColumnPanelOpen(p => !p)}>
              ستون‌ها
            </Button>

            {columnPanelOpen && (
              <div
                ref={panelRef}
                className="fixed inset-x-3 bottom-4 z-50 max-h-[min(24rem,70vh)] overflow-auto rounded-xl border bg-white p-3 space-y-3 shadow-lg dark:bg-zinc-900 sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-64 sm:w-64"
              >
                <div className="text-xs text-muted-foreground">مدیریت ستون‌ها</div>

                <div className="space-y-2 max-h-64 overflow-auto">
                  {table.getAllLeafColumns().map(column => {
                    if (!column.getCanHide() || column.id === 'id') return null;

                    return (
                      <label key={column.id} className="flex justify-between text-sm cursor-pointer">
                        <span>
                          {String(column.columnDef.header ?? column.id)}
                        </span>
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={() => column.toggleVisibility()}
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-2 border-t">
                  <Button size="sm" variant="ghost"
                    onClick={() =>
                      table.getAllLeafColumns().forEach((c) => {
                        if (c.id === 'id' || !c.getCanHide()) return;
                        c.toggleVisibility(false);
                      })
                    }
                  >
                    مخفی همه
                  </Button>

                  <Button size="sm" variant="ghost"
                    onClick={() =>
                      table.getAllLeafColumns().forEach((c) => {
                        if (c.id === 'id' || !c.getCanHide()) return;
                        c.toggleVisibility(true);
                      })
                    }
                  >
                    نمایش همه
                  </Button>
                </div>
              </div>
            )}
          </div>

          {onCreateClick && (
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              ایجاد
            </Button>
          )}
        </div>
      </div>

      {globalFilterForm && (
        <div
          className={
            isClassic
              ? 'rounded-lg border border-sky-200 bg-sky-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/40'
              : 'rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40'
          }
        >
          {globalFilterForm}
        </div>
      )}

      {/* موبایل: فیلتر ستون‌ها (روی دسکتاپ در هدر جدول است) */}
      {mobileFilterableHeaders.length > 0 && (
        <div
          className={
            isClassic
              ? 'md:hidden space-y-3 rounded-lg border border-sky-200 bg-sky-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-900/40'
              : 'md:hidden space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/40'
          }
        >
          <div className="text-xs font-semibold text-foreground">فیلتر ستون‌ها</div>
          <div className="space-y-3">
            {mobileFilterableHeaders.map((header) => {
              const columnId = header.column.id;
              const filterValue = getColumnFilterValue(columnId);
              return (
                <div
                  key={header.id}
                  className="space-y-2 border-b border-border/50 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {String(header.column.columnDef.header ?? columnId)}
                    </span>
                    {isFilterActive(filterValue) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 px-2 text-xs"
                        onClick={() => handleColumnFilterChange(columnId, null)}
                      >
                        پاک کردن
                      </Button>
                    )}
                  </div>
                  <div className="min-w-0">
                    {renderColumnFilter(columnId, header)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* دسکتاپ: جدول کامل — اسکرول افقی در صورت زیاد بودن ستون‌ها */}
      <div className="hidden md:block min-w-0 w-full max-w-full">
        <div
          className={cn(
            tableShellClass,
            'overflow-x-auto overscroll-x-contain max-w-full [scrollbar-gutter:stable]',
          )}
        >
            <table
              dir="rtl"
              className={cn(
                enableColumnResizing
                  ? 'table-fixed border-collapse min-w-full'
                  : 'w-max min-w-full',
              )}
              style={
                enableColumnResizing
                  ? {
                      width: table.getCenterTotalSize(),
                      minWidth: `max(100%, ${table.getCenterTotalSize()}px)`,
                    }
                  : undefined
              }
            >
              <thead className={theadClass}>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(header => {
                      const canSort = header.column.getCanSort();
                      const isSorted = header.column.getIsSorted();
                      const columnId = header.column.id;
                      const filterValue = getColumnFilterValue(columnId);
                      const canResize = enableColumnResizing && header.column.getCanResize();

                      return (
                        <th
                          key={header.id}
                          className={cn(headerCellClass, canResize && 'relative')}
                          style={
                            enableColumnResizing
                              ? { width: header.getSize(), minWidth: header.getSize() }
                              : undefined
                          }
                        >
                          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                            <button
                              type="button"
                              className={cn(
                                "flex items-center gap-1 select-none",
                                canSort ? "cursor-pointer hover:text-zinc-700" : "cursor-default"
                              )}
                              onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                              aria-label={canSort ? `مرتب‌سازی ${String(header.column.columnDef.header ?? '')}` : undefined}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}

                              {canSort && (
                                <span>
                                  {isSorted === 'asc'
                                    ? <ChevronUp className="h-3.5 w-3.5" />
                                    : isSorted === 'desc'
                                      ? <ChevronDown className="h-3.5 w-3.5" />
                                      : <ChevronDown className="h-3.5 w-3.5 opacity-40" />}
                                </span>
                              )}
                            </button>

                            {canShowColumnFilter(header.column) && (
                              <ColumnFilter
                                isActive={isFilterActive(filterValue)}
                                onClear={() => handleColumnFilterChange(columnId, null)}
                                title={`فیلتر ${String(header.column.columnDef.header ?? header.column.id)}`}
                              >
                                {renderColumnFilter(columnId, header)}
                              </ColumnFilter>
                            )}
                          </div>

                          {canResize && (
                            <button
                              type="button"
                              aria-label={`تغییر عرض ستون ${String(header.column.columnDef.header ?? columnId)}`}
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              onDoubleClick={() => header.column.resetSize()}
                              className={cn(
                                'absolute top-0 bottom-0 left-0 z-10 w-2 -translate-x-1/2',
                                'cursor-col-resize touch-none select-none bg-transparent',
                                'hover:bg-sky-300/35 active:bg-sky-400/45',
                                header.column.getIsResizing() && 'bg-sky-400/50',
                              )}
                            />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody>
                {isLoading ? (
                  <tr><td colSpan={columns.length} className="h-80 text-center">در حال بارگذاری...</td></tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr><td colSpan={columns.length} className="h-80 text-center text-muted-foreground">داده‌ای یافت نشد</td></tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className={rowClass}>
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className={cn(cellClass, enableColumnResizing && 'overflow-hidden')}
                          style={
                            enableColumnResizing
                              ? { width: cell.column.getSize(), minWidth: cell.column.getSize() }
                              : undefined
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>

      {/* موبایل: کارت + ردیف بازشونده برای ستون‌های اضافه */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className={cn('flex min-h-48 items-center justify-center text-sm text-muted-foreground', mobileCardClass)}>
            در حال بارگذاری...
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className={cn('flex min-h-48 items-center justify-center text-sm text-muted-foreground', mobileCardClass)}>
            داده‌ای یافت نشد
          </div>
        ) : (
          table.getRowModel().rows.map((row) => {
            const cells = row.getVisibleCells();
            const { preview, hidden } = partitionCellsForMobile(cells);
            const expanded = Boolean(mobileRowExpanded[row.id]);
            const showToggle = hidden.length > 0;

            const renderField = (cell: Cell<T, unknown>) => (
              <div key={cell.id} className="flex min-w-0 flex-col gap-0.5 py-2 text-right first:pt-0 last:pb-0">
                <span className="text-xs text-muted-foreground">{getColumnHeaderLabel(cell.column)}</span>
                <div className="min-w-0 wrap-break-word text-sm leading-relaxed">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              </div>
            );

            return (
              <div key={row.id} className={mobileCardClass}>
                <div className={cn('divide-y', mobileDivide)}>
                  {preview.map((cell) => renderField(cell))}
                </div>

                {showToggle && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleMobileRow(row.id)}
                      aria-expanded={expanded}
                      className="mt-2 flex min-h-9 w-full touch-manipulation items-center justify-center gap-1 rounded-lg border border-dashed px-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 active:bg-muted/60"
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 shrink-0" />
                          بستن جزئیات
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 shrink-0" />
                          نمایش {hidden.length} مورد دیگر
                        </>
                      )}
                    </button>

                    {expanded && (
                      <div className={cn('mt-3 space-y-0 border-t pt-1', isClassic ? 'border-sky-200 dark:border-zinc-800' : 'border-zinc-200 dark:border-zinc-800')}>
                        <div className={cn('divide-y', mobileDivide)}>
                          {hidden.map((cell) => renderField(cell))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-center sm:text-start">
            نمایش{' '}
            {totalItems === 0
              ? 0
              : pagination.pageIndex * pagination.pageSize + 1}{' '}
            تا {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalItems)} از{' '}
            {totalItems}
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">تعداد در صفحه</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => {
                const nextSize = Number(value);
                if (!Number.isFinite(nextSize) || nextSize < 1) return;
                onPaginationChange((prev) => ({
                  ...prev,
                  pageSize: nextSize,
                  pageIndex: 0,
                }));
              }}
            >
              <SelectTrigger className="h-8 w-[4.75rem]" aria-label="تعداد ردیف در صفحه">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(pageSizeOptions.includes(pagination.pageSize)
                  ? pageSizeOptions
                  : [...pageSizeOptions, pagination.pageSize].sort((a, b) => a - b)
                ).map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
          <Button
            size="sm"
            onClick={() => onPaginationChange((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))}
            disabled={pagination.pageIndex === 0}
          >
            قبلی
          </Button>

          <Button
            size="sm"
            onClick={() => onPaginationChange((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            disabled={pagination.pageIndex >= table.getPageCount() - 1}
          >
            بعدی
          </Button>
        </div>
      </div>

    </div>
  );
}
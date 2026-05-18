'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import { ColumnDef, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';
import {
  createCounterpartyAction,
  deleteCounterpartyAction,
  getCounterpartiesAction,
  updateCounterpartyAction,
} from '@/app/_actions/counterparty-actions';
import type { Counterparty } from '@/app/dashboard/payment-request/_types/counterparty.types';
import {
  CounterpartyFormSchema,
  type CounterpartyFormValues,
} from '@/app/dashboard/payment-request/_types/counterparty.schema';
import { useFormAction } from '@/app/hooks/use-form-action';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { CounterpartyBankAccountsPanel } from './_components/counterparty-bank-accounts-panel';

const defaultValues: CounterpartyFormValues = {
  name: '',
  partyType: 'company',
  companyName: '',
  notes: '',
  isActive: true,
};

export default function CounterpartiesAdminPage() {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const { executeDelete } = useDeleteAction();
  const [items, setItems] = useState<Counterparty[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gridPending, startGridTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const form = useForm<CounterpartyFormValues>({
    resolver: zodResolver(CounterpartyFormSchema),
    defaultValues,
  });

  const partyType = form.watch('partyType');

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getCounterpartiesAction({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: appliedSearch || undefined,
      activeOnly: false,
    });
    if (result.success && result.data) {
      setItems(result.data.items);
      setTotal(result.data.total);
    } else {
      notifyError(result.error || 'خطا در دریافت طرف‌حساب‌ها');
    }
    setLoading(false);
  }, [appliedSearch, notifyError, pagination.pageIndex, pagination.pageSize]);

  const triggerLoad = useCallback(() => {
    startGridTransition(() => void load());
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(t);
  }, [triggerLoad]);

  const openCreate = () => {
    setEditingId(null);
    form.reset(defaultValues);
    setModalOpen(true);
  };

  const openEdit = (row: Counterparty) => {
    setEditingId(row.id);
    form.reset({
      name: row.name,
      partyType: row.partyType,
      companyName: row.companyName ?? '',
      notes: row.notes ?? '',
      isActive: row.isActive,
    });
    setModalOpen(true);
  };

  const onSubmit = (values: CounterpartyFormValues) => {
    startTransition(async () => {
      const result = editingId
        ? await updateCounterpartyAction(editingId, values)
        : await createCounterpartyAction(values);
      if (result.success) {
        notifySuccess(editingId ? 'طرف‌حساب به‌روزرسانی شد' : 'طرف‌حساب ایجاد شد');
        setModalOpen(false);
        triggerLoad();
      } else {
        notifyError(result.error || 'ذخیره ناموفق بود');
      }
    });
  };

  const handleDelete = (id: number) => {
    void executeDelete(() => deleteCounterpartyAction(id), { onSuccess: () => triggerLoad() });
  };

  const columns: ColumnDef<Counterparty>[] = [
    { accessorKey: 'name', header: 'نام' },
    {
      accessorKey: 'partyType',
      header: 'نوع',
      cell: ({ row }) => (row.original.partyType === 'person' ? 'حقیقی' : 'حقوقی'),
    },
    {
      id: 'bankAccounts',
      header: 'تعداد حساب',
      cell: ({ row }) => {
        const n = row.original.bankAccounts?.length;
        return n != null && n > 0 ? String(n) : '—';
      },
    },
    {
      accessorKey: 'isActive',
      header: 'وضعیت',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'فعال' : 'غیرفعال'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>مدیریت طرف‌حساب‌ها</CardTitle>
          <Button type="button" onClick={openCreate}>
            <Plus className="ml-1 h-4 w-4" />
            طرف‌حساب جدید
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="جستجو نام / شرکت…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAppliedSearch(search.trim());
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              اعمال فیلتر
            </Button>
          </div>

          <AdvancedDataGrid<Counterparty>
            data={items}
            columns={columns}
            totalItems={total}
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
            isLoading={loading || gridPending}
            entityName="طرف‌حساب"
            onRefresh={triggerLoad}
            onExport={async () => items}
          />
        </CardContent>
      </Card>

      <AdvancedModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? 'ویرایش طرف‌حساب' : 'طرف‌حساب جدید'}
        size="lg"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <Button type="submit" form="counterparty-admin-form" disabled={isPending}>
              {isPending && <Loader2 className="ml-1 h-4 w-4 animate-spin" />}
              ذخیره
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isPending}>
              انصراف
            </Button>
          </div>
        }
      >
        <Form {...form}>
          <form id="counterparty-admin-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="person">حقیقی</SelectItem>
                      <SelectItem value="company">حقوقی</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {partyType === 'company' && (
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام شرکت</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {editingId != null && (
              <CounterpartyBankAccountsPanel counterpartyId={editingId} />
            )}

            {editingId == null && (
              <p className="text-sm text-muted-foreground">
                پس از ذخیره طرف‌حساب، می‌توانید چند حساب بانکی برای آن تعریف کنید.
              </p>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>یادداشت</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel>فعال</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </AdvancedModal>
    </DashboardPageShell>
  );
}

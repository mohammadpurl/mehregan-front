'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { AdvancedModal } from '@/app/components/Modal';
import { ColumnDef } from '@tanstack/react-table';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/app/components/ui/form';
import { Badge } from '@/app/components/ui/badge';
import {
  createCompanyBankAccountAction,
  deleteCompanyBankAccountAction,
  getCompanyBankAccountsAction,
  updateCompanyBankAccountAction,
} from '@/app/_actions/company-bank-account-actions';
import type { CompanyBankAccount } from '@/app/dashboard/payment-request/_types/bank-account.types';
import {
  BankAccountFormSchema,
  type BankAccountFormValues,
} from '@/app/dashboard/payment-request/_types/bank-account.schema';
import { BankAccountFormFields } from '@/app/dashboard/payment-request/_components/bank-account/bank-account-form-fields';
import { formatBankAccountLabel } from '@/app/dashboard/payment-request/_utils/bank-account-display';
import { useFormAction } from '@/app/hooks/use-form-action';
import { useDeleteAction } from '@/app/hooks/use-delete-action';

const defaultValues: BankAccountFormValues = {
  label: '',
  bankName: '',
  accountNumber: '',
  shebaNumber: '',
  cardNumber: '',
  isDefault: false,
};

function accountToFormValues(row: CompanyBankAccount): BankAccountFormValues {
  return {
    label: row.label,
    bankName: row.bankName,
    accountNumber: row.accountNumber ?? '',
    shebaNumber: row.shebaNumber ?? '',
    cardNumber: row.cardNumber ?? '',
    isDefault: row.isDefault,
  };
}

export default function CompanyBankAccountsAdminPage() {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const { executeDelete } = useDeleteAction();
  const [items, setItems] = useState<CompanyBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridPending, startGridTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(BankAccountFormSchema),
    defaultValues,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getCompanyBankAccountsAction();
    if (result.success) setItems(result.data);
    else notifyError(result.error || 'خطا در دریافت حساب‌ها');
    setLoading(false);
  }, [notifyError]);

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

  const openEdit = (row: CompanyBankAccount) => {
    setEditingId(row.id);
    form.reset(accountToFormValues(row));
    setModalOpen(true);
  };

  const onSubmit = (values: BankAccountFormValues) => {
    startTransition(async () => {
      const result = editingId
        ? await updateCompanyBankAccountAction(editingId, values)
        : await createCompanyBankAccountAction(values);
      if (result.success) {
        notifySuccess(editingId ? 'حساب بانکی به‌روزرسانی شد' : 'حساب بانکی شرکت ثبت شد');
        setModalOpen(false);
        setEditingId(null);
        form.reset(defaultValues);
        triggerLoad();
      } else {
        notifyError(result.error || 'ذخیره ناموفق بود');
      }
    });
  };

  const handleDelete = (id: number) => {
    void executeDelete(() => deleteCompanyBankAccountAction(id), { onSuccess: () => triggerLoad() });
  };

  const columns: ColumnDef<CompanyBankAccount>[] = [
    { accessorKey: 'label', header: 'عنوان' },
    { accessorKey: 'bankName', header: 'بانک' },
    {
      accessorKey: 'accountNumber',
      header: 'حساب / شبا',
      cell: ({ row }) => formatBankAccountLabel(row.original),
    },
    {
      accessorKey: 'isDefault',
      header: 'پیش‌فرض',
      cell: ({ row }) =>
        row.original.isDefault ? <Badge>پیش‌فرض</Badge> : <span className="text-muted-foreground">—</span>,
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
          <CardTitle>حساب‌های بانکی شرکت (مبدأ پرداخت)</CardTitle>
          <Button type="button" onClick={openCreate}>
            <Plus className="ml-1 h-4 w-4" />
            حساب جدید
          </Button>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            این حساب‌ها در دستور پرداخت و تأیید وام/مساعده به‌عنوان مبدأ پرداخت انتخاب می‌شوند.
          </p>
          <AdvancedDataGrid<CompanyBankAccount>
            data={items}
            columns={columns}
            totalItems={items.length}
            pagination={{ pageIndex: 0, pageSize: Math.max(items.length, 10) }}
            onPaginationChange={() => {}}
            sorting={[]}
            onSortingChange={() => {}}
            isLoading={loading || gridPending}
            entityName="حساب بانکی"
            onRefresh={triggerLoad}
            onExport={async () => items}
          />
        </CardContent>
      </Card>

      <AdvancedModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingId(null);
        }}
        title={editingId ? 'ویرایش حساب بانکی شرکت' : 'حساب بانکی شرکت'}
        size="lg"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <Button type="submit" form="company-bank-account-form" disabled={isPending}>
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
          <form id="company-bank-account-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <BankAccountFormFields control={form.control} />
          </form>
        </Form>
      </AdvancedModal>
    </DashboardPageShell>
  );
}

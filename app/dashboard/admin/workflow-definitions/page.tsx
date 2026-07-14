'use client';

import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { AdvancedModal } from '@/app/components/Modal';
import { AdvancedDataGrid } from '@/app/components/Table/Table';
import { ColumnDef, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  deleteWorkflowDefinitionAction,
  getWorkflowDefinitionsAction,
  upsertWorkflowDefinitionAction,
} from '@/app/_actions/workflow-definition-actions';
import type { WorkflowDefinition, WorkflowStepConfig } from '@/app/_types/workflow-definition.types';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import { useFormAction } from '@/app/hooks/use-form-action';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { WorkflowStepsBuilder } from './_components/workflow-steps-builder';
import { createEmptyStep } from './_utils/workflow-definition-mapper';

const REF_TYPES: { value: WorkflowBusinessRefType; label: string }[] = [
  { value: 'workflow_form', label: 'فرم گردش کار' },
  { value: 'payment_request', label: 'درخواست پرداخت / وام / مساعده' },
  { value: 'petty_cash', label: 'تنخواه' },
  { value: 'warehouse_form', label: 'فرم انبار' },
  { value: 'request', label: 'درخواست خرید' },
];

const DEFAULT_STEPS: WorkflowStepConfig[] = [
  {
    order: 1,
    role_aliases: ['finance_manager', 'مدیر مالی'],
    assignee_strategy: 'role_pool',
    assignee_user_id: null,
    label: 'تأیید مدیر مالی',
  },
  {
    order: 2,
    role_aliases: ['ceo', 'مدیرعامل'],
    assignee_strategy: 'submitter_manager',
    assignee_user_id: null,
    label: 'تأیید مدیر مستقیم',
  },
];

function strategyLabel(strategy: string): string {
  switch (strategy) {
    case 'fixed_user':
      return 'شخص مشخص';
    case 'submitter_manager':
      return 'مدیر مستقیم';
    case 'department_head':
      return 'مسئول واحد';
    default:
      return 'از نقش';
  }
}

export default function WorkflowDefinitionsPage() {
  const { runAction } = useFormAction();
  const { executeDelete } = useDeleteAction();
  const [rows, setRows] = useState<WorkflowDefinition[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkflowDefinition | null>(null);

  const [refType, setRefType] = useState<WorkflowBusinessRefType>('payment_request');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [steps, setSteps] = useState<WorkflowStepConfig[]>(DEFAULT_STEPS);
  const [formError, setFormError] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const load = useCallback(async () => {
    setLoading(true);
    const sortBy = sorting[0]?.id;
    const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
    const result = await getWorkflowDefinitionsAction({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      sortBy,
      sortOrder,
    });
    if (result.success && result.data) {
      setRows(result.data.items || []);
      setTotal(result.data.total || 0);
    }
    setLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  const triggerLoad = useCallback(() => {
    startTransition(() => void load());
  }, [load, startTransition]);

  useEffect(() => {
    const t = setTimeout(() => triggerLoad(), 0);
    return () => clearTimeout(t);
  }, [triggerLoad]);

  const openCreate = () => {
    setEditing(null);
    setRefType('payment_request');
    setName('درخواست پرداخت / وام / مساعده');
    setCode('payment_request');
    setSteps(DEFAULT_STEPS.map((s, i) => ({ ...s, order: i + 1 })));
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: WorkflowDefinition) => {
    setEditing(row);
    setRefType(row.ref_type);
    setName(row.name);
    setCode(row.code);
    setSteps(row.steps.length > 0 ? row.steps : [createEmptyStep(1)]);
    setFormError(null);
    setModalOpen(true);
  };

  const validateSteps = (): string | null => {
    if (!steps.length) return 'حداقل یک مرحله تأیید لازم است';
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (!s.role_aliases.length) return `مرحله ${i + 1}: حداقل یک نقش انتخاب کنید`;
      if (s.assignee_strategy === 'fixed_user' && !s.assignee_user_id) {
        return `مرحله ${i + 1}: کاربر تأییدکننده را انتخاب کنید`;
      }
    }
    return null;
  };

  const handleSave = () => {
    const stepErr = validateSteps();
    if (stepErr) {
      setFormError(stepErr);
      return;
    }
    if (!name.trim()) {
      setFormError('نام تعریف را وارد کنید');
      return;
    }

    runAction(
      () =>
        upsertWorkflowDefinitionAction({
          ref_type: editing?.ref_type ?? refType,
          name: name.trim(),
          code: (code.trim() || editing?.ref_type || refType).trim(),
          steps,
        }),
      {
        successMessage: 'تعریف workflow ذخیره شد',
        errorMessage: 'ذخیره ناموفق بود',
        onSuccess: () => {
          setModalOpen(false);
          triggerLoad();
        },
      },
    );
  };

  const handleDelete = async (ref: WorkflowBusinessRefType) => {
    await executeDelete(() => deleteWorkflowDefinitionAction(ref), {
      successMessage: 'تعریف حذف شد',
      errorMessage: 'حذف ناموفق بود',
      onSuccess: triggerLoad,
    });
  };

  const columns: ColumnDef<WorkflowDefinition>[] = [
    { accessorKey: 'ref_type', header: 'نوع فرم' },
    { accessorKey: 'name', header: 'نام' },
    {
      id: 'stepsSummary',
      header: 'مراحل تأیید',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 text-xs">
          {row.original.steps.map((s) => (
            <span key={s.order}>
              {s.order}. {s.label || s.role_aliases[0]} — {strategyLabel(s.assignee_strategy)}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => void handleDelete(row.original.ref_type)}
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
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>تعریف زنجیره تأیید (Workflow)</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              مراحل تأیید بر اساس نقش (Role) است، نه Permission. قبل از استفاده، واحدها، مدیر مستقیم کاربران و
              نقش‌ها را در بخش مدیریت تکمیل کنید.
            </p>
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus className="ml-1 h-4 w-4" />
            تعریف جدید
          </Button>
        </CardHeader>
        <CardContent>
          <AdvancedDataGrid<WorkflowDefinition>
            data={rows}
            columns={columns}
            totalItems={total}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={setSorting}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            isLoading={loading || isPending}
            entityName="تعاریف"
            onRefresh={triggerLoad}
            onExport={async () => rows}
          />
        </CardContent>
      </Card>

      <AdvancedModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'ویرایش زنجیره تأیید' : 'تعریف زنجیره تأیید جدید'}
        size="full"
        footer={
          <div className="flex w-full gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              انصراف
            </Button>
            <Button type="button" onClick={handleSave}>
              ذخیره
            </Button>
          </div>
        }
      >
        <div className="space-y-6 text-right">
          <div className="grid gap-4 md:grid-cols-3">
            {!editing && (
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع فرم (ref_type)</label>
                <Select value={refType} onValueChange={(v) => setRefType(v as WorkflowBusinessRefType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REF_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">نام</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} dir="rtl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">کد (code)</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" />
            </div>
          </div>

          <WorkflowStepsBuilder refType={editing?.ref_type ?? refType} steps={steps} onChange={setSteps} />

          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>
      </AdvancedModal>
    </DashboardPageShell>
  );
}

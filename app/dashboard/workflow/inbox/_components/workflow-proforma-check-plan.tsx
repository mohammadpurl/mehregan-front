'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { RequiredMark } from '@/app/components/ui/required-mark';
import { FormattedNumberInput } from '@/app/components/ui/formatted-number-input';
import { JalaliDateInput } from '@/app/components/ui/jalali-date-input';
import { formatAmount } from '@/app/utils/number-format';

export type ProformaCheckPlanRow = {
  id: string;
  amount: number;
  dueDate: string;
};

type Props = {
  rows: ProformaCheckPlanRow[];
  onChange: (rows: ProformaCheckPlanRow[]) => void;
  expectedTotal?: number | null;
  disabled?: boolean;
};

function newRow(): ProformaCheckPlanRow {
  return {
    id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: 0,
    dueDate: '',
  };
}

export function WorkflowProformaCheckPlan({
  rows,
  onChange,
  expectedTotal,
  disabled,
}: Props) {
  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const expected =
    expectedTotal != null && Number.isFinite(expectedTotal) ? Number(expectedTotal) : null;
  const totalsMatch = expected == null || total === expected;

  const updateRow = (id: string, patch: Partial<ProformaCheckPlanRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-sm font-medium">
          برنامه چک‌ها
          <RequiredMark />
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...rows, newRow()])}
        >
          <Plus className="ml-1 h-4 w-4" />
          افزودن سطر
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr className="text-right">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">مبلغ چک (ریال)</th>
              <th className="px-3 py-2 font-medium">تاریخ سررسید</th>
              <th className="px-3 py-2 font-medium w-12" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-t align-top">
                <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                <td className="px-3 py-2">
                  <FormattedNumberInput
                    value={row.amount}
                    onChange={(v) => updateRow(row.id, { amount: v })}
                    min={0}
                    disabled={disabled}
                    placeholder="مبلغ"
                  />
                </td>
                <td className="px-3 py-2">
                  <JalaliDateInput
                    value={row.dueDate}
                    onChange={(v) => updateRow(row.id, { dueDate: v })}
                    disabled={disabled}
                  />
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled || rows.length <= 1}
                    onClick={() => removeRow(row.id)}
                    aria-label="حذف سطر"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <p>
          جمع چک‌ها:{' '}
          <strong>{formatAmount(total, { unit: 'ریال' })}</strong>
        </p>
        {expected != null ? (
          <p className={totalsMatch ? 'text-muted-foreground' : 'text-destructive'}>
            مبلغ پیش‌فاکتور: {formatAmount(expected, { unit: 'ریال' })}
            {!totalsMatch ? ' — جمع باید برابر باشد' : ''}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function createEmptyCheckPlanRows(count = 1): ProformaCheckPlanRow[] {
  return Array.from({ length: Math.max(1, count) }, () => newRow());
}

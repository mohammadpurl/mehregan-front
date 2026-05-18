'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import {
  getPettyCashByIdAction,
  importPettyCashExpensesExcelAction,
  submitPettyCashExpensesAction,
} from '@/app/_actions/petty-cash-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import type { PettyCashResponse } from '../_types/petty-cash.types';
import { PettyCashExpensesFormSchema, type PettyCashExpensesFormValues } from '../_types/petty-cash.schema';
import { canSettlePettyCash, sumExpenseLines } from '../_utils/petty-cash-mapper';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';

type Props = {
  record: PettyCashResponse;
  onUpdated: (record: PettyCashResponse) => void;
};

export function PettyCashExpenseSettlement({ record, onUpdated }: Props) {
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const [excelBusy, setExcelBusy] = useState(false);
  const canSettle = canSettlePettyCash(record);
  const existingTotal = sumExpenseLines(record.expenseLines ?? []);
  const remaining = Math.max(0, record.amount - existingTotal);

  const form = useForm<PettyCashExpensesFormValues>({
    resolver: zodResolver(PettyCashExpensesFormSchema),
    defaultValues: {
      lines: [{ description: '', amount: 0, date: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });

  const watchedLines = form.watch('lines');
  const draftTotal = watchedLines.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
  const wouldExceed = existingTotal + draftTotal > record.amount;

  const onSubmit = (values: PettyCashExpensesFormValues) => {
    if (existingTotal + draftTotal > record.amount) {
      notifyError('جمع اقلام نباید از مبلغ تنخواه بیشتر باشد');
      return;
    }
    startTransition(async () => {
      const result = await submitPettyCashExpensesAction(record.id, values.lines);
      if (result.success) {
        notifySuccess('اقلام هزینه ثبت شد');
        if (result.data) onUpdated(result.data);
        else {
          const refreshed = await getPettyCashByIdAction(record.id);
          if (refreshed.success && refreshed.data) onUpdated(refreshed.data);
        }
        form.reset({ lines: [{ description: '', amount: 0, date: '' }] });
      } else {
        notifyError(result.error || 'ثبت ناموفق بود');
      }
    });
  };

  const onExcel = async (file: File) => {
    setExcelBusy(true);
    const result = await importPettyCashExpensesExcelAction(record.id, file);
    setExcelBusy(false);
    if (result.success) {
      notifySuccess('فایل اکسل بارگذاری شد');
      if (result.data) onUpdated(result.data);
      else {
        const refreshed = await getPettyCashByIdAction(record.id);
        if (refreshed.success && refreshed.data) onUpdated(refreshed.data);
      }
    } else {
      notifyError(result.error || 'بارگذاری اکسل ناموفق بود');
    }
  };

  if (!canSettle && (record.expenseLines?.length ?? 0) === 0) {
    return (
      <Alert>
        <AlertTitle>ثبت خرج</AlertTitle>
        <AlertDescription className="text-sm">
          پس از تأیید کامل مدیر مالی و مدیرعامل می‌توانید اقلام هزینه را ثبت کنید.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/20 p-3 text-sm">
        <p>
          مبلغ تنخواه: <strong>{formatAmount(record.amount, { unit: 'ریال' })}</strong>
        </p>
        <p>
          ثبت‌شده: <strong>{formatAmount(existingTotal, { unit: 'ریال' })}</strong> — باقی‌مانده:{' '}
          <strong>{formatAmount(remaining, { unit: 'ریال' })}</strong>
        </p>
      </div>

      {(record.expenseLines?.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-right">
                <th className="p-2">شرح</th>
                <th className="p-2">مبلغ</th>
                <th className="p-2">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {record.expenseLines!.map((line, i) => (
                <tr key={line.id ?? i} className="border-b">
                  <td className="p-2">{line.description}</td>
                  <td className="p-2">{formatAmount(line.amount, { unit: 'ریال' })}</td>
                  <td className="p-2">{line.date ? formatJalaliDate(line.date) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canSettle && (
        <>
          <Alert>
            <AlertTitle>ثبت دستی یا اکسل</AlertTitle>
            <AlertDescription className="text-xs">
              ستون‌های اکسل: شرح / description، مبلغ / amount، تاریخ / date (اختیاری)
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50">
              <Upload className="h-4 w-4" />
              بارگذاری اکسل (.xlsx)
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                disabled={excelBusy || isPending}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onExcel(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <p className="text-sm font-medium">ثبت دستی اقلام</p>
              {fields.map((field, index) => (
                <div key={field.id} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_120px_140px_auto]">
                  <FormField
                    control={form.control}
                    name={`lines.${index}.description`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">شرح</FormLabel>
                        <FormControl>
                          <Input {...f} placeholder="شرح هزینه" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`lines.${index}.amount`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">مبلغ</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...f}
                            onChange={(e) => f.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`lines.${index}.date`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">تاریخ (اختیاری)</FormLabel>
                        <FormControl>
                          <Input type="date" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={fields.length <= 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              {wouldExceed && (
                <p className="text-sm text-destructive">جمع اقلام از مبلغ تنخواه بیشتر است.</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ description: '', amount: 0, date: '' })}
                >
                  <Plus className="ml-1 h-4 w-4" />
                  ردیف جدید
                </Button>
                <Button type="submit" size="sm" disabled={isPending || wouldExceed}>
                  ثبت اقلام
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, type ComponentType } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { JalaliDateInput } from '@/app/components/ui/jalali-date-input';
import { FormattedNumberInput } from '@/app/components/ui/formatted-number-input';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import type { FormField, FormSchema, GridSpan } from './form-generator.types';

export type { FormField, FormSchema, GridSpan };

/** Tailwind JIT فقط کلاس‌های ثابت را می‌بیند — نگاشت کامل col-span */
const COL_SPAN: Record<GridSpan, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

const MD_COL_SPAN: Record<GridSpan, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

const LG_COL_SPAN: Record<GridSpan, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
};

/** شبکهٔ ردیف: از md به بالا N ستون */
const MD_GRID_COLS: Record<GridSpan, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
  7: 'md:grid-cols-7',
  8: 'md:grid-cols-8',
  9: 'md:grid-cols-9',
  10: 'md:grid-cols-10',
  11: 'md:grid-cols-11',
  12: 'md:grid-cols-12',
};

function toGridSpan(value: unknown, fallback: GridSpan): GridSpan {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const n = Math.round(value);
  if (n < 1) return 1;
  if (n > 12) return 12;
  return n as GridSpan;
}

/** عرض در شبکهٔ ۱۲تایی (lg) و میانی (md) */
function resolveTwelveColSpans(field: FormField): { md: GridSpan; lg: GridSpan } {
  const lg = toGridSpan(
    field.lgColSpan ?? field.lgSpan ?? field.colSpan ?? field.span ?? 6,
    6,
  );
  const md = toGridSpan(field.mdColSpan ?? field.mdSpan ?? lg, lg);
  return { md, lg };
}

/** در حالت rowGridColumns=N: هر فیلد چند سلول از N بگیرد (پیش‌فرض ۱) */
function resolveEqualRowCellSpan(field: FormField, rowColumns: GridSpan): GridSpan {
  const raw = toGridSpan(
    field.lgColSpan ?? field.colSpan ?? field.span ?? field.lgSpan ?? 1,
    1,
  );
  return Math.min(raw, rowColumns) as GridSpan;
}

interface FormCustomFieldProps {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
}

interface FormGeneratorProps {
  schema: FormSchema;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  defaultValues?: Record<string, any>;
  formId?: string;
  customFields?: Record<string, ComponentType<FormCustomFieldProps>>;
}

export type { FormCustomFieldProps };

export function FormGenerator({
  schema,
  onSubmit,
  isLoading = false,
  defaultValues = {},
  formId = 'dynamic-form',
  customFields,
}: FormGeneratorProps) {
  const zodShape = schema.fields.reduce((acc, field) => {
    let fieldSchema: z.ZodTypeAny =
      field.type === 'number' || field.type === 'amount'
        ? z.number({ invalid_type_error: 'عدد نامعتبر است' })
        : field.type === 'checkbox' || field.type === 'switch'
          ? z.boolean()
          : z.string().trim();

    if (field.required && field.type !== 'checkbox' && field.type !== 'switch') {
      if (field.type === 'number' || field.type === 'amount') {
        fieldSchema = (fieldSchema as z.ZodNumber).min(0, `${field.label} الزامی است`);
      } else {
        fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} الزامی است`);
      }
    }
    acc[field.name] = fieldSchema;
    return acc;
  }, {} as any);

  const form = useForm({
    resolver: zodResolver(z.object(zodShape)),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const fieldsByRow = schema.fields.reduce((acc, field) => {
    const row = field.row ?? 999;
    if (!acc[row]) acc[row] = [];
    acc[row].push(field);
    return acc;
  }, {} as Record<number, FormField[]>);

  const sortedRows = Object.keys(fieldsByRow).map(Number).sort((a, b) => a - b);

  const getTwelveColFieldClass = (field: FormField) => {
    const { md, lg } = resolveTwelveColSpans(field);
    return cn('min-w-0', COL_SPAN[1], MD_COL_SPAN[md], LG_COL_SPAN[lg], field.className);
  };

  const getEqualGridFieldClass = (field: FormField, rowColumns: GridSpan) => {
    const cell = resolveEqualRowCellSpan(field, rowColumns);
    return cn('min-w-0 col-span-1', MD_COL_SPAN[cell], field.className);
  };

  return (
    <FormProvider {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {sortedRows.map((rowIndex) => {
          const rowFields = fieldsByRow[rowIndex];
          const equalCols = schema.rowGridColumns?.[rowIndex];
          const rowClass = equalCols
            ? cn(
                'grid grid-cols-1 gap-x-3 gap-y-4 md:gap-x-5 md:gap-y-5',
                MD_GRID_COLS[equalCols],
              )
            : 'grid grid-cols-1 gap-x-3 gap-y-4 md:grid-cols-12 md:gap-x-5 md:gap-y-5';

          return (
            <div key={rowIndex} className={rowClass}>
              {rowFields.map((field) => (
                <div
                  key={field.name}
                  className={equalCols ? getEqualGridFieldClass(field, equalCols) : getTwelveColFieldClass(field)}
                >
                  <label className="mb-1.5 block text-xs font-medium text-foreground/90">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      {...form.register(field.name)}
                      rows={4}
                      className={cn(
                        "w-full min-h-[5.5rem] rounded-md border border-input bg-background px-2.5 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 dark:bg-zinc-950",
                        field.inputClassName
                      )}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                    />
                  ) : field.type === 'custom' && customFields?.[field.name] ? (
                    (() => {
                      const CustomField = customFields[field.name];
                      return (
                        <Controller
                          name={field.name}
                          control={form.control}
                          render={({ field: f }) => (
                            <CustomField
                              field={field}
                              value={
                                typeof f.value === 'string'
                                  ? f.value
                                  : f.value != null
                                    ? String(f.value)
                                    : ''
                              }
                              onChange={f.onChange}
                              onBlur={f.onBlur}
                              disabled={field.disabled || isLoading}
                            />
                          )}
                        />
                      );
                    })()
                  ) : field.type === 'select' ? (
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f }) => (
                        <select
                          name={f.name}
                          ref={f.ref}
                          onBlur={f.onBlur}
                          onChange={f.onChange}
                          value={typeof f.value === 'string' ? f.value : f.value != null ? String(f.value) : ''}
                          className={cn(
                            'w-full min-h-9 rounded-md border border-input bg-background px-2.5 py-2 text-sm leading-snug text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 dark:bg-zinc-950',
                            field.inputClassName,
                          )}
                          disabled={field.disabled || isLoading || field.loading}
                        >
                          <option value="">
                            {field.loading ? 'در حال بارگذاری…' : 'انتخاب کنید...'}
                          </option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  ) : field.type === 'date' ? (
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f }) => (
                        <JalaliDateInput
                          value={typeof f.value === 'string' ? f.value : ''}
                          onChange={f.onChange}
                          onBlur={f.onBlur}
                          disabled={field.disabled || isLoading}
                          placeholder={field.placeholder ?? '۱۴۰۴/۰۱/۰۱'}
                        />
                      )}
                    />
                  ) : field.type === 'amount' ? (
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f }) => (
                        <FormattedNumberInput
                          value={typeof f.value === 'number' ? f.value : Number(f.value) || 0}
                          onChange={f.onChange}
                          onBlur={f.onBlur}
                          disabled={field.disabled || isLoading}
                          placeholder={field.placeholder}
                        />
                      )}
                    />
                  ) : field.type === 'checkbox' || field.type === 'switch' ? (
                    <div className="mt-0.5 flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...form.register(field.name)}
                        className="h-4 w-4 shrink-0 rounded border-input text-primary accent-primary"
                      />
                      <span className="text-xs text-foreground/90">{field.label}</span>
                    </div>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type}
                      {...form.register(field.name)}
                      className={cn(
                        "w-full min-h-9 rounded-md border border-input bg-background px-2.5 py-2 text-sm leading-snug text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 dark:bg-zinc-950",
                        field.inputClassName
                      )}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                    />
                  )}

                  {form.formState.errors[field.name] && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {String(form.formState.errors[field.name]?.message)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </form>
    </FormProvider>
  );
}
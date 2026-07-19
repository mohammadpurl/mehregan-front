'use client';

import { useEffect, useRef, useState } from 'react';
import type { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { RequiredMark } from '@/app/components/ui/required-mark';
import { getRequestTitleSuggestionAction } from '@/app/_actions/requests-report-actions';
import { RefreshCw } from 'lucide-react';

type Props<T extends FieldValues = FieldValues> = {
  refType: string;
  field: ControllerRenderProps<T, Path<T>>;
  disabled?: boolean;
  /** اگر true و مقدار خالی باشد، پیشنهاد خودکار بارگذاری می‌شود */
  autoSuggest?: boolean;
  label?: string;
  hint?: string;
};

/** فیلد عنوان درخواست با پیشنهاد خودکار (نوع — تاریخ — نام) */
export function RequestTitleField<T extends FieldValues = FieldValues>({
  refType,
  field,
  disabled,
  autoSuggest = true,
  label = 'عنوان درخواست',
  hint = 'پیشنهاد پیش‌فرض: نوع درخواست — تاریخ — نام درخواست‌کننده. می‌توانید ویرایش کنید.',
}: Props<T>) {
  const [loading, setLoading] = useState(false);
  const touchedRef = useRef(false);
  const lastRefType = useRef(refType);
  const value = String(field.value ?? '');

  const loadSuggestion = async (force = false) => {
    if (!refType) return;
    if (!force && touchedRef.current && value.trim()) return;
    setLoading(true);
    const res = await getRequestTitleSuggestionAction(refType);
    setLoading(false);
    if (res.success && res.data.title) {
      field.onChange(res.data.title);
    }
  };

  useEffect(() => {
    if (!autoSuggest) return;
    if (lastRefType.current !== refType) {
      lastRefType.current = refType;
      touchedRef.current = false;
    }
    if (!value.trim()) {
      void loadSuggestion(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refType, autoSuggest]);

  return (
    <FormItem>
      <div className="flex items-center justify-between gap-2">
        <FormLabel>
          {label}
          <RequiredMark />
        </FormLabel>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          disabled={disabled || loading || !refType}
          onClick={() => {
            touchedRef.current = false;
            void loadSuggestion(true);
          }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          پیشنهاد مجدد
        </Button>
      </div>
      <FormControl>
        <Input
          name={field.name}
          ref={field.ref}
          onBlur={field.onBlur}
          value={value}
          disabled={disabled || loading}
          placeholder={loading ? 'در حال پیشنهاد عنوان…' : 'عنوان درخواست'}
          onChange={(e) => {
            touchedRef.current = true;
            field.onChange(e.target.value);
          }}
          maxLength={255}
        />
      </FormControl>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <FormMessage />
    </FormItem>
  );
}

'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { FileText, X } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  filterValidAttachmentFiles,
} from '@/app/utils/validate-attachment';
import { formatBytesFa } from '@/app/utils/format-bytes-fa';
import { notifyFormWarning } from '@/app/utils/form-notify';

type Props = {
  id?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  hint?: string;
  /** فایل‌های انتخاب‌شده (کنترل‌شده از والد) */
  files?: File[];
  onFilesChange: (files: File[]) => void;
};

export function AttachmentFileInput({
  id,
  multiple = true,
  disabled,
  className,
  hint,
  files: filesProp,
  onFilesChange,
}: Props) {
  const [selected, setSelected] = useState<File[]>(filesProp ?? []);
  const [rejectMessages, setRejectMessages] = useState<string[]>([]);

  useEffect(() => {
    if (filesProp !== undefined) setSelected(filesProp);
  }, [filesProp]);

  const defaultHint = `حداکثر ${formatBytesFa(ATTACHMENT_MAX_BYTES)} برای هر فایل — تصویر، PDF، Word، Excel، ZIP`;

  const applyFiles = (next: File[]) => {
    setSelected(next);
    onFilesChange(next);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';

    if (!picked.length) return;

    const { valid, errors } = filterValidAttachmentFiles(picked);
    setRejectMessages(errors);
    for (const msg of errors) {
      notifyFormWarning(msg);
    }

    if (!valid.length) return;

    const next = multiple ? [...selected, ...valid] : valid;
    applyFiles(next);
  };

  const removeAt = (index: number) => {
    applyFiles(selected.filter((_, i) => i !== index));
    setRejectMessages([]);
  };

  const clearAll = () => {
    applyFiles([]);
    setRejectMessages([]);
  };

  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="file"
        multiple={multiple}
        accept={ATTACHMENT_ACCEPT}
        disabled={disabled}
        className={className ?? 'cursor-pointer'}
        onChange={onChange}
      />

      {rejectMessages.length > 0 && (
        <ul className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {rejectMessages.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}

      {selected.length > 0 ? (
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-foreground">
              {selected.length} فایل انتخاب شد — هنگام ثبت درخواست ارسال می‌شود
            </p>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
              حذف همه
            </Button>
          </div>
          <ul className="space-y-1.5">
            {selected.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5"
              >
                <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatBytesFa(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label={`حذف ${file.name}`}
                  onClick={() => removeAt(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">هنوز فایلی انتخاب نشده است.</p>
      )}

      <p className="text-xs text-muted-foreground">{hint ?? defaultHint}</p>
    </div>
  );
}

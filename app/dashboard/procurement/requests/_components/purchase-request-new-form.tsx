'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/components/ui/form';
import { Textarea } from '@/app/components/ui/textarea';
import { AttachmentFileInput } from '@/app/components/attachments/attachment-file-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { RequiredMark } from '@/app/components/ui/required-mark';
import {
  WarehouseItemPicker,
  type WarehouseItemSelectionMap,
} from '@/app/components/pickers/warehouse-item-picker';
import {
  createPurchaseRequestAction,
  getPurchaseWarehouseCatalogAction,
  updatePurchaseRequestAction,
  uploadPurchaseRequestAttachmentAction,
} from '@/app/_actions/purchase-request-actions';
import type { PurchaseRequest } from '@/app/_types/purchase-request.types';
import {
  CreatePurchaseRequestSchema,
  EditPurchaseRequestSchema,
  type CreatePurchaseRequestValues,
} from '@/app/_types/purchase-request.schema';
import { useFormAction } from '@/app/hooks/use-form-action';
import { WorkflowSameAssigneeAlert } from '@/app/dashboard/workflow/_components/workflow-same-assignee-alert';
import { useWorkflowAssigneesPreviewWarning } from '@/app/dashboard/workflow/_hooks/use-workflow-assignees-preview-warning';
import { RequestTitleField } from '@/app/components/forms/request-title-field';

type Props = {
  formId?: string;
  record?: PurchaseRequest | null;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

const emptyDefaults: CreatePurchaseRequestValues = {
  warehouseId: 0,
  title: '',
  reason: '',
  lines: [],
};

function valuesFromRecord(record: PurchaseRequest): CreatePurchaseRequestValues {
  return {
    // برای عبور از اعتبارسنجی zod در ویرایش (warehouseId در PATCH ارسال نمی‌شود)
    warehouseId:
      record.warehouseId != null && record.warehouseId > 0 ? record.warehouseId : 1,
    title: record.title ?? '',
    reason: record.reason ?? '',
    lines: record.items.map((li) => ({
      itemId: li.itemId ?? undefined,
      itemName: li.itemName,
      quantity: li.quantity,
      description: li.description ?? '',
    })),
  };
}

function selectionMapFromRecord(record: PurchaseRequest | null): WarehouseItemSelectionMap {
  if (!record) return {};
  const map: WarehouseItemSelectionMap = {};
  for (const li of record.items) {
    if (li.itemId) {
      map[li.itemId] = {
        itemId: li.itemId,
        itemName: li.itemName,
        quantity: li.quantity,
        description: li.description ?? undefined,
      };
    }
  }
  return map;
}

export function PurchaseRequestNewForm({
  formId = 'purchase-request-new-form',
  record = null,
  onSuccess,
  onBusyChange,
}: Props) {
  const isEdit = record != null;
  const { isPending, startTransition, notifyError, notifySuccess } = useFormAction();
  const sameAssigneeWarning = useWorkflowAssigneesPreviewWarning('purchase_request', null);

  const form = useForm<CreatePurchaseRequestValues>({
    resolver: zodResolver(
      isEdit ? EditPurchaseRequestSchema : CreatePurchaseRequestSchema,
    ) as Resolver<CreatePurchaseRequestValues>,
    defaultValues: record ? valuesFromRecord(record) : emptyDefaults,
  });

  const [selected, setSelected] = useState<WarehouseItemSelectionMap>(() =>
    selectionMapFromRecord(record),
  );
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [warehousesError, setWarehousesError] = useState<string | null>(null);

  const watchedWarehouseId = form.watch('warehouseId');
  const selectedWarehouseId =
    watchedWarehouseId != null && Number(watchedWarehouseId) > 0 ? Number(watchedWarehouseId) : null;
  const selectedWarehouseName =
    warehouses.find((w) => w.id === selectedWarehouseId)?.name ??
    record?.warehouseName ??
    null;

  useEffect(() => {
    form.reset(record ? valuesFromRecord(record) : emptyDefaults);
    setSelected(selectionMapFromRecord(record));
  }, [record?.id, form, record]);

  useEffect(() => {
    onBusyChange?.(isPending);
  }, [isPending, onBusyChange]);

  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    setWarehousesLoading(true);
    setWarehousesError(null);
    void getPurchaseWarehouseCatalogAction().then((res) => {
      if (cancelled) return;
      setWarehousesLoading(false);
      if (!res.success || !res.data) {
        setWarehouses([]);
        setWarehousesError(res.error ?? 'بارگذاری لیست انبارها ناموفق بود');
        return;
      }
      setWarehouses(res.data.warehouses ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  const onSubmit = (values: CreatePurchaseRequestValues) => {
    const lines = isEdit
      ? values.lines
      : Object.values(selected).map((r) => ({
          itemId: r.itemId,
          itemName: r.itemName.trim(),
          quantity: r.quantity,
          description: r.description?.trim() || undefined,
        }));

    if (!isEdit && lines.length === 0) {
      notifyError('حداقل یک کالا از لیست انتخاب کنید');
      return;
    }

    if (!isEdit && (!values.warehouseId || values.warehouseId <= 0)) {
      notifyError('انبار را انتخاب کنید');
      return;
    }

    startTransition(async () => {
      if (isEdit) {
        const res = await updatePurchaseRequestAction(record.id, {
          title: values.title?.trim() || undefined,
          reason: values.reason?.trim() || undefined,
          lines,
        });
        if (!res.success) {
          notifyError(res.error);
          return;
        }
        notifySuccess('درخواست خرید ویرایش شد');
        onSuccess?.();
        return;
      }

      const res = await createPurchaseRequestAction({
        warehouseId: values.warehouseId,
        title: values.title?.trim() || undefined,
        reason: values.reason?.trim() || undefined,
        lines,
      });
      if (!res.success) {
        notifyError(res.error);
        return;
      }

      if (res.data && attachmentFiles.length > 0) {
        for (const file of attachmentFiles) {
          const up = await uploadPurchaseRequestAttachmentAction(res.data.id, file);
          if (!up.success) {
            notifyError(up.error ?? 'خطا در آپلود پیوست');
            return;
          }
        }
      }

      notifySuccess('درخواست خرید ثبت شد');
      form.reset(emptyDefaults);
      setSelected({});
      setAttachmentFiles([]);
      onSuccess?.();
    });
  };

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!isEdit && <WorkflowSameAssigneeAlert show={sameAssigneeWarning} />}

        {!isEdit ? (
          <FormField
            control={form.control}
            name="warehouseId"
            render={({ field }) => (
              <FormItem className="rounded-lg border bg-muted/20 p-4">
                <FormLabel>
                  انبار
                  <RequiredMark />
                </FormLabel>
                <Select
                  value={field.value > 0 ? String(field.value) : undefined}
                  onValueChange={(v) => {
                    const nextId = Number(v);
                    field.onChange(nextId);
                    setSelected({});
                  }}
                  disabled={isPending || warehousesLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={warehousesLoading ? 'در حال بارگذاری…' : 'انتخاب انبار'}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {warehousesError ? (
                  <p className="text-sm text-destructive">{warehousesError}</p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        ) : record?.warehouseName || record?.warehouseId ? (
          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <span className="text-muted-foreground">انبار: </span>
            <span className="font-medium">
              {record.warehouseName ?? `انبار #${record.warehouseId}`}
            </span>
          </div>
        ) : null}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <RequestTitleField refType="purchase_request" field={field} disabled={isPending} />
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem className="rounded-lg border bg-muted/20 p-4">
              <FormLabel>توضیح کلی (اختیاری)</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} placeholder="دلیل یا توضیح تکمیلی درخواست" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEdit ? (
          <>
            <WarehouseItemPicker
              value={selected}
              onChange={setSelected}
              warehouseId={selectedWarehouseId}
              warehouseName={selectedWarehouseName}
              disabled={isPending}
            />
            <div className="space-y-2 rounded-lg border border-dashed p-4">
              <FormLabel>پیوست (اختیاری)</FormLabel>
              <AttachmentFileInput files={attachmentFiles} onFilesChange={setAttachmentFiles} />
            </div>
          </>
        ) : (
          <div className="space-y-2 rounded-lg border bg-muted/10 p-4">
            <FormLabel className="text-base">اقلام درخواست</FormLabel>
            <ul className="list-disc pr-5 text-sm space-y-1">
              {record?.items.map((li) => (
                <li key={li.id ?? li.itemName}>
                  {li.itemName} — تعداد {li.quantity}
                  {li.description ? ` (${li.description})` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Form>
  );
}

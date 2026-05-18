'use client';

import { useEffect, useMemo } from 'react';
import { FormGenerator } from '@/app/components/form-input/form-generator/form-generator';
import { createItemAction, updateItemAction } from '@/app/_actions/item-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import { ItemCreateSchema, ItemUpdateSchema, type ItemFormValues } from '../_types/item.schema';
import { buildItemFormSchema } from './item-form-schema';
import { createFormToModel, itemToFormDefaults, updateFormToModel } from '../_utils/item-form.utils';
import { useCategoryOptions } from '../_hooks/use-category-options';
import type { Item } from '@/app/_types/item.types';

type ItemFormBaseProps = {
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

type ItemFormProps =
  | (ItemFormBaseProps & { mode: 'create'; itemId?: never; initialItem?: never })
  | (ItemFormBaseProps & {
      mode: 'edit';
      itemId: number;
      initialItem?: Pick<Item, 'name' | 'sku' | 'unit' | 'is_active' | 'description' | 'category_id'>;
    });

export function ItemForm({ mode, itemId, initialItem, formId = 'item-form', onSuccess, onBusyChange }: ItemFormProps) {
  const { isPending, runAction, notifyError } = useFormAction();
  const { categoryOptions, isLoading: categoriesLoading } = useCategoryOptions();
  const isEdit = mode === 'edit';
  const formSchema = useMemo(() => buildItemFormSchema(categoryOptions), [categoryOptions]);
  const defaultValues = useMemo(() => itemToFormDefaults(initialItem), [initialItem]);
  const formBusy = isPending || categoriesLoading;

  useEffect(() => {
    onBusyChange?.(formBusy);
  }, [formBusy, onBusyChange]);

  const handleSubmit = (formData: ItemFormValues) => {
    if (!isEdit) {
      const parsed = ItemCreateSchema.safeParse(formData);
      if (!parsed.success) {
        notifyError(parsed.error.issues[0]?.message || 'مقادیر فرم نامعتبر است');
        return;
      }
      runAction(() => createItemAction(createFormToModel(parsed.data)), {
        successMessage: 'کالا ایجاد شد',
        onSuccess,
      });
      return;
    }

    if (!itemId) {
      notifyError('شناسه کالا نامعتبر است');
      return;
    }

    const parsed = ItemUpdateSchema.safeParse(formData);
    if (!parsed.success) {
      notifyError(parsed.error.issues[0]?.message || 'مقادیر فرم نامعتبر است');
      return;
    }

    runAction(() => updateItemAction(itemId, updateFormToModel(parsed.data)), {
      successMessage: 'کالا ویرایش شد',
      onSuccess,
    });
  };

  return (
    <FormGenerator
      key={itemId ?? 'new-item'}
      schema={formSchema}
      formId={formId}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={formBusy}
    />
  );
}

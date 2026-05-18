'use client';

import { useEffect, useMemo } from 'react';
import { FormGenerator } from '@/app/components/form-input/form-generator/form-generator';
import { createCategoryAction, updateCategoryAction } from '@/app/_actions/category-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import type { Category, CategoryTreeNode } from '@/app/_types/category.types';
import { CategoryFormSchema, type CategoryFormValues } from '../_types/category.schema';
import { buildCategoryFormSchema } from './category-form-schema';
import {
  buildParentSelectOptions,
  categoryToFormDefaults,
  formToCreateModel,
  formToUpdateModel,
} from '../_utils/category-form.utils';

type CategoryFormBaseProps = {
  tree: CategoryTreeNode[];
  formId?: string;
  defaultParentId?: number | null;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

type CategoryFormProps =
  | (CategoryFormBaseProps & { mode: 'create'; categoryId?: never; initialCategory?: never })
  | (CategoryFormBaseProps & {
      mode: 'edit';
      categoryId: number;
      initialCategory: Pick<Category, 'name' | 'parent_id'>;
    });

export function CategoryForm({
  mode,
  tree,
  categoryId,
  initialCategory,
  defaultParentId,
  formId = 'category-form',
  onSuccess,
  onBusyChange,
}: CategoryFormProps) {
  const { isPending, runAction, notifyError } = useFormAction();
  const isEdit = mode === 'edit';

  const parentOptions = useMemo(
    () => buildParentSelectOptions(tree, isEdit ? categoryId : undefined),
    [tree, isEdit, categoryId],
  );

  const formSchema = useMemo(() => buildCategoryFormSchema(parentOptions), [parentOptions]);
  const defaultValues = useMemo(
    () => categoryToFormDefaults(initialCategory, defaultParentId),
    [initialCategory, defaultParentId],
  );

  useEffect(() => {
    onBusyChange?.(isPending);
  }, [isPending, onBusyChange]);

  const handleSubmit = (formData: CategoryFormValues) => {
    const parsed = CategoryFormSchema.safeParse(formData);
    if (!parsed.success) {
      notifyError(parsed.error.issues[0]?.message || 'مقادیر فرم نامعتبر است');
      return;
    }

    if (!isEdit) {
      runAction(() => createCategoryAction(formToCreateModel(parsed.data)), {
        successMessage: 'گروه کالا ایجاد شد',
        onSuccess,
      });
      return;
    }

    runAction(() => updateCategoryAction(categoryId, formToUpdateModel(parsed.data)), {
      successMessage: 'گروه کالا ویرایش شد',
      onSuccess,
    });
  };

  return (
    <FormGenerator
      key={isEdit ? `edit-${categoryId}` : `new-${defaultParentId ?? 'root'}`}
      schema={formSchema}
      formId={formId}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
    />
  );
}

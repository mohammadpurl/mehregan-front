import type { FormSchema } from '@/app/components/form-input/form-generator/form-generator.types';
import type { ParentSelectOption } from '../_utils/category-form.utils';

export function buildCategoryFormSchema(parentOptions: ParentSelectOption[]): FormSchema {
  return {
    fields: [
      {
        name: 'name',
        label: 'نام گروه',
        type: 'text',
        required: true,
        row: 0,
        lgSpan: 12,
        placeholder: 'مثال: لوازم برقی',
      },
      {
        name: 'parent_id',
        label: 'گروه والد',
        type: 'select',
        required: false,
        row: 1,
        lgSpan: 12,
        options: parentOptions,
      },
    ],
  };
}

import type { FormSchema } from '@/app/components/form-input/form-generator/form-generator.types';
import type { ParentSelectOption } from '@/app/dashboard/master/categories/_utils/category-form.utils';

export function buildItemFormSchema(categoryOptions: ParentSelectOption[]): FormSchema {
  const categoryFieldOptions =
    categoryOptions.length > 0
      ? categoryOptions
      : [{ label: 'ابتدا یک گروه کالا در «گروه کالا» تعریف کنید', value: '' }];

  return {
    fields: [
      {
        name: 'name',
        label: 'نام کالا',
        type: 'text',
        required: true,
        row: 0,
        lgSpan: 6,
        placeholder: 'مثال: کنتور',
      },
      {
        name: 'sku',
        label: 'کد کالا (SKU)',
        type: 'text',
        required: false,
        row: 0,
        lgSpan: 6,
        placeholder: 'اختیاری',
      },
      {
        name: 'category_id',
        label: 'گروه کالا',
        type: 'select',
        required: true,
        row: 1,
        lgSpan: 6,
        options: categoryFieldOptions,
      },
      {
        name: 'unit',
        label: 'واحد',
        type: 'text',
        required: false,
        row: 1,
        lgSpan: 6,
        placeholder: 'مثال: عدد / کیلوگرم',
      },
      {
        name: 'is_active',
        label: 'وضعیت',
        type: 'select',
        required: true,
        row: 2,
        lgSpan: 6,
        options: [
          { label: 'فعال', value: 'true' },
          { label: 'غیرفعال', value: 'false' },
        ],
      },
      {
        name: 'description',
        label: 'توضیحات',
        type: 'textarea',
        required: false,
        row: 3,
        lgSpan: 12,
        placeholder: 'اختیاری',
      },
    ],
  };
}

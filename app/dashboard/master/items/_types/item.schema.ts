import { z } from 'zod';

export const ItemCreateSchema = z.object({
  name: z.string().trim().min(2, 'نام کالا باید حداقل ۲ کاراکتر باشد'),
  sku: z.string().trim().optional().or(z.literal('')),
  category_id: z.string().trim().min(1, 'گروه کالا الزامی است'),
  unit: z.string().trim().optional().or(z.literal('')),
  is_active: z.enum(['true', 'false']),
  description: z.string().trim().optional().or(z.literal('')),
});

export const ItemUpdateSchema = ItemCreateSchema;

export type ItemCreateFormValues = z.infer<typeof ItemCreateSchema>;
export type ItemUpdateFormValues = z.infer<typeof ItemUpdateSchema>;
export type ItemFormValues = ItemCreateFormValues;

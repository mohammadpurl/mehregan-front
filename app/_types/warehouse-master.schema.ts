import { z } from 'zod';

export const WarehouseCreateSchema = z.object({
  name: z.string().trim().min(2, 'نام انبار باید حداقل ۲ کاراکتر باشد'),
  code: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  is_active: z.enum(['true', 'false']),
  description: z.string().trim().optional().or(z.literal('')),
});

export const WarehouseUpdateSchema = WarehouseCreateSchema;

export type WarehouseCreateFormValues = z.infer<typeof WarehouseCreateSchema>;
export type WarehouseUpdateFormValues = z.infer<typeof WarehouseUpdateSchema>;


import { z } from 'zod';

export const SupplierCreateSchema = z.object({
  name: z.string().trim().min(2, 'نام تامین‌کننده باید حداقل ۲ کاراکتر باشد'),
  code: z.string().trim().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  is_active: z.enum(['true', 'false']),
  description: z.string().trim().optional().or(z.literal('')),
});

export const SupplierUpdateSchema = SupplierCreateSchema;

export type SupplierCreateFormValues = z.infer<typeof SupplierCreateSchema>;
export type SupplierUpdateFormValues = z.infer<typeof SupplierUpdateSchema>;


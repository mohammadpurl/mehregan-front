import { z } from 'zod';

const numericString = z.string().trim().optional().or(z.literal(''));

export const PurchaseOrderCreateSchema = z.object({
  request_id: z.string().trim().optional().or(z.literal('')),
  supplier_name: z.string().trim().min(2, 'نام تامین‌کننده باید حداقل ۲ کاراکتر باشد'),
  item_name: z.string().trim().optional().or(z.literal('')),
  quantity: numericString,
  unit_price: numericString,
  expected_date: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['draft', 'pending', 'approved', 'sent', 'closed', 'cancelled']),
  description: z.string().trim().optional().or(z.literal('')),
});

export const PurchaseOrderUpdateSchema = PurchaseOrderCreateSchema;

export type PurchaseOrderCreateFormValues = z.infer<typeof PurchaseOrderCreateSchema>;
export type PurchaseOrderUpdateFormValues = z.infer<typeof PurchaseOrderUpdateSchema>;


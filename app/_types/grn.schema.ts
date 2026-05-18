import { z } from 'zod';

const numericString = z.string().trim().optional().or(z.literal(''));

export const GrnCreateSchema = z.object({
  po_id: z.string().trim().optional().or(z.literal('')),
  supplier_name: z.string().trim().optional().or(z.literal('')),
  item_name: z.string().trim().optional().or(z.literal('')),
  received_qty: numericString,
  warehouse_name: z.string().trim().optional().or(z.literal('')),
  receipt_date: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['draft', 'received', 'inspected', 'posted', 'cancelled']),
  description: z.string().trim().optional().or(z.literal('')),
});

export const GrnUpdateSchema = GrnCreateSchema;

export type GrnCreateFormValues = z.infer<typeof GrnCreateSchema>;
export type GrnUpdateFormValues = z.infer<typeof GrnUpdateSchema>;


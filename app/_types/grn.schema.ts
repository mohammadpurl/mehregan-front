import { z } from 'zod';

export const GrnLineSchema = z.object({
  requestItemId: z.coerce.number().optional(),
  itemId: z.coerce.number().optional(),
  itemName: z.string().optional(),
  quantityReceived: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().optional(),
});

export const GrnCreateSchema = z.object({
  requestId: z.coerce.number().int().positive(),
  warehouseId: z.coerce.number().int().positive(),
  supplierId: z.coerce.number().int().positive().optional(),
  receiptDate: z.string().optional(),
  invoiceNotes: z.string().max(2000).optional(),
  lines: z.array(GrnLineSchema).optional(),
});

export const GrnUpdateSchema = z.object({
  warehouseId: z.coerce.number().int().positive().optional(),
  receiptDate: z.string().optional(),
  invoiceNotes: z.string().max(2000).optional(),
  lines: z.array(GrnLineSchema).optional(),
});

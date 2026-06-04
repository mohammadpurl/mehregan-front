import { z } from 'zod';

export const PurchaseLineSchema = z.object({
  itemId: z.number().int().positive().optional(),
  itemName: z.string().min(1, 'نام کالا الزامی است'),
  quantity: z.coerce.number().int().min(1, 'تعداد باید حداقل ۱ باشد'),
  description: z.string().max(2000).optional().or(z.literal('')),
});

export const CreatePurchaseRequestSchema = z.object({
  reason: z.string().max(2000).optional().or(z.literal('')),
  lines: z.array(PurchaseLineSchema),
});

export type CreatePurchaseRequestValues = z.infer<typeof CreatePurchaseRequestSchema>;

export const ProformaUploadSchema = z.object({
  supplierId: z.coerce.number().int().positive('تأمین‌کننده را انتخاب کنید'),
  amount: z.coerce.number().positive('مبلغ باید بیشتر از صفر باشد'),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type ProformaUploadValues = z.infer<typeof ProformaUploadSchema>;

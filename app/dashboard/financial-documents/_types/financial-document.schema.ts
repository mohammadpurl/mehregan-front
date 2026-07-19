import { z } from 'zod';

const trimStr = z.string().trim();

export const FinancialDocumentCreateSchema = z.object({
  documentType: z.enum(['check', 'other'], { message: 'نوع سند را انتخاب کنید' }),
  title: trimStr.min(2, 'عنوان درخواست الزامی است').max(255),
  description: trimStr.min(5, 'شرح حداقل ۵ کاراکتر').max(2000),
  amount: z.number().min(0).optional(),
  documentDate: trimStr.min(1, 'تاریخ سند را وارد کنید'),
  checkNumber: trimStr.max(100).optional().or(z.literal('')),
  partyName: trimStr.max(255).optional().or(z.literal('')),
});

export type FinancialDocumentCreateValues = z.infer<typeof FinancialDocumentCreateSchema>;

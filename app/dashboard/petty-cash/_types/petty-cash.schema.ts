import { z } from 'zod';

const trimStr = z.string().trim();

export const PettyCashCreateSchema = z.object({
  amount: z.number({ error: 'مبلغ نامعتبر است' }).min(1, 'مبلغ باید بیشتر از ۰ باشد'),
  reason: trimStr.min(5, 'شرح درخواست حداقل ۵ کاراکتر').max(1500),
  description: trimStr.max(2000).optional().or(z.literal('')),
});

export type PettyCashCreateValues = z.infer<typeof PettyCashCreateSchema>;

export const PettyCashExpenseLineSchema = z.object({
  description: trimStr.min(2, 'شرح هزینه الزامی است').max(500),
  amount: z.number({ error: 'مبلغ نامعتبر است' }).min(1, 'مبلغ باید بیشتر از ۰ باشد'),
  date: trimStr.optional().or(z.literal('')),
});

export const PettyCashExpensesFormSchema = z.object({
  lines: z.array(PettyCashExpenseLineSchema).min(1, 'حداقل یک قلم هزینه وارد کنید'),
});

export type PettyCashExpensesFormValues = z.infer<typeof PettyCashExpensesFormSchema>;

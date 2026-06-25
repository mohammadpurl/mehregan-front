import { z } from 'zod';

const trimStr = z.string().trim();

export const BankAccountFormSchema = z.object({
  label: trimStr.min(1, 'عنوان حساب الزامی است').max(100),
  bankName: trimStr.min(1, 'نام بانک الزامی است').max(100),
  accountNumber: trimStr.max(50).optional().or(z.literal('')),
  shebaNumber: trimStr.max(26).optional().or(z.literal('')),
  cardNumber: trimStr.max(24).optional().or(z.literal('')),
  isDefault: z.boolean(),
});

export type BankAccountFormValues = z.infer<typeof BankAccountFormSchema>;

import { z } from 'zod';

const trimStr = z.string().trim();

export const CounterpartyFormSchema = z.object({
  name: trimStr.min(1, 'نام الزامی است').max(255),
  partyType: z.enum(['person', 'company']),
  companyName: trimStr.max(255).optional().or(z.literal('')),
  notes: trimStr.max(500).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type CounterpartyFormValues = z.infer<typeof CounterpartyFormSchema>;

export function paymentOrderCreateSchema(requirePayerCompanyAccount: boolean) {
  return z.object({
    counterpartyId: z.number({ invalid_type_error: 'طرف حساب را انتخاب کنید' }).int().min(1, 'طرف حساب را انتخاب کنید'),
    counterpartyBankAccountId: z
      .number({ invalid_type_error: 'حساب طرف‌حساب را انتخاب کنید' })
      .int()
      .min(1, 'حساب طرف‌حساب را انتخاب کنید'),
    payerCompanyAccountId: requirePayerCompanyAccount
      ? z
          .number({ invalid_type_error: 'حساب مبدأ شرکت را انتخاب کنید' })
          .int()
          .min(1, 'حساب مبدأ شرکت را انتخاب کنید')
      : z.number().int().min(0).optional(),
    paymentDate: trimStr.min(1, 'تاریخ را وارد کنید'),
    reason: trimStr.min(5, 'شرح درخواست حداقل ۵ کاراکتر').max(2000),
    amount: z.number({ invalid_type_error: 'مبلغ نامعتبر است' }).min(1, 'مبلغ باید بیشتر از ۰ باشد'),
  });
}

/** @deprecated از paymentOrderCreateSchema(requirePayer) استفاده کنید */
export const PaymentOrderCreateSchema = paymentOrderCreateSchema(true);

export type PaymentOrderCreateValues = z.infer<ReturnType<typeof paymentOrderCreateSchema>>;

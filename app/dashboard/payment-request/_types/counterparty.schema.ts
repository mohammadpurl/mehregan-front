import { z } from 'zod';
import { PaymentMethod } from '../_utils/payment-method';

const trimStr = z.string().trim();

export const CounterpartyFormSchema = z.object({
  name: trimStr.min(1, 'نام الزامی است').max(255),
  partyType: z.enum(['person', 'company']),
  companyName: trimStr.max(255).optional().or(z.literal('')),
  notes: trimStr.max(500).optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type CounterpartyFormValues = z.infer<typeof CounterpartyFormSchema>;

export const PaymentOrderKind = {
  INDIVIDUAL: 'individual',
  COLLECTIVE: 'collective',
} as const;

export type PaymentOrderKindType = (typeof PaymentOrderKind)[keyof typeof PaymentOrderKind];

export function paymentOrderCreateSchema(requirePayerCompanyAccount: boolean) {
  return z
    .object({
      paymentOrderKind: z.enum([PaymentOrderKind.INDIVIDUAL, PaymentOrderKind.COLLECTIVE], {
        message: 'نوع دستور پرداخت را انتخاب کنید',
      }),
      counterpartyId: z.number().int().min(0).optional(),
      counterpartyBankAccountId: z.number().int().min(0).optional(),
    payerCompanyAccountId: requirePayerCompanyAccount
      ? z
          .number({ error: 'حساب مبدأ شرکت را انتخاب کنید' })
          .int()
          .min(1, 'حساب مبدأ شرکت را انتخاب کنید')
      : z.number().int().min(0).optional(),
    paymentDate: trimStr,
    reason: trimStr.min(5, 'شرح درخواست حداقل ۵ کاراکتر').max(2000),
    amount: z.number({ error: 'مبلغ نامعتبر است' }).min(0),
    paymentMethod: z.enum([PaymentMethod.CHECK, PaymentMethod.TRANSFER], {
      message: 'روش پرداخت را انتخاب کنید (چک یا حواله)',
    }),
  })
    .superRefine((data, ctx) => {
      if (data.paymentOrderKind === PaymentOrderKind.INDIVIDUAL) {
        if (!data.paymentDate?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'تاریخ را وارد کنید',
            path: ['paymentDate'],
          });
        }
        if (!data.amount || data.amount < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'مبلغ باید بیشتر از ۰ باشد',
            path: ['amount'],
          });
        }
        if (!data.counterpartyId || data.counterpartyId < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'طرف حساب را انتخاب کنید',
            path: ['counterpartyId'],
          });
        }
        if (!data.counterpartyBankAccountId || data.counterpartyBankAccountId < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'حساب طرف‌حساب را انتخاب کنید',
            path: ['counterpartyBankAccountId'],
          });
        }
      }
    });
}

/** @deprecated از paymentOrderCreateSchema(requirePayer) استفاده کنید */
export const PaymentOrderCreateSchema = paymentOrderCreateSchema(true);

export type PaymentOrderCreateValues = z.infer<ReturnType<typeof paymentOrderCreateSchema>>;

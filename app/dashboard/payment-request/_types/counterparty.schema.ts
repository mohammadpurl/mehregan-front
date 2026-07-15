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
      /** انتخاب از لیست طرف‌حساب‌ها — اختیاری */
      counterpartyId: z.number().int().min(0).optional(),
      counterpartyBankAccountId: z.number().int().min(0).optional(),
      /** نام طرف‌حساب یا شماره اشتراک آب */
      receiverName: trimStr.max(255).optional().or(z.literal('')),
      /** شماره حساب مقصد */
      receiverAccountNumber: trimStr.max(50).optional().or(z.literal('')),
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
        const name = String(data.receiverName ?? '').trim();
        const account = String(data.receiverAccountNumber ?? '').trim();
        if (name.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'نام یا شماره اشتراک آب را وارد کنید',
            path: ['receiverName'],
          });
        }
        if (account.length < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'شماره حساب را وارد کنید',
            path: ['receiverAccountNumber'],
          });
        }
      }
    });
}

/** @deprecated از paymentOrderCreateSchema(requirePayer) استفاده کنید */
export const PaymentOrderCreateSchema = paymentOrderCreateSchema(true);

export type PaymentOrderCreateValues = z.infer<ReturnType<typeof paymentOrderCreateSchema>>;

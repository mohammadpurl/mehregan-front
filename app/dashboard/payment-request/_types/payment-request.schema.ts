import { z } from 'zod';
import { PaymentRequestType } from './payment-request.types';

const trimStr = z.string().trim();

export const PaymentAccountSchema = z.object({
  name: trimStr.min(2, 'نام حساب باید حداقل ۲ کاراکتر باشد').max(100),
  accountNumber: trimStr.min(10, 'شماره حساب باید حداقل ۱۰ رقم باشد').max(30),
});

/** فیلدهایی که فقط درخواست‌کننده (کارمند) پر می‌کند */
const employeeRequestFields = {
  type: z.nativeEnum(PaymentRequestType, { message: 'نوع درخواست را انتخاب کنید' }),
  paymentDate: trimStr.min(1, 'تاریخ را وارد کنید'),
  reason: trimStr.min(5, 'شرح درخواست حداقل ۵ کاراکتر').max(1500),
  description: trimStr.max(2000).optional().or(z.literal('')),
  amount: z.number({ invalid_type_error: 'مبلغ نامعتبر است' }).min(1, 'مبلغ باید بیشتر از ۰ باشد'),
  /** فقط تنخواه — توسط خود درخواست‌کننده */
  cashExpenseCategory: trimStr.max(200).optional().or(z.literal('')),
};

const PaymentRequestEmployeeCreateSchemaBase = z.object(employeeRequestFields);

function employeeCashRefine(
  data: z.infer<typeof PaymentRequestEmployeeCreateSchemaBase>,
  ctx: z.RefinementCtx,
) {
  if (data.type === PaymentRequestType.CASH && String(data.cashExpenseCategory ?? '').trim().length < 2) {
    ctx.addIssue({ code: 'custom', message: 'شرح نوع هزینه الزامی است', path: ['cashExpenseCategory'] });
  }
}

/** ثبت / ویرایش توسط کارمند — بدون اقساط وام یا تاریخ تسویه مساعده */
export const PaymentRequestEmployeeCreateSchema =
  PaymentRequestEmployeeCreateSchemaBase.superRefine(employeeCashRefine);

export type PaymentRequestEmployeeCreateValues = z.infer<typeof PaymentRequestEmployeeCreateSchema>;

/** تأیید وام در workflow — مبلغ نهایی + اقساط */
export const PaymentRequestLoanApproverSchema = z.object({
  amount: z.number({ invalid_type_error: 'مبلغ نامعتبر است' }).min(1, 'مبلغ وام الزامی است'),
  loanInstallmentCount: z.number().int().min(1, 'تعداد اقساط الزامی است').max(360),
  loanFirstInstallmentDate: trimStr.min(1, 'تاریخ شروع قسط اول الزامی است'),
});

export type PaymentRequestLoanApproverValues = z.infer<typeof PaymentRequestLoanApproverSchema>;

/** تأیید مساعده در workflow */
export const PaymentRequestAdvanceApproverSchema = z.object({
  amount: z.number({ invalid_type_error: 'مبلغ نامعتبر است' }).min(1, 'مبلغ مساعده الزامی است'),
  advanceExpectedRepaymentDate: trimStr.min(1, 'تاریخ تسویه الزامی است'),
});

export type PaymentRequestAdvanceApproverValues = z.infer<typeof PaymentRequestAdvanceApproverSchema>;

/** حساب مبدأ شرکت هنگام تأیید */
export const PayerCompanyAccountIdSchema = z
  .number({ invalid_type_error: 'حساب مبدأ را انتخاب کنید' })
  .int()
  .min(1, 'حساب مبدأ شرکت را انتخاب کنید');

/** حساب مبدأ + اختیاری شرایط وام/مساعده در یک ذخیره */
export const PaymentRequestApproverReviewSchema = z.object({
  amount: z.number().min(1).optional(),
  payer: PaymentAccountSchema.optional(),
  payerCompanyAccountId: PayerCompanyAccountIdSchema.optional(),
  loanInstallmentCount: z.number().int().min(1).max(360).optional(),
  loanFirstInstallmentDate: z.string().optional().or(z.literal('')),
  advanceExpectedRepaymentDate: z.string().optional().or(z.literal('')),
});

export type PaymentRequestApproverReviewValues = z.infer<typeof PaymentRequestApproverReviewSchema>;

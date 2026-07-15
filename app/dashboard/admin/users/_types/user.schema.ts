import { z } from 'zod';

const trimStr = z.string().trim();

const BANKING_REQUIRED_MSG =
  'حداقل یکی از شماره حساب، شماره کارت یا شماره شبا باید وارد شود';

function hasAnyBanking(data: {
  account_number?: string | null;
  card_number?: string | null;
  sheba_number?: string | null;
}): boolean {
  return Boolean(
    data.account_number?.replace(/\s|-/g, '').trim() ||
      data.card_number?.replace(/\s|-/g, '').trim() ||
      data.sheba_number?.replace(/\s/g, '').trim(),
  );
}

const bankingFields = {
  account_number: trimStr.max(50).optional().or(z.literal('')),
  card_number: trimStr.max(24).optional().or(z.literal('')),
  sheba_number: trimStr.max(26).optional().or(z.literal('')),
};

const requireOneBanking = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data, ctx) => {
    if (!hasAnyBanking(data as Parameters<typeof hasAnyBanking>[0])) {
      for (const path of ['account_number', 'card_number', 'sheba_number'] as const) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: BANKING_REQUIRED_MSG,
          path: [path],
        });
      }
    }
  });

export const AdminUserCreateSchema = requireOneBanking(
  z.object({
    username: z.string().trim().min(2, 'نام کاربری باید حداقل ۲ کاراکتر باشد'),
    email: z.string().trim().email('ایمیل معتبر وارد کنید'),
    password: z.string().trim().min(6, 'رمز عبور حداقل ۶ کاراکتر باشد'),
    first_name: trimStr.min(1, 'نام الزامی است'),
    last_name: trimStr.min(1, 'نام خانوادگی الزامی است'),
    phone: trimStr,
    is_active: z.enum(['true', 'false']),
    role_id: trimStr,
    department_id: trimStr,
    manager_id: trimStr,
    ...bankingFields,
  }),
);

export const AdminUserUpdateSchema = requireOneBanking(
  z.object({
    username: z.string().trim().min(2, 'نام کاربری باید حداقل ۲ کاراکتر باشد'),
    email: z.string().trim().email('ایمیل معتبر وارد کنید'),
    password: z.union([
      z.literal(''),
      z
        .string()
        .trim()
        .min(6, 'رمز عبور حداقل ۶ کاراکتر باشد')
        .max(128, 'رمز عبور حداکثر ۱۲۸ کاراکتر'),
    ]),
    first_name: trimStr.min(1, 'نام الزامی است'),
    last_name: trimStr.min(1, 'نام خانوادگی الزامی است'),
    phone: trimStr,
    is_active: z.enum(['true', 'false']),
    role_id: trimStr,
    department_id: trimStr,
    manager_id: trimStr,
    ...bankingFields,
  }),
);

export type AdminUserCreateFormValues = z.infer<typeof AdminUserCreateSchema>;
export type AdminUserUpdateFormValues = z.infer<typeof AdminUserUpdateSchema>;
export type AdminUserFormValues = AdminUserCreateFormValues;

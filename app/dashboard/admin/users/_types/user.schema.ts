import { z } from 'zod';

const trimStr = z.string().trim();

export const AdminUserCreateSchema = z.object({
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
  account_number: trimStr.max(50).optional().or(z.literal('')),
  card_number: trimStr.max(24).optional().or(z.literal('')),
  sheba_number: trimStr.max(26).optional().or(z.literal('')),
});

export const AdminUserUpdateSchema = z.object({
  username: z.string().trim().min(2, 'نام کاربری باید حداقل ۲ کاراکتر باشد'),
  email: z.string().trim().email('ایمیل معتبر وارد کنید'),
  password: z.union([
    z.literal(''),
    z.string().trim().min(6, 'رمز عبور حداقل ۶ کاراکتر باشد').max(128, 'رمز عبور حداکثر ۱۲۸ کاراکتر'),
  ]),
  first_name: trimStr.min(1, 'نام الزامی است'),
  last_name: trimStr.min(1, 'نام خانوادگی الزامی است'),
  phone: trimStr,
  is_active: z.enum(['true', 'false']),
  role_id: trimStr,
  department_id: trimStr,
  manager_id: trimStr,
  account_number: trimStr.max(50).optional().or(z.literal('')),
  card_number: trimStr.max(24).optional().or(z.literal('')),
  sheba_number: trimStr.max(26).optional().or(z.literal('')),
});

export type AdminUserCreateFormValues = z.infer<typeof AdminUserCreateSchema>;
export type AdminUserUpdateFormValues = z.infer<typeof AdminUserUpdateSchema>;
export type AdminUserFormValues = AdminUserCreateFormValues;

import { z } from "zod";

const technicalIdSchema = z
  .string()
  .trim()
  .min(2, 'شناسه فنی باید حداقل ۲ کاراکتر باشد')
  .regex(/^[a-z][a-z0-9_-]*$/, 'شناسه فنی فقط حروف کوچک انگلیسی، عدد، _ و -');

export const RoleSchema = z.object({
  name: technicalIdSchema,
  displayName: z.string().trim().min(2, 'نام نمایشی باید حداقل ۲ کاراکتر باشد'),
  isSingleton: z.boolean().optional().default(false),
});

/** ویرایش: شناسه فنی در فرم غیرفعال است */
export const RoleEditSchema = z.object({
  name: z.string().trim().min(1),
  displayName: z.string().trim().min(2, 'نام نمایشی باید حداقل ۲ کاراکتر باشد'),
  isSingleton: z.boolean().optional().default(false),
});

export const PermissionSchema = z.object({
  name: z.string().trim().min(2, 'نام مجوز باید حداقل 2 کاراکتر باشد'),
});

export const PermissionCreateSchema = z.object({
  code: z.string().trim().min(1, 'کد مجوز الزامی است'),
  name: z.string().trim().min(2, 'نام مجوز باید حداقل 2 کاراکتر باشد'),
});

export const PermissionUpdateSchema = PermissionCreateSchema;

export const RolePermissionAssignSchema = z.object({
  role_id: z.number().int().positive("انتخاب نقش الزامی است"),
  permission_ids: z.array(z.number().int().positive()).default([]),
});

export type RoleFormValues = z.infer<typeof RoleSchema>;
export type PermissionFormValues = z.infer<typeof PermissionSchema>;
export type PermissionCreateFormValues = z.infer<typeof PermissionCreateSchema>;
export type RolePermissionAssignFormValues = z.infer<typeof RolePermissionAssignSchema>;


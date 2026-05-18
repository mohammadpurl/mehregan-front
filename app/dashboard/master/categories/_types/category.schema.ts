import { z } from 'zod';

export const CategoryFormSchema = z.object({
  name: z.string().trim().min(1, 'نام گروه الزامی است').max(150, 'نام گروه حداکثر ۱۵۰ کاراکتر'),
  parent_id: z.string().optional().or(z.literal('')),
});

export type CategoryFormValues = z.infer<typeof CategoryFormSchema>;

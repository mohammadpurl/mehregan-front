'use client';

import type { AdminUser } from '@/app/_types/user.types';
import { UserForm } from '../user-form';

type UserNewFormProps = {
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

/** فرم ایجاد کاربر — فقط داخل مودال استفاده شود */
export function UserNewForm({ onSuccess, onBusyChange }: UserNewFormProps) {
  return (
    <UserForm
      mode="create"
      formId="user-new-form"
      onSuccess={onSuccess}
      onBusyChange={onBusyChange}
    />
  );
}

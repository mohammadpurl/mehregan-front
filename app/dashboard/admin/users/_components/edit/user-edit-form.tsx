'use client';

import { UserForm } from '../user-form';
import type { AdminUser } from '@/app/_types/user.types';

type UserEditFormProps = {
  userId: number;
  user: AdminUser;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

/** فرم ویرایش کاربر — فقط داخل مودال استفاده شود */
export function UserEditForm({ userId, user, onSuccess, onBusyChange }: UserEditFormProps) {
  return (
    <UserForm
      mode="edit"
      userId={userId}
      initialUser={user}
      formId="user-edit-form"
      onSuccess={onSuccess}
      onBusyChange={onBusyChange}
    />
  );
}

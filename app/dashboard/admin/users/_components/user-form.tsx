'use client';

import { useEffect, useMemo } from 'react';
import { FormGenerator } from '@/app/components/form-input/form-generator/form-generator';
import { createUserAction, updateUserAction } from '@/app/_actions/user-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import {
  AdminUserCreateSchema,
  AdminUserUpdateSchema,
  type AdminUserFormValues,
} from '../_types/user.schema';
import { buildUserFormSchema } from './user-form-schema';
import { createFormToModel, updateFormToModel, userToFormDefaults } from '../_utils/user-form.utils';
import { useRolesOptions } from '../_hooks/use-roles-options';
import { useDepartmentsOptions } from '../_hooks/use-departments-options';
import { useUsersOptions } from '../_hooks/use-users-options';

type UserFormBaseProps = {
  formId?: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

type UserFormProps =
  | (UserFormBaseProps & { mode: 'create'; userId?: never; initialUser?: never })
  | (UserFormBaseProps & {
      mode: 'edit';
      userId: number;
      initialUser?: Parameters<typeof userToFormDefaults>[0];
    });

export function UserForm({
  mode,
  userId,
  initialUser,
  formId = 'user-form',
  onSuccess,
  onBusyChange,
}: UserFormProps) {
  const isEdit = mode === 'edit';
  const { isPending, runAction, notifyError } = useFormAction();
  const { roles, isLoading: rolesLoading } = useRolesOptions();
  const { options: departmentOptions, isLoading: departmentsLoading } = useDepartmentsOptions();
  const { options: managerOptions, isLoading: managersLoading } = useUsersOptions(
    isEdit ? userId : null,
  );
  const formBusy = isPending || rolesLoading || departmentsLoading || managersLoading;

  useEffect(() => {
    onBusyChange?.(formBusy);
  }, [formBusy, onBusyChange]);
  const formSchema = useMemo(
    () => buildUserFormSchema(roles, departmentOptions, managerOptions, isEdit),
    [roles, departmentOptions, managerOptions, isEdit],
  );
  const defaultValues = useMemo(() => userToFormDefaults(initialUser), [initialUser]);

  const handleSubmit = (formData: AdminUserFormValues) => {
    if (!isEdit) {
      const parsed = AdminUserCreateSchema.safeParse(formData);
      if (!parsed.success) {
        notifyError(parsed.error.issues[0]?.message || 'مقادیر فرم نامعتبر است');
        return;
      }
      runAction(() => createUserAction(createFormToModel(parsed.data)), {
        successMessage: 'کاربر ایجاد شد',
        onSuccess,
      });
      return;
    }

    if (!userId) {
      notifyError('شناسه کاربر نامعتبر است');
      return;
    }

    const parsed = AdminUserUpdateSchema.safeParse(formData);
    if (!parsed.success) {
      notifyError(parsed.error.issues[0]?.message || 'مقادیر فرم نامعتبر است');
      return;
    }

    runAction(() => updateUserAction(userId, updateFormToModel(parsed.data)), {
      successMessage: 'کاربر ویرایش شد',
      onSuccess,
    });
  };

  return (
    <FormGenerator
      key={userId ?? 'new-user'}
      schema={formSchema}
      formId={formId}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={formBusy}
    />
  );
}

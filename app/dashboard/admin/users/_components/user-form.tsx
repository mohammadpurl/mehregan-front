'use client';

import { useEffect, useMemo, type ComponentType } from 'react';
import {
  FormGenerator,
  type FormCustomFieldProps,
} from '@/app/components/form-input/form-generator/form-generator';
import { InfiniteScrollCombobox } from '@/app/components/form-input/infinite-scroll-combobox';
import { createUserAction, updateUserAction } from '@/app/_actions/user-actions';
import { useFormAction } from '@/app/hooks/use-form-action';
import {
  AdminUserCreateSchema,
  AdminUserUpdateSchema,
  type AdminUserFormValues,
} from '../_types/user.schema';
import { buildUserFormSchema } from './user-form-schema';
import { createFormToModel, updateFormToModel, userToFormDefaults } from '../_utils/user-form.utils';
import { userFormQueryKeys } from '../_queries/keys';
import {
  fetchDepartmentsPage,
  fetchManagersPage,
  fetchRolesPage,
} from '../_queries/fetchers';

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

  useEffect(() => {
    onBusyChange?.(isPending);
  }, [isPending, onBusyChange]);

  const formSchema = useMemo(() => buildUserFormSchema(isEdit), [isEdit]);
  const defaultValues = useMemo(() => userToFormDefaults(initialUser), [initialUser]);

  const customFields = useMemo((): Record<string, ComponentType<FormCustomFieldProps>> => {
    function RoleField(props: FormCustomFieldProps) {
      return (
        <InfiniteScrollCombobox
          value={props.value}
          onChange={props.onChange}
          onBlur={props.onBlur}
          disabled={props.disabled}
          placeholder="انتخاب نقش…"
          searchPlaceholder="جستجوی نقش…"
          noneOption={{ label: '— بدون نقش —', value: '' }}
          selectedFallbackLabel={initialUser?.role_name ?? undefined}
          queryKey={userFormQueryKeys.rolesInfinite()}
          fetchPage={fetchRolesPage}
        />
      );
    }

    function DepartmentField(props: FormCustomFieldProps) {
      return (
        <InfiniteScrollCombobox
          value={props.value}
          onChange={props.onChange}
          onBlur={props.onBlur}
          disabled={props.disabled}
          placeholder="انتخاب واحد…"
          searchPlaceholder="جستجوی واحد…"
          noneOption={{ label: '— بدون واحد —', value: '' }}
          selectedFallbackLabel={initialUser?.department_name ?? undefined}
          queryKey={userFormQueryKeys.departmentsInfinite()}
          fetchPage={fetchDepartmentsPage}
        />
      );
    }

    function ManagerField(props: FormCustomFieldProps) {
      return (
        <InfiniteScrollCombobox
          value={props.value}
          onChange={props.onChange}
          onBlur={props.onBlur}
          disabled={props.disabled}
          placeholder="انتخاب مدیر مستقیم…"
          searchPlaceholder="جستجوی نام یا نام کاربری…"
          noneOption={{ label: '— بدون مدیر مستقیم —', value: '' }}
          selectedFallbackLabel={initialUser?.manager_name ?? undefined}
          queryKey={userFormQueryKeys.managersInfinite(isEdit ? userId : null)}
          fetchPage={(page, search) => fetchManagersPage(page, search, isEdit ? userId : undefined)}
        />
      );
    }

    return {
      role_id: RoleField,
      department_id: DepartmentField,
      manager_id: ManagerField,
    };
  }, [initialUser?.department_name, initialUser?.manager_name, initialUser?.role_name, isEdit, userId]);

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
      key={isEdit ? `edit-user-${userId}` : 'new-user'}
      schema={formSchema}
      formId={formId}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      customFields={customFields}
    />
  );
}

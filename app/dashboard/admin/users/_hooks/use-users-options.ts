'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { getUsersAction } from '@/app/_actions/user-actions';
import type { AdminUser } from '@/app/_types/user.types';
import { displayUserFullName } from '../_utils/user-form.utils';
import { useFormAction } from '@/app/hooks/use-form-action';

export type UserSelectOption = { label: string; value: string };

function toOption(u: AdminUser): UserSelectOption {
  const name = displayUserFullName(u);
  const label = name !== '—' ? `${name} (${u.username})` : u.username;
  return { label, value: String(u.id) };
}

export function useUsersOptions(excludeUserId?: number | null) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, startLoadTransition] = useTransition();
  const { notifyError } = useFormAction();

  const loadUsers = useCallback(() => {
    startLoadTransition(async () => {
      const result = await getUsersAction({ page: 1, pageSize: 200 });
      if (result.success && result.data?.items) {
        setUsers(result.data.items);
      } else {
        notifyError(result.error || 'دریافت کاربران ناموفق بود');
      }
    });
  }, [notifyError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const options = useMemo(() => {
    const base: UserSelectOption[] = [{ label: '— بدون مدیر مستقیم —', value: '' }];
    const list = excludeUserId
      ? users.filter((u) => u.id !== excludeUserId)
      : users;
    return [...base, ...list.map(toOption)];
  }, [users, excludeUserId]);

  return { options, isLoading, reloadUsers: loadUsers };
}

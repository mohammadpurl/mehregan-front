'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { getAllRolesAction } from '@/app/_actions/role-actions';
import type { Role } from '@/app/_types/role.types';
import { useFormAction } from '@/app/hooks/use-form-action';

export function useRolesOptions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, startLoadTransition] = useTransition();
  const { notifyError } = useFormAction();

  const loadRoles = useCallback(() => {
    startLoadTransition(async () => {
      const result = await getAllRolesAction();
      if (result.success && result.data?.items) {
        setRoles(result.data.items);
      } else {
        notifyError(result.error || 'دریافت نقش‌ها ناموفق بود');
      }
    });
  }, [notifyError]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return { roles, isLoading, reloadRoles: loadRoles };
}

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirmDelete } from '@/app/components/confirm-delete-provider';
import { useFormAction, type ActionResult } from '@/app/hooks/use-form-action';

type DeleteOptions<T = unknown> = {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: T | undefined) => void;
};

/**
 * تأیید حذف + اجرای action + Notification خطا/موفقیت + router.refresh + reload لیست
 */
export function useDeleteAction() {
  const router = useRouter();
  const { confirmDelete } = useConfirmDelete();
  const { runAction, isPending: deletePending } = useFormAction();

  const executeDelete = useCallback(
    async <T,>(action: () => Promise<ActionResult<T>>, options?: DeleteOptions<T>) => {
      if (!(await confirmDelete())) return false;

      return new Promise<boolean>((resolve) => {
        runAction(action, {
          successMessage: options?.successMessage ?? 'حذف با موفقیت انجام شد',
          errorMessage: options?.errorMessage ?? 'حذف ناموفق بود',
          onSuccess: (data) => {
            router.refresh();
            options?.onSuccess?.(data);
            resolve(true);
          },
          onError: () => resolve(false),
        });
      });
    },
    [confirmDelete, runAction, router],
  );

  return { executeDelete, deletePending, confirmDelete };
}

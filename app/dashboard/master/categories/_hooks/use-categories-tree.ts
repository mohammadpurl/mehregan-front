'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import type { Category, CategoryTreeNode } from '@/app/_types/category.types';
import { getAllCategoriesMetaAction, getCategoriesTreeAction } from '@/app/_actions/category-actions';
import { useFormAction } from '@/app/hooks/use-form-action';

export function useCategoriesTree() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [metaList, setMetaList] = useState<Category[]>([]);
  const [isLoading, startTransition] = useTransition();
  const { notifyError } = useFormAction();

  const metaById = useMemo(() => new Map(metaList.map((c) => [c.id, c])), [metaList]);

  const reload = useCallback(() => {
    startTransition(async () => {
      const [treeResult, metaResult] = await Promise.all([
        getCategoriesTreeAction(),
        getAllCategoriesMetaAction(),
      ]);

      if (treeResult.success) {
        setTree(treeResult.data);
      } else {
        notifyError(treeResult.error || 'خطا در دریافت درخت گروه‌ها');
        setTree([]);
      }

      if (metaResult.success) {
        setMetaList(metaResult.data);
      } else if (metaResult.error) {
        notifyError(metaResult.error);
        setMetaList([]);
      }
    });
  }, [notifyError]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { tree, metaById, isLoading, reload };
}

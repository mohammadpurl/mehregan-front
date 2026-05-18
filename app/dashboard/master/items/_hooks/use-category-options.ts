'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { getCategoriesTreeAction } from '@/app/_actions/category-actions';
import type { CategoryTreeNode } from '@/app/_types/category.types';
import { buildCategorySelectOptions } from '@/app/dashboard/master/categories/_utils/category-form.utils';
import { useFormAction } from '@/app/hooks/use-form-action';

export function useCategoryOptions() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [isLoading, startTransition] = useTransition();
  const { notifyError } = useFormAction();

  const loadCategories = useCallback(() => {
    startTransition(async () => {
      const result = await getCategoriesTreeAction();
      if (result.success) {
        setTree(result.data);
      } else {
        notifyError(result.error || 'دریافت گروه‌های کالا ناموفق بود');
        setTree([]);
      }
    });
  }, [notifyError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const categoryOptions = useMemo(() => buildCategorySelectOptions(tree), [tree]);

  return { categoryOptions, isLoading, reloadCategories: loadCategories };
}

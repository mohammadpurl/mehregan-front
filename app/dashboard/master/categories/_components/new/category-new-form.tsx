'use client';

import type { CategoryTreeNode } from '@/app/_types/category.types';
import { CategoryForm } from '../category-form';

type CategoryNewFormProps = {
  tree: CategoryTreeNode[];
  defaultParentId?: number | null;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

export function CategoryNewForm({ tree, defaultParentId, onSuccess, onBusyChange }: CategoryNewFormProps) {
  return (
    <CategoryForm
      mode="create"
      tree={tree}
      formId="category-new-form"
      defaultParentId={defaultParentId}
      onSuccess={onSuccess}
      onBusyChange={onBusyChange}
    />
  );
}

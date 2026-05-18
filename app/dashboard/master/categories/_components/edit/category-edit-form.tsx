'use client';

import type { Category, CategoryTreeNode } from '@/app/_types/category.types';
import { CategoryForm } from '../category-form';

type CategoryEditFormProps = {
  tree: CategoryTreeNode[];
  category: Category;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

export function CategoryEditForm({ tree, category, onSuccess, onBusyChange }: CategoryEditFormProps) {
  return (
    <CategoryForm
      mode="edit"
      tree={tree}
      categoryId={category.id}
      initialCategory={category}
      formId="category-edit-form"
      onSuccess={onSuccess}
      onBusyChange={onBusyChange}
    />
  );
}

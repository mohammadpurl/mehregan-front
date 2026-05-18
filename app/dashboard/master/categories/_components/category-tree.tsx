'use client';

import type { Category, CategoryTreeNode } from '@/app/_types/category.types';
import { CategoryTreeNodeRow } from './category-tree-node-row';

type CategoryTreeProps = {
  nodes: CategoryTreeNode[];
  metaById: Map<number, Category>;
  onAddChild: (parentId: number) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  deletePending: boolean;
};

export function CategoryTree({ nodes, metaById, onAddChild, onEdit, onDelete, deletePending }: CategoryTreeProps) {
  if (nodes.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">گروه کالایی ثبت نشده است.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
      {nodes.map((node) => (
        <CategoryTreeNodeRow
          key={node.id}
          node={node}
          depth={0}
          metaById={metaById}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          deletePending={deletePending}
        />
      ))}
    </div>
  );
}

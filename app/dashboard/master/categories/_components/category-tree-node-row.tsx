'use client';

import { useState } from 'react';
import { ChevronDown, ChevronLeft, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';
import type { Category, CategoryTreeNode } from '@/app/_types/category.types';
import { canDeleteCategory, deleteBlockedReason } from '../_utils/category-form.utils';
import { cn } from '@/lib/utils';

type CategoryTreeNodeRowProps = {
  node: CategoryTreeNode;
  depth: number;
  metaById: Map<number, Category>;
  onAddChild: (parentId: number) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  deletePending: boolean;
};

export function CategoryTreeNodeRow({
  node,
  depth,
  metaById,
  onAddChild,
  onEdit,
  onDelete,
  deletePending,
}: CategoryTreeNodeRowProps) {
  const [open, setOpen] = useState(depth < 1);
  const meta = metaById.get(node.id);
  const hasChildren = node.children.length > 0;
  const deletable = canDeleteCategory(meta);
  const blockReason = deleteBlockedReason(meta);

  const handleEdit = () => {
    if (meta) {
      onEdit(meta);
      return;
    }
    onEdit({
      id: node.id,
      name: node.name,
      parent_id: node.parent_id,
      children_count: node.children.length,
      items_count: 0,
    });
  };

  const handleDelete = () => {
    const category = meta ?? {
      id: node.id,
      name: node.name,
      parent_id: node.parent_id,
      children_count: node.children.length,
      items_count: 0,
    };
    onDelete(category);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 border-b border-sky-100 py-2 pe-2 transition-colors hover:bg-sky-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/40',
        )}
        style={{ paddingInlineStart: `${depth * 1.25 + 0.5}rem` }}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        ) : (
          <span className="inline-block h-8 w-8 shrink-0" aria-hidden />
        )}

        <FolderTree className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" />
        <span className="min-w-0 flex-1 text-sm font-medium">{node.name}</span>

        <span className="text-xs text-muted-foreground">
          {meta != null ? (
            <>
              زیرگروه: {meta.children_count} · کالا: {meta.items_count}
            </>
          ) : (
            <>زیرگروه: {node.children.length}</>
          )}
        </span>

        <div className="flex shrink-0 flex-wrap gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onAddChild(node.id)} title="افزودن زیرگروه">
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleEdit} title="ویرایش">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deletePending || !deletable}
            title={blockReason ?? 'حذف'}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasChildren && (
        <CollapsibleContent>
          <div className="border-s-2 border-sky-100 ms-4 dark:border-zinc-800">
            {node.children.map((child) => (
              <CategoryTreeNodeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                metaById={metaById}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
                deletePending={deletePending}
              />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  GitBranch,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DepartmentTreeNode } from '@/app/_types/department.types';
import { flattenDepartmentTree } from '@/app/_utils/department-mapper';

type Props = {
  tree: DepartmentTreeNode[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAddRoot: () => void;
  onAddChild: (parentId: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

function collectAllIds(nodes: DepartmentTreeNode[]): number[] {
  return flattenDepartmentTree(nodes).map((n) => n.id);
}

type TreeNodeProps = {
  node: DepartmentTreeNode;
  depth: number;
  selectedId: number | null;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onSelect: (id: number) => void;
  onAddChild: (parentId: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

function DepartmentTreeNodeRow({
  node,
  depth,
  selectedId,
  expanded,
  onToggle,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <li className="list-none">
      <div
        className={cn('group relative flex items-start gap-2', depth > 0 && 'mt-2')}
        style={{ paddingInlineStart: depth > 0 ? `${depth * 1.25}rem` : 0 }}
      >
        {depth > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-border"
            style={{ insetInlineStart: `${(depth - 1) * 1.25 + 0.6}rem` }}
          />
        )}

        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-1 h-7 w-7 shrink-0"
            onClick={() => onToggle(node.id)}
            aria-label={isExpanded ? 'بستن زیرمجموعه' : 'باز کردن زیرمجموعه'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground/50" />
          </span>
        )}

        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className={cn(
            'min-w-0 flex-1 rounded-xl border bg-card p-3 text-start shadow-sm transition-colors',
            'hover:border-primary/40 hover:bg-accent/30',
            isSelected && 'border-primary ring-2 ring-primary/20',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-medium">{node.name}</span>
            {node.childrenCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {node.childrenCount} زیرواحد
              </Badge>
            )}
            {node.usersCount > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Users className="h-3 w-3" />
                {node.usersCount}
              </Badge>
            )}
          </div>
          {node.headUserName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              مسئول: {node.headUserName}
            </p>
          )}
        </button>

        <div className="flex shrink-0 flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="افزودن زیرواحد"
            onClick={() => onAddChild(node.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="ویرایش"
            onClick={() => onEdit(node.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="حذف"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <ul className="mt-1">
          {node.children.map((child) => (
            <DepartmentTreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function DepartmentTreeView({
  tree,
  selectedId,
  onSelect,
  onAddRoot,
  onAddChild,
  onEdit,
  onDelete,
}: Props) {
  const allIds = useMemo(() => collectAllIds(tree), [tree]);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of allIds) next.add(id);
      return next;
    });
  }, [allIds]);

  const onToggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => setExpanded(new Set(allIds));
  const collapseAll = () => setExpanded(new Set());

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <div>
          <p className="font-medium">هنوز واحد سازمانی تعریف نشده است</p>
          <p className="mt-1 text-sm text-muted-foreground">
            اولین واحد را به‌عنوان ریشه درخت اضافه کنید.
          </p>
        </div>
        <Button type="button" onClick={onAddRoot}>
          <Plus className="ms-2 h-4 w-4" />
          افزودن واحد ریشه
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={expandAll}>
          باز کردن همه
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={collapseAll}>
          بستن همه
        </Button>
      </div>
      <ul className="m-0 p-0">
        {tree.map((node) => (
          <DepartmentTreeNodeRow
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}

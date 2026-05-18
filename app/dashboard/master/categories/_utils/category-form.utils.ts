import type { CategoryFormValues } from '../_types/category.schema';
import type { Category, CategoryTreeNode, CreateCategoryModel, UpdateCategoryModel } from '@/app/_types/category.types';

export function parentIdFromForm(val: string | undefined): number | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function formToCreateModel(data: CategoryFormValues): CreateCategoryModel {
  return {
    name: data.name.trim(),
    parent_id: parentIdFromForm(data.parent_id),
  };
}

export function formToUpdateModel(data: CategoryFormValues): UpdateCategoryModel {
  return {
    name: data.name.trim(),
    parent_id: parentIdFromForm(data.parent_id),
  };
}

export function categoryToFormDefaults(
  category?: Pick<Category, 'name' | 'parent_id'>,
  defaultParentId?: number | null,
): CategoryFormValues {
  const parentId = category?.parent_id ?? defaultParentId ?? null;
  return {
    name: category?.name ?? '',
    parent_id: parentId != null ? String(parentId) : '',
  };
}

export function canDeleteCategory(meta?: Pick<Category, 'children_count' | 'items_count'>): boolean {
  if (!meta) return true;
  return (meta.children_count ?? 0) === 0 && (meta.items_count ?? 0) === 0;
}

export function deleteBlockedReason(meta?: Pick<Category, 'children_count' | 'items_count'>): string | null {
  if (!meta) return null;
  if ((meta.children_count ?? 0) > 0) {
    return `این گروه دارای ${meta.children_count} زیرگروه است و قابل حذف نیست`;
  }
  if ((meta.items_count ?? 0) > 0) {
    return `این گروه در ${meta.items_count} کالا استفاده شده و قابل حذف نیست`;
  }
  return null;
}

export function collectDescendantIds(node: CategoryTreeNode): Set<number> {
  const ids = new Set<number>();
  const walk = (n: CategoryTreeNode) => {
    for (const child of n.children) {
      ids.add(child.id);
      walk(child);
    }
  };
  walk(node);
  return ids;
}

export function findTreeNode(nodes: CategoryTreeNode[], id: number): CategoryTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findTreeNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

export type ParentSelectOption = { label: string; value: string };

/** گزینه‌های انتخاب گروه کالا در فرم کالا (بدون گزینه «بدون والد») */
export function buildCategorySelectOptions(tree: CategoryTreeNode[]): ParentSelectOption[] {
  const options: ParentSelectOption[] = [];

  const walk = (nodes: CategoryTreeNode[], depth: number) => {
    for (const n of nodes) {
      const prefix = depth > 0 ? `${'— '.repeat(depth)}` : '';
      options.push({ label: `${prefix}${n.name}`, value: String(n.id) });
      walk(n.children, depth + 1);
    }
  };

  walk(tree, 0);
  return options;
}

export function buildParentSelectOptions(
  tree: CategoryTreeNode[],
  excludeId?: number,
): ParentSelectOption[] {
  const exclude = new Set<number>();
  if (excludeId != null) {
    exclude.add(excludeId);
    const node = findTreeNode(tree, excludeId);
    if (node) {
      for (const id of collectDescendantIds(node)) {
        exclude.add(id);
      }
    }
  }

  const options: ParentSelectOption[] = [{ label: '— بدون والد (ریشه) —', value: '' }];

  const walk = (nodes: CategoryTreeNode[], depth: number) => {
    for (const n of nodes) {
      if (!exclude.has(n.id)) {
        const prefix = depth > 0 ? `${'— '.repeat(depth)}` : '';
        options.push({ label: `${prefix}${n.name}`, value: String(n.id) });
        walk(n.children, depth + 1);
      }
    }
  };

  walk(tree, 0);
  return options;
}

export function filterCategoryTree(nodes: CategoryTreeNode[], query: string): CategoryTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const filterNode = (node: CategoryTreeNode): CategoryTreeNode | null => {
    const filteredChildren = node.children
      .map(filterNode)
      .filter((c): c is CategoryTreeNode => c != null);
    const selfMatch = node.name.toLowerCase().includes(q);
    if (selfMatch || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  };

  return nodes.map(filterNode).filter((n): n is CategoryTreeNode => n != null);
}

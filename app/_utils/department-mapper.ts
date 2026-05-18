import type { Department, DepartmentTreeNode } from '@/app/_types/department.types';

function pickNum(raw: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const v = raw[key];
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickStr(raw: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = raw[key];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return null;
}

export function normalizeDepartment(raw: unknown): Department {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: Number(r.id),
    name: String(r.name ?? ''),
    parentId: pickNum(r, 'parent_id', 'parentId'),
    parentName: pickStr(r, 'parent_name', 'parentName'),
    headUserId: pickNum(r, 'head_user_id', 'headUserId'),
    headUserName: pickStr(r, 'head_user_name', 'headUserName'),
    childrenCount: Number(r.children_count ?? r.childrenCount ?? 0) || 0,
    usersCount: Number(r.users_count ?? r.usersCount ?? 0) || 0,
  };
}

export function normalizeDepartmentTree(nodes: unknown[]): DepartmentTreeNode[] {
  return nodes.map((node) => {
    const base = normalizeDepartment(node);
    const raw = (node && typeof node === 'object' ? node : {}) as Record<string, unknown>;
    const childrenRaw = Array.isArray(raw.children) ? raw.children : [];
    return {
      ...base,
      children: normalizeDepartmentTree(childrenRaw),
    };
  });
}

/** همه شناسه‌های زیرمجموعه (برای جلوگیری از حلقه در انتخاب والد) */
export function collectDescendantIds(node: DepartmentTreeNode): Set<number> {
  const ids = new Set<number>();
  const walk = (n: DepartmentTreeNode) => {
    for (const child of n.children) {
      ids.add(child.id);
      walk(child);
    }
  };
  walk(node);
  return ids;
}

export function flattenDepartmentTree(nodes: DepartmentTreeNode[]): DepartmentTreeNode[] {
  const out: DepartmentTreeNode[] = [];
  const walk = (list: DepartmentTreeNode[]) => {
    for (const n of list) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

export function findDepartmentNode(
  nodes: DepartmentTreeNode[],
  id: number,
): DepartmentTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findDepartmentNode(n.children, id);
    if (found) return found;
  }
  return null;
}

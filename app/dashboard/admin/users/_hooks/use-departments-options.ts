'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { getDepartmentTreeAction } from '@/app/_actions/department-actions';
import type { DepartmentTreeNode } from '@/app/_types/department.types';
import { useFormAction } from '@/app/hooks/use-form-action';

export type DepartmentSelectOption = { label: string; value: string };

function buildSelectOptions(tree: DepartmentTreeNode[]): DepartmentSelectOption[] {
  const options: DepartmentSelectOption[] = [{ label: '— بدون واحد —', value: '' }];

  const walk = (nodes: DepartmentTreeNode[], depth: number) => {
    for (const node of nodes) {
      const prefix = depth > 0 ? `${'— '.repeat(depth)}` : '';
      options.push({ label: `${prefix}${node.name}`, value: String(node.id) });
      walk(node.children, depth + 1);
    }
  };

  walk(tree, 0);
  return options;
}

export function useDepartmentsOptions() {
  const [tree, setTree] = useState<DepartmentTreeNode[]>([]);
  const [isLoading, startLoadTransition] = useTransition();
  const { notifyError } = useFormAction();

  const loadDepartments = useCallback(() => {
    startLoadTransition(async () => {
      const result = await getDepartmentTreeAction();
      if (result.success) {
        setTree(result.data);
      } else {
        notifyError(result.error || 'دریافت واحدهای سازمانی ناموفق بود');
      }
    });
  }, [notifyError]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const options = useMemo(() => buildSelectOptions(tree), [tree]);

  return { options, isLoading, reloadDepartments: loadDepartments };
}

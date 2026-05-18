'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, Plus, RefreshCw } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  createDepartmentAction,
  deleteDepartmentAction,
  getDepartmentTreeAction,
  updateDepartmentAction,
} from '@/app/_actions/department-actions';
import type { DepartmentTreeNode } from '@/app/_types/department.types';
import { findDepartmentNode } from '@/app/_utils/department-mapper';
import { DepartmentTreeView } from '../_components/department-tree-view';
import {
  DepartmentFormDialog,
  type DepartmentFormValues,
} from '../_components/department-form-dialog';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { useFormAction } from '@/app/hooks/use-form-action';

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create-root' }
  | { kind: 'create-child'; parentId: number }
  | { kind: 'edit'; id: number };

export default function DepartmentTreePage() {
  const { runAction, isPending } = useFormAction();
  const { executeDelete } = useDeleteAction();

  const [tree, setTree] = useState<DepartmentTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });

  const loadTree = useCallback(async () => {
    setLoading(true);
    const res = await getDepartmentTreeAction();
    if (res.success) {
      setTree(res.data);
      setSelectedId((prev) =>
        prev != null && findDepartmentNode(res.data, prev) ? prev : null,
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  const selected = useMemo(
    () => (selectedId != null ? findDepartmentNode(tree, selectedId) : null),
    [tree, selectedId],
  );

  const dialogOpen = dialog.kind !== 'closed';
  const dialogMode = dialog.kind === 'edit' ? 'edit' : 'create';

  const dialogInitial = useMemo((): Partial<DepartmentFormValues> | undefined => {
    if (dialog.kind === 'edit') {
      const node = findDepartmentNode(tree, dialog.id);
      if (!node) return undefined;
      return {
        name: node.name,
        parentId: node.parentId,
        headUserId: node.headUserId,
      };
    }
    if (dialog.kind === 'create-child') {
      return { parentId: dialog.parentId };
    }
    return { parentId: null };
  }, [dialog, tree]);

  const fixedParentId = dialog.kind === 'create-child' ? dialog.parentId : undefined;
  const editingId = dialog.kind === 'edit' ? dialog.id : null;

  const handleFormSubmit = (values: DepartmentFormValues) => {
    if (dialog.kind === 'edit') {
      runAction(
        () =>
          updateDepartmentAction(dialog.id, {
            name: values.name,
            parentId: values.parentId,
            headUserId: values.headUserId,
          }),
        {
          successMessage: 'واحد به‌روزرسانی شد',
          onSuccess: () => {
            setDialog({ kind: 'closed' });
            void loadTree();
          },
        },
      );
      return;
    }

    runAction(
      () =>
        createDepartmentAction({
          name: values.name,
          parentId: values.parentId,
          headUserId: values.headUserId,
        }),
      {
        successMessage: 'واحد ایجاد شد',
        onSuccess: () => {
          setDialog({ kind: 'closed' });
          void loadTree();
        },
      },
    );
  };

  const handleDelete = async (id: number) => {
    await executeDelete(() => deleteDepartmentAction(id), {
      successMessage: 'واحد حذف شد',
      onSuccess: () => {
        if (selectedId === id) setSelectedId(null);
        void loadTree();
      },
    });
  };

  return (
    <DashboardPageShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">درخت واحدهای سازمانی</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ساختار سلسله‌مراتبی واحدها برای workflow و تخصیص کاربران
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void loadTree()} disabled={loading}>
            {loading ? (
              <Loader2 className="ms-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="ms-2 h-4 w-4" />
            )}
            بروزرسانی
          </Button>
          <Button type="button" size="sm" onClick={() => setDialog({ kind: 'create-root' })}>
            <Plus className="ms-2 h-4 w-4" />
            واحد ریشه
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              نمای درختی
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && tree.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DepartmentTreeView
                tree={tree}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAddRoot={() => setDialog({ kind: 'create-root' })}
                onAddChild={(parentId) => setDialog({ kind: 'create-child', parentId })}
                onEdit={(id) => setDialog({ kind: 'edit', id })}
                onDelete={(id) => void handleDelete(id)}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">جزئیات واحد</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground">
                روی یک واحد در درخت کلیک کنید تا جزئیات نمایش داده شود.
              </p>
            ) : (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">نام</dt>
                  <dd className="font-medium">{selected.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">والد</dt>
                  <dd>{selected.parentName ?? '— (ریشه)'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">مسئول واحد</dt>
                  <dd>{selected.headUserName ?? '—'}</dd>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="secondary">{selected.childrenCount} زیرواحد</Badge>
                  <Badge variant="outline">{selected.usersCount} کاربر</Badge>
                </div>
                <div className="flex flex-col gap-2 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog({ kind: 'edit', id: selected.id })}
                  >
                    ویرایش
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog({ kind: 'create-child', parentId: selected.id })}
                  >
                    افزودن زیرواحد
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link href="/dashboard/admin/users">مدیریت کاربران</Link>
                  </Button>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <DepartmentFormDialog
        open={dialogOpen}
        mode={dialogMode}
        tree={tree}
        editingId={editingId}
        fixedParentId={fixedParentId}
        initial={dialogInitial}
        saving={isPending}
        onOpenChange={(open) => {
          if (!open) setDialog({ kind: 'closed' });
        }}
        onSubmit={handleFormSubmit}
      />
    </DashboardPageShell>
  );
}

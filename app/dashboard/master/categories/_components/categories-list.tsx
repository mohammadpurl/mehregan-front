'use client';

import { useCallback, useMemo, useState } from 'react';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { deleteCategoryAction } from '@/app/_actions/category-actions';
import type { Category } from '@/app/_types/category.types';
import { useDeleteAction } from '@/app/hooks/use-delete-action';
import { useFormAction } from '@/app/hooks/use-form-action';
import { useCategoriesTree } from '../_hooks/use-categories-tree';
import { filterCategoryTree } from '../_utils/category-form.utils';
import { CategoryTree } from './category-tree';
import { CategoryFormModal } from './category-form-modal';

export function CategoriesList() {
  const { tree, metaById, isLoading, reload } = useCategoriesTree();
  const { executeDelete, deletePending } = useDeleteAction();
  const { notifyError } = useFormAction();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);

  const filteredTree = useMemo(() => filterCategoryTree(tree, search), [tree, search]);

  const openCreateRoot = useCallback(() => {
    setEditingCategory(null);
    setDefaultParentId(null);
    setModalOpen(true);
  }, []);

  const openCreateChild = useCallback((parentId: number) => {
    setEditingCategory(null);
    setDefaultParentId(parentId);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setDefaultParentId(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingCategory(null);
    setDefaultParentId(null);
  }, []);

  const handleDelete = useCallback(
    async (category: Category) => {
      if ((category.children_count ?? 0) > 0 || (category.items_count ?? 0) > 0) {
        notifyError(
          category.children_count > 0
            ? `این گروه دارای ${category.children_count} زیرگروه است و قابل حذف نیست`
            : `این گروه در ${category.items_count} کالا استفاده شده و قابل حذف نیست`,
        );
        return;
      }

      await executeDelete(() => deleteCategoryAction(category.id), {
        successMessage: 'گروه کالا حذف شد',
        errorMessage: 'حذف گروه کالا ناموفق بود',
        onSuccess: () => {
          reload();
          if (editingCategory?.id === category.id) closeModal();
        },
      });
    },
    [closeModal, editingCategory?.id, executeDelete, notifyError, reload],
  );

  return (
    <DashboardPageShell>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>مدیریت گروه کالا</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={reload} disabled={isLoading}>
              <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </Button>
            <Button type="button" size="sm" onClick={openCreateRoot}>
              <Plus className="ml-2 h-4 w-4" />
              گروه جدید
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="جستجو در نام گروه..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />

          {isLoading && tree.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              در حال بارگذاری...
            </div>
          ) : (
            <CategoryTree
              nodes={filteredTree}
              metaById={metaById}
              onAddChild={openCreateChild}
              onEdit={openEdit}
              onDelete={handleDelete}
              deletePending={deletePending}
            />
          )}

          <p className="text-xs text-muted-foreground">
            حذف گروه‌هایی که زیرگروه یا کالای وابسته دارند امکان‌پذیر نیست.
          </p>
        </CardContent>
      </Card>

      <CategoryFormModal
        open={modalOpen}
        editingCategory={editingCategory}
        defaultParentId={defaultParentId}
        tree={tree}
        onOpenChange={(open) => {
          if (!open) closeModal();
          else setModalOpen(true);
        }}
        onSaved={reload}
      />
    </DashboardPageShell>
  );
}

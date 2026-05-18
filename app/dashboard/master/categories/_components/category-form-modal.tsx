'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdvancedModal } from '@/app/components/Modal';
import { Button } from '@/app/components/ui/button';
import type { Category, CategoryTreeNode } from '@/app/_types/category.types';
import { CategoryNewForm } from './new/category-new-form';
import { CategoryEditForm } from './edit/category-edit-form';

type CategoryFormModalProps = {
  open: boolean;
  editingCategory: Category | null;
  defaultParentId?: number | null;
  tree: CategoryTreeNode[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function CategoryFormModal({
  open,
  editingCategory,
  defaultParentId,
  tree,
  onOpenChange,
  onSaved,
}: CategoryFormModalProps) {
  const [formBusy, setFormBusy] = useState(false);
  const isEdit = editingCategory != null;
  const formId = isEdit ? 'category-edit-form' : 'category-new-form';

  const handleSuccess = () => {
    onOpenChange(false);
    onSaved();
  };

  const title = isEdit
    ? 'ویرایش گروه کالا'
    : defaultParentId != null
      ? 'افزودن زیرگروه'
      : 'ایجاد گروه کالا';

  return (
    <AdvancedModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button type="submit" form={formId} disabled={formBusy}>
            {formBusy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            ذخیره
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={formBusy}>
            بستن
          </Button>
        </div>
      }
    >
      {isEdit && editingCategory ? (
        <CategoryEditForm tree={tree} category={editingCategory} onSuccess={handleSuccess} onBusyChange={setFormBusy} />
      ) : (
        <CategoryNewForm
          tree={tree}
          defaultParentId={defaultParentId}
          onSuccess={handleSuccess}
          onBusyChange={setFormBusy}
        />
      )}
    </AdvancedModal>
  );
}

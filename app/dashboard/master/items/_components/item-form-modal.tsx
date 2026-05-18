'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdvancedModal } from '@/app/components/Modal';
import { Button } from '@/app/components/ui/button';
import type { Item } from '@/app/_types/item.types';
import { ItemNewForm } from './new/item-new-form';
import { ItemEditForm } from './edit/item-edit-form';

type ItemFormModalProps = {
  open: boolean;
  editingItem: Item | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function ItemFormModal({ open, editingItem, onOpenChange, onSaved }: ItemFormModalProps) {
  const [formBusy, setFormBusy] = useState(false);
  const isEdit = editingItem != null;
  const formId = isEdit ? 'item-edit-form' : 'item-new-form';

  const handleSuccess = () => {
    onOpenChange(false);
    onSaved();
  };

  return (
    <AdvancedModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'ویرایش کالا' : 'ایجاد کالا'}
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
      {isEdit && editingItem ? (
        <ItemEditForm itemId={editingItem.id} item={editingItem} onSuccess={handleSuccess} onBusyChange={setFormBusy} />
      ) : (
        <ItemNewForm onSuccess={handleSuccess} onBusyChange={setFormBusy} />
      )}
    </AdvancedModal>
  );
}

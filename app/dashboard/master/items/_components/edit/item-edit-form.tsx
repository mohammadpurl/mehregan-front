'use client';

import { ItemForm } from '../item-form';
import type { Item } from '@/app/_types/item.types';

type ItemEditFormProps = {
  itemId: number;
  item: Item;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

/** فرم ویرایش کالا — فقط داخل مودال استفاده شود */
export function ItemEditForm({ itemId, item, onSuccess, onBusyChange }: ItemEditFormProps) {
  return (
    <ItemForm
      mode="edit"
      itemId={itemId}
      initialItem={item}
      formId="item-edit-form"
      onSuccess={onSuccess}
      onBusyChange={onBusyChange}
    />
  );
}

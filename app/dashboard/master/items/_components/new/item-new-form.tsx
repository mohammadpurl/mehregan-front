'use client';

import { ItemForm } from '../item-form';

type ItemNewFormProps = {
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
};

/** فرم ایجاد کالا — فقط داخل مودال استفاده شود */
export function ItemNewForm({ onSuccess, onBusyChange }: ItemNewFormProps) {
  return <ItemForm mode="create" formId="item-new-form" onSuccess={onSuccess} onBusyChange={onBusyChange} />;
}

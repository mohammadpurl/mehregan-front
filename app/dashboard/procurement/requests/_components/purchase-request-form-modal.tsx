'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdvancedModal } from '@/app/components/Modal';
import { Button } from '@/app/components/ui/button';
import type { PurchaseRequest } from '@/app/_types/purchase-request.types';
import { PurchaseRequestNewForm } from './purchase-request-new-form';

type Props = {
  open: boolean;
  editing: PurchaseRequest | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function PurchaseRequestFormModal({ open, editing, onOpenChange, onSaved }: Props) {
  const [formBusy, setFormBusy] = useState(false);
  const isEdit = editing != null;
  const formId = isEdit ? 'purchase-request-edit-form' : 'purchase-request-new-form';

  const handleSuccess = () => {
    onOpenChange(false);
    onSaved();
  };

  return (
    <AdvancedModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `ویرایش درخواست خرید #${editing.id}` : 'ثبت درخواست خرید'}
      description={
        isEdit
          ? 'فقط تا قبل از تأیید اولیه امکان ویرایش اقلام وجود دارد.'
          : 'نام کالا و تعداد الزامی است؛ پس از ثبت، گردش تأیید آغاز می‌شود.'
      }
      size="xl"
      footer={
        <div className="flex gap-2">
          <Button type="submit" form={formId} disabled={formBusy}>
            {formBusy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'ذخیره تغییرات' : 'ثبت درخواست'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={formBusy}>
            بستن
          </Button>
        </div>
      }
    >
      <PurchaseRequestNewForm
        key={editing?.id ?? 'new'}
        formId={formId}
        record={editing}
        onSuccess={handleSuccess}
        onBusyChange={setFormBusy}
      />
    </AdvancedModal>
  );
}

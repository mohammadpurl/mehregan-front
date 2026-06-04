'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdvancedModal } from '@/app/components/Modal';
import { Button } from '@/app/components/ui/button';
import type { AdminUser } from '@/app/_types/user.types';
import { UserNewForm } from './new/user-new-form';
import { UserEditForm } from './edit/user-edit-form';

type UserFormModalProps = {
  open: boolean;
  editingUser: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function UserFormModal({ open, editingUser, onOpenChange, onSaved }: UserFormModalProps) {
  const [formBusy, setFormBusy] = useState(false);
  const isEdit = editingUser != null;
  const formId = isEdit ? 'user-edit-form' : 'user-new-form';

  const handleSuccess = () => {
    onOpenChange(false);
    onSaved();
  };

  return (
    <AdvancedModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'ویرایش کاربر' : 'ایجاد کاربر'}
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
      {open &&
        (isEdit && editingUser ? (
          <UserEditForm
            userId={editingUser.id}
            user={editingUser}
            onSuccess={handleSuccess}
            onBusyChange={setFormBusy}
          />
        ) : (
          <UserNewForm onSuccess={handleSuccess} onBusyChange={setFormBusy} />
        ))}
    </AdvancedModal>
  );
}

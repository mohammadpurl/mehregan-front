'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdvancedModal } from '@/app/components/Modal';
import { Button } from '@/app/components/ui/button';
import { useSessionStore } from '@/app/_store/auth-store';
import type { PaymentRequestResponse } from '../_types/payment-request.types';
import { canEmployeeEditOwn } from '../_utils/payment-request-form.utils';
import { isPaymentRequestOwner } from '../_utils/payment-request-session';
import { PaymentRequestNewForm } from './new/payment-request-new-form';
import { PaymentRequestEditForm } from './edit/payment-request-edit-form';

type Props = {
  open: boolean;
  editing: PaymentRequestResponse | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function PaymentRequestFormModal({ open, editing, onOpenChange, onSaved }: Props) {
  const [formBusy, setFormBusy] = useState(false);
  const session = useSessionStore((s) => s.session);
  const isEdit = editing != null;
  const formId = isEdit ? 'payment-request-edit-form' : 'payment-request-new-form';
  const canSaveEdit = useMemo(() => {
    if (!editing) return false;
    return canEmployeeEditOwn({
      status: editing.status,
      isOwner: isPaymentRequestOwner(editing, session),
      fromOwnList: true,
    });
  }, [editing, session]);

  const handleSuccess = () => {
    onOpenChange(false);
    onSaved();
  };

  return (
    <AdvancedModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'ویرایش درخواست مالی' : 'ثبت درخواست مالی'}
      description={isEdit ? undefined : 'وام، مساعده، تنخواه — حساب واریز از پروفایل شما'}
      size="lg"
      footer={
        <div className="flex gap-2">
          {(!isEdit || canSaveEdit) && (
            <Button type="submit" form={formId} disabled={formBusy}>
              {formBusy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'ذخیره' : 'ثبت'}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={formBusy}>
            بستن
          </Button>
        </div>
      }
    >
      {isEdit && editing ? (
        <PaymentRequestEditForm
          record={editing}
          formId={formId}
          onSuccess={handleSuccess}
          onBusyChange={setFormBusy}
        />
      ) : (
        <PaymentRequestNewForm formId={formId} onSuccess={handleSuccess} onBusyChange={setFormBusy} />
      )}
    </AdvancedModal>
  );
}

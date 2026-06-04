'use client';

import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { createProcurementPaymentAction } from '@/app/_actions/purchase-request-actions';
import type { PurchaseRequest } from '@/app/_types/purchase-request.types';
import { formatAmount } from '@/app/utils/number-format';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

type Props = {
  request: PurchaseRequest;
  onUpdated?: () => void;
};

export function PurchaseRequestPaymentPanel({ request, onUpdated }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const showCreate = request.status === 'ready_for_payment' && !request.payment;
  const showStatus =
    request.payment ||
    request.status === 'payment_pending' ||
    request.status === 'receiving' ||
    request.status === 'completed';

  if (!showCreate && !showStatus) return null;

  const onCreatePayment = async () => {
    setBusy(true);
    const res = await createProcurementPaymentAction(request.id);
    setBusy(false);
    if (!res.success) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'درخواست پرداخت ثبت شد و به کارتابل مالی رفت' });
    onUpdated?.();
  };

  const paymentId = request.payment?.id ?? request.paymentRequestId;
  const wfId = request.payment?.workflowInstanceId;

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <h4 className="font-medium">پرداخت خرید</h4>
      {request.purchaseOrder ? (
        <p className="text-xs text-muted-foreground">
          سفارش خرید:{' '}
          <Link
            href={`/dashboard/procurement/orders?requestId=${request.id}`}
            className="text-primary underline"
          >
            {request.purchaseOrder.orderNo ?? `#${request.purchaseOrder.id}`}
          </Link>
          {request.purchaseOrder.status ? ` — ${request.purchaseOrder.status}` : ''}
        </p>
      ) : null}

      {showCreate ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            پس از ثبت درخواست پرداخت، مالی در کارتابل تأیید می‌کند؛ سپس رسید انبار فعال می‌شود.
          </p>
          <Button disabled={busy} onClick={() => void onCreatePayment()}>
            ثبت درخواست پرداخت
          </Button>
        </div>
      ) : null}

      {request.payment ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>درخواست پرداخت #{request.payment.id}</span>
          <Badge variant="outline">{request.payment.status}</Badge>
          <span>{formatAmount(request.payment.amount)}</span>
          {paymentId ? (
            <>
              <Link
                href={`/dashboard/payment-request/procurement?paymentId=${paymentId}`}
                className="text-primary underline text-xs"
              >
                لیست پرداخت‌های خرید
              </Link>
              <Link
                href={`/dashboard/payment-request/edit/${paymentId}`}
                className="text-primary underline text-xs"
              >
                جزئیات مالی
              </Link>
            </>
          ) : null}
          {wfId ? (
            <Link href="/dashboard/workflow/inbox" className="text-primary underline text-xs">
              کارتابل تأیید
            </Link>
          ) : null}
        </div>
      ) : null}

      {request.status === 'payment_pending' ? (
        <p className="text-xs text-amber-700">در انتظار تأیید پرداخت در کارتابل مالی</p>
      ) : null}
    </section>
  );
}

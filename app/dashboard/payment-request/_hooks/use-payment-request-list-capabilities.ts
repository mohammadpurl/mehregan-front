'use client';

import { useEffect, useState } from 'react';
import {
  getPaymentRequestListCapabilitiesAction,
  type PaymentRequestListScope,
} from '@/app/_actions/payment-request-actions';

const DEFAULT_SCOPES: PaymentRequestListScope[] = ['mine', 'approver', 'participated'];

const SCOPE_LABELS: Record<PaymentRequestListScope, string> = {
  mine: 'درخواست‌های من',
  team: 'واحد / زیرمجموعه',
  all: 'همه درخواست‌ها',
  approver: 'نیاز به تأیید من',
  participated: 'شرکت‌کرده در تأیید',
};

export function paymentRequestScopeLabel(scope: PaymentRequestListScope): string {
  return SCOPE_LABELS[scope] ?? scope;
}

export function usePaymentRequestListCapabilities() {
  const [scopes, setScopes] = useState<PaymentRequestListScope[]>(DEFAULT_SCOPES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getPaymentRequestListCapabilitiesAction();
      if (!cancelled) {
        if (result.success && result.data?.scopes?.length) {
          setScopes(result.data.scopes);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { scopes, loading };
}

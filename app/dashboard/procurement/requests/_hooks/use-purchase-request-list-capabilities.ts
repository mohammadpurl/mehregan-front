'use client';

import { useEffect, useState } from 'react';
import {
  getPurchaseRequestListCapabilitiesAction,
  type PurchaseRequestListScope,
} from '@/app/_actions/purchase-request-actions';

const DEFAULT_SCOPES: PurchaseRequestListScope[] = ['mine', 'approver', 'participated'];

const SCOPE_LABELS: Record<PurchaseRequestListScope, string> = {
  mine: 'درخواست‌های من',
  all: 'همه درخواست‌ها',
  approver: 'نیاز به تأیید من',
  participated: 'شرکت‌کرده در تأیید',
};

export function purchaseRequestScopeLabel(scope: PurchaseRequestListScope): string {
  return SCOPE_LABELS[scope] ?? scope;
}

export function usePurchaseRequestListCapabilities() {
  const [scopes, setScopes] = useState<PurchaseRequestListScope[]>(DEFAULT_SCOPES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getPurchaseRequestListCapabilitiesAction();
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

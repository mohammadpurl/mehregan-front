'use client';

import { useEffect, useState } from 'react';
import {
  getPettyCashListCapabilitiesAction,
  type PettyCashListScope,
} from '@/app/_actions/petty-cash-actions';

const DEFAULT_SCOPES: PettyCashListScope[] = ['mine', 'approver', 'participated'];

const SCOPE_LABELS: Record<PettyCashListScope, string> = {
  mine: 'درخواست‌های من',
  team: 'واحد / زیرمجموعه',
  all: 'همه تنخواه‌ها',
  approver: 'نیاز به تأیید من',
  participated: 'شرکت‌کرده در تأیید',
};

export function pettyCashScopeLabel(scope: PettyCashListScope): string {
  return SCOPE_LABELS[scope] ?? scope;
}

export function usePettyCashListCapabilities() {
  const [scopes, setScopes] = useState<PettyCashListScope[]>(DEFAULT_SCOPES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getPettyCashListCapabilitiesAction();
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

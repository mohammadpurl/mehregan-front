'use server';

import { readDataWithAuth } from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import type { RelatedRequestsResponse } from '@/app/_types/related-requests.types';

export async function getRelatedRequestsByInstanceAction(instanceId: number) {
  try {
    const data = await readDataWithAuth<RelatedRequestsResponse>(
      `/workflow/instances/${instanceId}/related`,
    );
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'دریافت درخواست‌های مرتبط ناموفق بود'),
    };
  }
}

export async function getRelatedRequestsByRefAction(refType: string, refId: number) {
  try {
    const q = new URLSearchParams({ refType, refId: String(refId) });
    const data = await readDataWithAuth<RelatedRequestsResponse>(`/workflow/related?${q.toString()}`);
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'دریافت درخواست‌های مرتبط ناموفق بود'),
    };
  }
}

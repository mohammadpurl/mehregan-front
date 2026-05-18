'use server';

import { createDataWithAuth, readDataWithAuth } from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';
import type { InboxListResponse } from '@/app/_types/inbox.types';

export async function getInboxAction(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('pageSize', String(pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  try {
    const data = await readDataWithAuth<InboxListResponse>(`/inbox?${query.toString()}`);
    return { success: true as const, data };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در دریافت کارتابل') };
  }
}

export async function getInboxUnreadCountAction() {
  try {
    const data = await readDataWithAuth<{ count: number }>('/inbox/unread-count');
    return { success: true as const, count: data.count ?? 0 };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در شمارش کارتابل'), count: 0 };
  }
}

export async function markInboxReadAction(inboxId: number) {
  try {
    await createDataWithAuth(`/inbox/${inboxId}/read`, {});
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در علامت‌گذاری خوانده‌شده') };
  }
}

export async function markInboxDoneAction(inboxId: number) {
  try {
    await createDataWithAuth(`/inbox/${inboxId}/done`, {});
    return { success: true as const };
  } catch (err: unknown) {
    return { success: false as const, error: extractActionErrorMessage(err, 'خطا در تکمیل آیتم') };
  }
}

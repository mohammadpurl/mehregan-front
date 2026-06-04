'use server';

import { readDataWithAuth } from '@/app/core/http-service/http-service';
import { extractActionErrorMessage } from '@/app/_actions/extract-action-error';

export type AuditLogRow = {
  id: number;
  entity: string;
  entity_id: number;
  action: string;
  user_id: number;
  user_name: string | null;
  old_data: unknown;
  new_data: unknown;
  created_at: string | null;
};

export async function getAuditLogsAction(params?: {
  page?: number;
  pageSize?: number;
  entity?: string;
  action?: string;
  search?: string;
}) {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.entity) query.set('entity', params.entity);
    if (params?.action) query.set('action', params.action);
    if (params?.search) query.set('search', params.search);
    const data = await readDataWithAuth<{
      items: AuditLogRow[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/audit-logs/?${query.toString()}`);
    return { success: true as const, data };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: extractActionErrorMessage(err, 'خطا در دریافت لاگ ممیزی'),
    };
  }
}

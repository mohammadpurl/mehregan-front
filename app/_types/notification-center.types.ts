export type NotificationEntity =
  | 'workflow'
  | 'product-request'
  | 'request'
  | 'procurement_proforma'
  | 'item'
  | 'warehouse'
  | 'supplier'
  | 'payment-request'
  | 'petty-cash'
  | 'petty_cash'
  | 'petty_cash_settlement'
  | 'petty-cash-settlement'
  | 'financial_document'
  | 'financial-document'
  | 'mission_request'
  | 'mission-request'
  | 'mission_report'
  | 'mission-report'
  | 'ad_hoc_task'
  | 'system'
  | 'other';

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface NotificationCenterItem {
  id: string;
  title: string;
  message: string;
  level: NotificationLevel;
  /** نوع رویداد بک‌اند — مثلاً workflow.rejected */
  eventType?: string | null;
  entity?: NotificationEntity;
  entity_id?: string | number | null;
  href?: string | null;
  is_read: boolean;
  created_at: string; // ISO
  /** زمان ثبت درخواست کسب‌وکار (وام، مساعده، تنخواه، …) */
  request_created_at?: string | null;
  request_type_label?: string | null;
  requester_name?: string | null;
  /** عنوان کسب‌وکار درخواست (از meta بک‌اند) */
  request_title?: string | null;
  business_ref_id?: string | number | null;
}

export interface NotificationCenterListResponse {
  items: NotificationCenterItem[];
  total: number;
  page?: number;
  pageSize?: number;
  unread?: number;
}


export type NotificationEntity =
  | 'workflow'
  | 'product-request'
  | 'item'
  | 'warehouse'
  | 'supplier'
  | 'payment-request'
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
}

export interface NotificationCenterListResponse {
  items: NotificationCenterItem[];
  total: number;
  page?: number;
  pageSize?: number;
  unread?: number;
}


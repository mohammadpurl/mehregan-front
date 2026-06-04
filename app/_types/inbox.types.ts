export interface InboxItem {
  id: number;
  /** `workflow` | `ad_hoc_task` و ... */
  ref_type: string;
  /** شناسه نمونه workflow یا کار پیش‌بینی‌نشده */
  ref_id: number;
  title?: string;
  message?: string;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
  updated_at?: string;
  request_created_at?: string;
  request_type_label?: string;
  requester_name?: string;
  business_ref_id?: number;
  business_ref_type?: string;
}

export interface InboxListResponse {
  items: InboxItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InboxItem {
  id: number;
  /** همیشه `"workflow"` برای کارهای تأیید */
  ref_type: string;
  /** شناسه `workflow_instances.id` */
  ref_id: number;
  title?: string;
  message?: string;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InboxListResponse {
  items: InboxItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Types for Workflow Form (فرم گردش کار)
 * هر آنچه که قرار است در سازمان انجام شود و دارای نتیجه میباشد
 */

export enum WorkflowType {
  GENERAL = 'general', // عمومی
  PROJECT = 'project', // پروژه‌ای
  LETTER = 'letter', // نامه‌های سازمان
  OTHER = 'other' // سایر
}

export interface WorkflowFormData {
  id?: string;
  type?: WorkflowType;
  title: string;
  description: string;
  /** assignee مرحله ۱ — معادل user_id در workflow.start */
  receiver_id?: number;
  requesterId?: string;
  requesterName?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
  attachments?: File[];
  attachmentsUrls?: string[];
}

export interface WorkflowResponse {
  id: string;
  type?: WorkflowType;
  title: string;
  description: string;
  receiver_id?: number;
  requesterId?: string;
  requesterName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  attachmentsUrls: string[];
}

export interface WorkflowListResponse {
  items: WorkflowResponse[];
  total: number;
  page: number;
  pageSize: number;
}

/** نمونه گردش‌کار سازمانی (پیگیری) */
export type WorkflowInstanceListScope =
  | 'mine'
  | 'team'
  | 'all'
  | 'approver'
  | 'participated';

export interface WorkflowInstanceRow {
  id: number;
  ref_type: string;
  ref_id: number;
  ref_label: string;
  status: string;
  title: string;
  requester_id?: number | null;
  requester_name?: string | null;
  current_step_order?: number | null;
  current_assignee_name?: string | null;
  updated_at?: string | null;
}

export interface WorkflowInstanceListResponse {
  items: WorkflowInstanceRow[];
  total: number;
  page: number;
  pageSize: number;
}

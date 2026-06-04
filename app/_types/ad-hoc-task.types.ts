export type AdHocTaskStatus = 'open' | 'closed';

export interface UserLookupItem {
  id: number;
  fullName?: string | null;
  username: string;
}

export interface AdHocTaskAttachment {
  id: number;
  fileName?: string;
  downloadUrl?: string;
  fileUrl?: string;
}

export interface AdHocTaskStep {
  id: number;
  authorId: number;
  authorName?: string | null;
  comment: string;
  assigneeId?: number | null;
  assigneeName?: string | null;
  createdAt?: string | null;
  attachments?: AdHocTaskAttachment[];
}

export interface AdHocTask {
  id: number;
  title: string;
  description?: string | null;
  status: AdHocTaskStatus;
  createdById: number;
  createdByName?: string | null;
  currentAssigneeId: number;
  currentAssigneeName?: string | null;
  dueAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  attachments?: AdHocTaskAttachment[];
  steps?: AdHocTaskStep[];
}

export interface AdHocTaskListItem {
  id: number;
  title: string;
  status: AdHocTaskStatus;
  createdByName?: string | null;
  currentAssigneeName?: string | null;
  dueAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateAdHocTaskPayload {
  title: string;
  description?: string | null;
  assigneeId: number;
  dueAt: string;
  initialComment?: string | null;
}

export interface AddAdHocTaskStepPayload {
  comment: string;
  assigneeId?: number | null;
  dueAt?: string | null;
  closeTask?: boolean;
}

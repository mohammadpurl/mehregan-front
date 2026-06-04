export type FinancialDocumentType = 'check' | 'other';

export type FinancialDocumentStatus = 'pending' | 'approved' | 'rejected';

export interface FinancialDocumentAttachment {
  id?: string | number;
  fileName?: string;
  fileUrl?: string;
}

export interface FinancialDocumentResponse {
  id: number;
  requesterId: number;
  requesterName?: string | null;
  documentType: FinancialDocumentType;
  title?: string | null;
  description?: string | null;
  amount?: number | null;
  documentDate?: string | null;
  checkNumber?: string | null;
  partyName?: string | null;
  status: FinancialDocumentStatus;
  financeConfirmedAt?: string | null;
  workflowInstanceId?: number | null;
  createdAt?: string | null;
  attachments?: FinancialDocumentAttachment[];
  attachmentCount?: number;
  documentsUrls?: string[];
}

export interface FinancialDocumentCreateInput {
  documentType: FinancialDocumentType;
  title?: string;
  description?: string;
  amount?: number;
  documentDate?: string;
  checkNumber?: string;
  partyName?: string;
}

import type {
  FinancialDocumentCreateInput,
  FinancialDocumentResponse,
} from '../_types/financial-document.types';

function coerceString(v: unknown): string {
  return v != null ? String(v) : '';
}

function coerceNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normalizeFinancialDocumentFromApi(raw: unknown): FinancialDocumentResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const docTypeRaw = r.documentType ?? r.document_type ?? 'check';
  const documentType = String(docTypeRaw).toLowerCase() as FinancialDocumentResponse['documentType'];

  const attachments = Array.isArray(r.attachments)
    ? (r.attachments as Record<string, unknown>[]).map((a) => ({
        id:
          typeof a.id === 'number' || typeof a.id === 'string'
            ? a.id
            : undefined,
        fileName: (a.fileName ?? a.file_name) as string | undefined,
        fileUrl: (a.fileUrl ?? a.file_url) as string | undefined,
      }))
    : [];

  const documentsUrls = attachments
    .map((a) => a.fileUrl)
    .filter((u): u is string => Boolean(u?.trim()));

  return {
    id: Number(r.id),
    requesterId: Number(r.requesterId ?? r.requester_id ?? 0),
    requesterName: (r.requesterName ?? r.requester_name) as string | null,
    documentType: documentType === 'other' ? 'other' : 'check',
    title: (r.title as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    amount: coerceNumber(r.amount),
    documentDate: coerceString(r.documentDate ?? r.document_date) || null,
    checkNumber: (r.checkNumber ?? r.check_number) as string | null,
    partyName: (r.partyName ?? r.party_name) as string | null,
    status: String(r.status ?? 'pending').toLowerCase() as FinancialDocumentResponse['status'],
    financeConfirmedAt: (r.financeConfirmedAt ?? r.finance_confirmed_at) as string | null,
    workflowInstanceId:
      r.workflowInstanceId != null
        ? Number(r.workflowInstanceId)
        : r.workflow_instance_id != null
          ? Number(r.workflow_instance_id)
          : null,
    createdAt: coerceString(r.createdAt ?? r.created_at) || null,
    attachments,
    attachmentCount: Number(r.attachmentCount ?? r.attachment_count ?? attachments.length),
    documentsUrls,
  };
}

export function financialDocumentCreateToBody(input: FinancialDocumentCreateInput) {
  return {
    document_type: input.documentType,
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
    amount: input.amount != null && input.amount > 0 ? input.amount : null,
    document_date: input.documentDate?.trim() || null,
    check_number: input.checkNumber?.trim() || null,
    party_name: input.partyName?.trim() || null,
  };
}

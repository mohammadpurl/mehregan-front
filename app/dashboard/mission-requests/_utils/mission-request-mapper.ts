import type {
  MissionRequestCreateInput,
  MissionRequestResponse,
  MissionRequestStatus,
} from '../_types/mission-request.types';

export function normalizeMissionRequestFromApi(raw: unknown): MissionRequestResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    requesterId: Number(r.requester_id ?? r.requesterId ?? 0),
    requesterName: (r.requester_name ?? r.requesterName) as string | null | undefined,
    title: (r.title as string | null) ?? null,
    destination: String(r.destination ?? ''),
    reason: String(r.reason ?? ''),
    vehicle: String(r.vehicle ?? ''),
    status: String(r.status ?? 'PENDING') as MissionRequestStatus,
    reportText: (r.report_text ?? r.reportText) as string | null | undefined,
    reportedAt: (r.reported_at ?? r.reportedAt) as string | null | undefined,
    workflowInstanceId: (r.workflow_instance_id ?? r.workflowInstanceId) as number | null | undefined,
    attachmentCount: Number(r.attachment_count ?? r.attachmentCount ?? 0),
    createdAt: (r.created_at ?? r.createdAt) as string | null | undefined,
    updatedAt: (r.updated_at ?? r.updatedAt) as string | null | undefined,
  };
}

export function missionRequestCreateToBody(input: MissionRequestCreateInput) {
  return {
    title: input.title?.trim() || undefined,
    destination: input.destination,
    reason: input.reason,
    vehicle: input.vehicle,
  };
}

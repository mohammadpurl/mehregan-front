export type SlaItemStatus =
  | 'on_time'
  | 'late'
  | 'overdue'
  | 'in_progress'
  | 'without_deadline'
  | 'unknown';

export type SlaReportItem = {
  kind: 'workflow' | 'ad_hoc';
  refType: string;
  refLabel: string;
  instanceId?: number;
  taskId?: number;
  businessRefId?: number;
  stepId?: number | null;
  stepOrder?: number | null;
  stepStatus?: string | null;
  title: string;
  assigneeId?: number;
  assigneeName?: string | null;
  startedAt?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  durationMinutes?: number | null;
  status: SlaItemStatus;
  statusLabel: string;
  breached: boolean;
};

export type SlaReportAssigneeSummary = {
  userId: number;
  assigneeName?: string | null;
  total: number;
  onTime: number;
  late: number;
  overdue: number;
  inProgress: number;
  avgDurationMinutes?: number | null;
  complianceRatePercent?: number | null;
};

export type SlaReport = {
  period: { from: string | null; to: string | null };
  filters: {
    refType: string | null;
    assigneeId: number | null;
    kind: string;
  };
  summary: {
    total: number;
    onTime: number;
    late: number;
    overduePending: number;
    inProgress: number;
    withoutDeadline: number;
    unknown: number;
    complianceRatePercent: number;
    byAssignee: SlaReportAssigneeSummary[];
  };
  items: SlaReportItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
  generatedAt: string;
};

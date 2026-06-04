import type { MissionRequestStatus } from '../_types/mission-request.types';

const STATUS_LABELS: Record<MissionRequestStatus, string> = {
  PENDING: 'در انتظار تأیید',
  APPROVED: 'تأیید شده — در انتظار گزارش',
  REJECTED: 'رد شده',
  COMPLETED: 'انجام شده',
};

export function missionStatusLabel(status: string): string {
  return STATUS_LABELS[status as MissionRequestStatus] ?? status;
}

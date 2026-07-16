'use client';

import { useState } from 'react';
import type { MissionRequestResponse } from '../_types/mission-request.types';
import { WorkflowInboxSummaryHeader } from '@/app/dashboard/workflow/inbox/_components/workflow-inbox-summary-header';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { missionStatusLabel } from '../_utils/mission-request-labels';
import { CommentWithVoice } from '@/app/dashboard/ad-hoc-tasks/_components/comment-with-voice';
import { Button } from '@/app/components/ui/button';
import { submitMissionReportAction } from '@/app/_actions/mission-request-actions';
import { useToast } from '@/hooks/use-toast';
import { useSessionStore } from '@/app/_store/auth-store';
import { getNumericUserIdFromClientSession } from '@/app/dashboard/payment-request/_utils/payment-request-session';

type Props = {
  data: MissionRequestResponse;
  onUpdated?: (data: MissionRequestResponse) => void;
};

export function MissionRequestDetailPanel({ data, onUpdated }: Props) {
  const { toast } = useToast();
  const session = useSessionStore((s) => s.session);
  const myUserId = getNumericUserIdFromClientSession(session);
  const [reportText, setReportText] = useState(data.reportText ?? '');
  const [busy, setBusy] = useState(false);

  const canSubmitReport =
    data.status === 'APPROVED' &&
    myUserId > 0 &&
    data.requesterId === myUserId;

  const statusTone =
    data.status === 'COMPLETED'
      ? 'approved'
      : data.status === 'REJECTED'
        ? 'rejected'
        : 'pending';

  const onSubmitReport = async () => {
    if (!reportText.trim()) {
      toast({ title: 'متن گزارش الزامی است', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const res = await submitMissionReportAction(data.id, reportText.trim());
    setBusy(false);
    if (!res.success || !res.data) {
      toast({ title: 'خطا', description: res.error, variant: 'destructive' });
      return;
    }
    toast({
      title: 'گزارش ماموریت ثبت شد و برای تأیید مدیر و مدیرعامل ارسال شد',
    });
    onUpdated?.(res.data);
  };

  return (
    <div className="space-y-5">
      <WorkflowInboxSummaryHeader
        title={`درخواست ماموریت #${data.id}`}
        statusLabel={missionStatusLabel(data.status)}
        statusTone={statusTone}
        requesterName={data.requesterName}
        createdAt={data.createdAt}
        fields={[
          { label: 'محل ماموریت', value: data.destination },
          { label: 'وسیله نقلیه', value: data.vehicle },
          {
            label: 'دلیل ماموریت',
            value: data.reason || '—',
          },
          {
            label: 'تاریخ ثبت گزارش',
            value: data.reportedAt
              ? formatJalaliDate(data.reportedAt, { withTime: true, persianDigits: true })
              : '—',
          },
        ]}
      />

      {data.reportText && !canSubmitReport ? (
        <section className="rounded-xl border bg-muted/10 p-4">
          <h4 className="mb-2 text-sm font-bold">گزارش ماموریت</h4>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.reportText}</p>
        </section>
      ) : null}

      {canSubmitReport ? (
        <section className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
          <h4 className="mb-3 text-sm font-semibold text-primary">ثبت گزارش پس از اتمام ماموریت</h4>
          <p className="mb-3 text-xs text-muted-foreground">
            پس از ثبت، گزارش برای تأیید مدیر مستقیم و مدیرعامل ارسال می‌شود.
          </p>
          <div className="space-y-3">
            <CommentWithVoice
              label="گزارش ماموریت"
              value={reportText}
              onChange={setReportText}
              placeholder="شرح انجام ماموریت را بنویسید یا با میکروفون بگویید..."
              disabled={busy}
              rows={8}
            />
            <Button onClick={() => void onSubmitReport()} disabled={busy}>
              ثبت و ارسال برای تأیید
            </Button>
          </div>
        </section>
      ) : null}

      {data.status === 'REPORT_PENDING_APPROVAL' ? (
        <p className="text-sm text-muted-foreground">
          گزارش ثبت شده و منتظر تأیید مدیر مستقیم و مدیرعامل است.
        </p>
      ) : null}

      {data.status === 'APPROVED' && data.requesterId !== myUserId ? (
        <p className="text-sm text-muted-foreground">
          پس از اتمام ماموریت، درخواست‌کننده می‌تواند گزارش را ثبت کند.
        </p>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  getWorkflowApprovalHistoryAction,
  getWorkflowInstanceAction,
} from '@/app/_actions/workflow-runtime-actions';
import { WorkflowApprovalPlanTimeline } from '@/app/dashboard/workflow/inbox/_components/workflow-approval-plan';
import { RelatedRequestsPanel } from '@/app/dashboard/workflow/_components/related-requests-panel';
import { workflowRowDetailHref } from '@/app/dashboard/workflow/_utils/workflow-ref-links';
import type { WorkflowApprovalHistory } from '@/app/_types/workflow-approval-plan.types';
import type { WorkflowInstanceDetail } from '@/app/_types/workflow-runtime.types';
import type { WorkflowInstanceRow } from '@/app/_types/workflow.types';
import { getWorkflowInstanceStatusLabel } from '@/app/constants/workflow-instance-status-labels';
import { getRequestRefTypeLabel } from '@/app/constants/request-ref-type-labels';

function refDetailHref(row: Pick<WorkflowInstanceRow, 'ref_type' | 'ref_id' | 'id'>): string {
  return workflowRowDetailHref(row);
}

export default function WorkflowInstanceDetailPage() {
  const params = useParams();
  const instanceId = Number(params.id);
  const [loading, startTransition] = useTransition();
  const [instance, setInstance] = useState<WorkflowInstanceDetail | null>(null);
  const [history, setHistory] = useState<WorkflowApprovalHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(instanceId) || instanceId < 1) {
      setError('شناسه نامعتبر است');
      return;
    }
    startTransition(async () => {
      const [instRes, histRes] = await Promise.all([
        getWorkflowInstanceAction(instanceId),
        getWorkflowApprovalHistoryAction(instanceId),
      ]);
      if (!instRes.success) {
        setError(instRes.error || 'خطا در دریافت گردش‌کار');
        return;
      }
      setInstance(instRes.data);
      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
    });
  }, [instanceId]);

  const rowLike = instance
    ? {
        id: instance.id,
        ref_type: instance.ref_type,
        ref_id: instance.ref_id,
      }
    : null;

  return (
    <DashboardPageShell>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/workflow/tracking">بازگشت به پیگیری</Link>
        </Button>
        {instance ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/workflow/inbox?instanceId=${instance.id}`}>کارتابل</Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {instance ? `گردش‌کار #${instance.id}` : loading ? 'در حال بارگذاری…' : 'جزئیات گردش‌کار'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : instance ? (
            <>
              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">نوع:</span>{' '}
                  {getRequestRefTypeLabel(instance.ref_type)}
                </div>
                <div>
                  <span className="text-muted-foreground">وضعیت:</span>{' '}
                  {getWorkflowInstanceStatusLabel(instance.status)}
                </div>
                <div>
                  <span className="text-muted-foreground">مرجع:</span> #{instance.ref_id}
                </div>
              </div>
              {rowLike ? (
                <Button asChild>
                  <Link href={refDetailHref(rowLike as WorkflowInstanceRow)}>مشاهده درخواست مرتبط</Link>
                </Button>
              ) : null}
              <RelatedRequestsPanel instanceId={instanceId} />
              <WorkflowApprovalPlanTimeline
                history={history}
                loading={loading}
                error={history ? null : 'تاریخچه تأیید در دسترس نیست'}
              />
            </>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
          ) : null}
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}

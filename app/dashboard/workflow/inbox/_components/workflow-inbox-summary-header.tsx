'use client';

import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { userInitials } from './workflow-timeline-utils';

export type WorkflowSummaryField = {
  label: string;
  value: string;
};

type Props = {
  title: string;
  subtitle?: string | null;
  statusLabel?: string;
  statusTone?: 'pending' | 'approved' | 'rejected' | 'neutral';
  requesterName?: string | null;
  createdAt?: string | null;
  fields?: WorkflowSummaryField[];
  className?: string;
};

const statusStyles = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  rejected: 'bg-red-100 text-red-900 border-red-200',
  neutral: 'bg-muted text-muted-foreground border-border',
};

export function WorkflowInboxSummaryHeader({
  title,
  subtitle,
  statusLabel,
  statusTone = 'neutral',
  requesterName,
  createdAt,
  fields = [],
  className,
}: Props) {
  return (
    <div className={cn('rounded-xl border bg-gradient-to-b from-muted/40 to-background p-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 text-right">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {statusLabel ? (
          <span
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-medium',
              statusStyles[statusTone],
            )}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {requesterName != null ? (
          <div className="flex items-center gap-2 rounded-lg border bg-background/80 p-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs font-semibold">
                {userInitials(requesterName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-right">
              <p className="text-xs text-muted-foreground">درخواست‌کننده</p>
              <p className="truncate text-sm font-medium">{requesterName || '—'}</p>
            </div>
          </div>
        ) : null}

        {createdAt ? (
          <SummaryCell label="تاریخ ثبت" value={formatJalaliDate(createdAt, { withTime: true })} />
        ) : null}

        {fields.map((f) => (
          <SummaryCell key={f.label} label={f.label} value={f.value} />
        ))}
      </div>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/80 p-3 text-right">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

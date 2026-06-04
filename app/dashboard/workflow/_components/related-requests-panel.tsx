'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ExternalLink, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  getRelatedRequestsByInstanceAction,
  getRelatedRequestsByRefAction,
} from '@/app/_actions/related-requests-actions';
import type { RelatedRequestItem } from '@/app/_types/related-requests.types';
import { relatedItemDetailHref, relatedItemTrackingHref } from '@/app/dashboard/workflow/_utils/workflow-ref-links';
import { formatJalaliDate } from '@/app/utils/jalali-date';

type Props =
  | { instanceId: number; refType?: never; refId?: never }
  | { instanceId?: never; refType: string; refId: number };

function statusBadge(status: string | null | undefined) {
  if (!status) return null;
  const s = status.toLowerCase();
  const variant =
    s.includes('approv') || s === 'posted' || s === 'completed'
      ? 'default'
      : s.includes('reject') || s === 'cancelled'
        ? 'destructive'
        : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}

export function RelatedRequestsPanel(props: Props) {
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<RelatedRequestItem[]>([]);
  const [anchorLabel, setAnchorLabel] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      const res =
        'instanceId' in props && props.instanceId
          ? await getRelatedRequestsByInstanceAction(props.instanceId)
          : await getRelatedRequestsByRefAction(props.refType!, props.refId!);

      if (!res.success || !res.data) {
        setItems([]);
        setError(res.error || 'اطلاعاتی یافت نشد');
        return;
      }
      setAnchorLabel(res.data.anchor.label);
      setItems(res.data.items ?? []);
    });
  }, [props]);

  if (loading && items.length === 0 && !error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" />
            درخواست‌های مرتبط
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
        </CardContent>
      </Card>
    );
  }

  if (error || items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" />
          درخواست‌های مرتبط
          {anchorLabel ? (
            <span className="text-sm font-normal text-muted-foreground">({anchorLabel})</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={`${item.refType}-${item.refId}-${item.relation ?? 'x'}`}
              className={`rounded-lg border p-3 text-sm ${item.isAnchor ? 'border-primary/40 bg-primary/5' : 'bg-muted/20'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.title}</span>
                    {item.isAnchor ? <Badge variant="outline">جاری</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {statusBadge(item.status)}
                    {item.workflowStatus ? (
                      <Badge variant="outline">گردش‌کار: {item.workflowStatus}</Badge>
                    ) : null}
                  </div>
                  {item.createdAt ? (
                    <p className="text-xs text-muted-foreground">
                      {formatJalaliDate(item.createdAt)}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={relatedItemDetailHref(item)}>
                      <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      جزئیات
                    </Link>
                  </Button>
                  {item.workflowInstanceId ? (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={relatedItemTrackingHref(item)}>پیگیری گردش‌کار</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

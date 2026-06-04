'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { getExecutiveFinancialReportAction } from '@/app/_actions/dashboard-actions';
import type { ExecutiveFinancialReport } from '@/app/_actions/dashboard-actions';
import { formatAmount } from '@/app/utils/number-format';
import { DollarSign, Wallet, Workflow } from 'lucide-react';

export default function ExecutiveFinancialReportPage() {
  const [data, setData] = useState<ExecutiveFinancialReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getExecutiveFinancialReportAction();
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error || 'خطا در دریافت گزارش');
      }
    });
  }, []);

  return (
    <DashboardPageShell>
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">بازگشت به داشبورد</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            گزارش مالی اجرایی
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : data ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">درخواست‌های پرداخت</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>در انتظار: {data.payment_requests.pending_count}</p>
                  <p>تأییدشده: {data.payment_requests.approved_count}</p>
                  <p>ردشده: {data.payment_requests.rejected_count}</p>
                  <p className="font-medium">جمع مبالغ: {formatAmount(data.payment_requests.total_amount)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wallet className="h-4 w-4" />
                    تنخواه
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>در انتظار: {data.petty_cash.pending_count}</p>
                  <p>تأییدشده: {data.petty_cash.approved_count}</p>
                  <p>منتظر تسویه: {data.petty_cash.awaiting_settlement_count}</p>
                  <p className="font-medium">جمع: {formatAmount(data.petty_cash.total_amount)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Workflow className="h-4 w-4" />
                    گردش کار مالی
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>همه در انتظار: {data.workflow.all_pending_instances}</p>
                  <p>مالی در انتظار: {data.workflow.financial_pending_instances}</p>
                  <p>مراحل مالی در صف: {data.workflow.financial_pending_steps}</p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}

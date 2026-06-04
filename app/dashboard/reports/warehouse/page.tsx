'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { getWarehouseDailyReportAction } from '@/app/_actions/dashboard-actions';
import type { WarehouseDailyReport } from '@/app/_actions/dashboard-actions';
import { Package, AlertTriangle } from 'lucide-react';

export default function WarehouseDailyReportPage() {
  const [data, setData] = useState<WarehouseDailyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getWarehouseDailyReportAction();
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
            <Package className="h-5 w-5" />
            گزارش روزانه انبار
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && !data ? (
            <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : data ? (
            <>
              <div className="grid gap-4 md:grid-cols-4 text-sm">
                <div>
                  <span className="text-muted-foreground">تاریخ:</span> {data.date}
                </div>
                <div>
                  <span className="text-muted-foreground">انبارها:</span> {data.warehouses_count}
                </div>
                <div>
                  <span className="text-muted-foreground">خطوط موجودی:</span> {data.stock_lines_count}
                </div>
                <div>
                  <span className="text-muted-foreground">تراکنش امروز:</span>{' '}
                  {data.transactions_today.total}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">رسید انبار (GRN)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>ایجاد امروز: {data.grn.created_today}</p>
                    <p>ثبت نهایی امروز: {data.grn.posted_today}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      موجودی کم ({data.low_stock_count})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.low_stock.length === 0 ? (
                      <p className="text-sm text-muted-foreground">موردی نیست</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {data.low_stock.slice(0, 10).map((row, i) => (
                          <li key={`${row.sku}-${i}`}>
                            {row.item_name} — {row.warehouse_name}: {row.quantity}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}

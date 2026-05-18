'use client';

import Link from 'next/link';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ShoppingCart } from 'lucide-react';

/**
 * مسیر ایجاد PR قبلاً به فرم قدیمی اشاره می‌کرد.
 * تا اتصال کامل فرم چندمرحله‌ای با API، از لیست داشبورد برای ثبت/پیگیری استفاده کنید.
 */
export default function NewProductRequestPage() {
  return (
    <DashboardPageShell variant="narrow" className="py-8 sm:py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>ایجاد درخواست کالا</CardTitle>
              <CardDescription>
                ثبت درخواست از طریق لیست درخواست‌های کالا در داشبورد انجام می‌شود.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/dashboard/product-request">برو به لیست درخواست‌های کالا</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">بازگشت به داشبورد</Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}

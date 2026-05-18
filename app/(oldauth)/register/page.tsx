'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Scale } from 'lucide-react';

/**
 * ثبت‌نام از طریق API اختصاصی سازمان انجام می‌شود.
 * برای ورود از صفحهٔ لاگین استفاده کنید.
 */
export default function RegisterPage() {
  return (
    <div className="flex h-dvh items-center justify-center overflow-y-auto p-4 bg-linear-to-br from-background via-background to-muted/20">
      <Card className="w-full max-w-md border-none">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
            <Scale className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">ثبت‌نام</CardTitle>
          <CardDescription>
            ایجاد حساب از مسیر سازمانی شما انجام می‌شود. اگر حساب دارید، وارد شوید.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/login">رفتن به صفحهٔ ورود</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

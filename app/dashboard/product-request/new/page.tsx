'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** مسیر قدیمی — ثبت درخواست خرید اکنون در مودال لیست تدارکات است */
export default function ProductRequestNewRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/procurement/requests?create=1');
  }, [router]);

  return (
    <p className="p-6 text-sm text-muted-foreground">در حال انتقال به فرم ثبت درخواست خرید…</p>
  );
}

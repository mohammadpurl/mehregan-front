import { redirect } from 'next/navigation';

/** ثبت دستی فرم گردش‌کار (گیرنده ثابت) — جایگزین: ماژول درخواست‌های مالی */
export default function NewWorkflowRedirectPage() {
  redirect('/dashboard/payment-request');
}

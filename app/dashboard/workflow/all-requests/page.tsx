import { redirect } from 'next/navigation';

/** همه درخواست‌های workflow_form قدیمی — جایگزین: پیگیری */
export default function WorkflowAllRequestsRedirectPage() {
  redirect('/dashboard/workflow/tracking');
}

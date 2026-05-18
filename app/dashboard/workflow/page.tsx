import { redirect } from 'next/navigation';

/** لیست قدیمی فرم‌های گردش‌کار — جایگزین: کارتابل و درخواست‌های مالی */
export default function WorkflowListRedirectPage() {
  redirect('/dashboard/workflow/inbox');
}

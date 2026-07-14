import { redirect } from "next/navigation";

/** ثبت‌نام عمومی وجود ندارد — کاربران فقط توسط ادمین/اسکریپت ساخته می‌شوند. */
export default function RegisterPage() {
  redirect("/login");
}

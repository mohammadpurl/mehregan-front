import { PaymentRequestsList } from '../_components/payment-requests-list';

export default function ProcurementPaymentsPage() {
  return (
    <PaymentRequestsList
      fixedPaymentType="procurement"
      title="پرداخت‌های خرید"
      subtitle="درخواست‌های پرداخت ثبت‌شده از فرایند تدارکات — تأیید در کارتابل مالی"
      showCreateButton={false}
    />
  );
}

import { getUsersAction } from '@/app/_actions/user-actions';
import type { AdminUser } from '@/app/_types/user.types';
import type {
  PaymentAccount,
  PaymentRequestRequesterInfo,
  PaymentRequestResponse,
} from '../_types/payment-request.types';
import { isPlaceholderPaymentAccount } from './payment-request-display.utils';
function adminUserDisplayName(user: AdminUser): string {
  const full = user.full_name?.trim();
  if (full) return full;
  const parts = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return user.username?.trim() || `کاربر #${user.id}`;
}

function userToRequesterInfo(user: AdminUser): PaymentRequestRequesterInfo {
  const shebaRaw = user.sheba_number?.trim() ?? '';
  const sheba = shebaRaw
    ? shebaRaw.toUpperCase().startsWith('IR')
      ? shebaRaw
      : `IR${shebaRaw}`
    : '';
  return {
    displayName: adminUserDisplayName(user),
    username: user.username || undefined,
    email: user.email || undefined,
    phone: user.phone || undefined,
    departmentName: user.department_name || undefined,
    managerName: user.manager_name || undefined,
    shebaNumber: sheba || undefined,
    cardNumber: user.card_number?.trim() || undefined,
  };
}

function receiverFromRequesterInfo(
  info: PaymentRequestRequesterInfo,
  current: PaymentAccount,
): PaymentAccount {
  const name = info.displayName;
  const num = info.shebaNumber || info.cardNumber || '';
  if (!num) return current;
  return { name, accountNumber: num };
}

/** تکمیل نام و حساب واریز از پروفایل کاربر وقتی API درخواست مالی فیلدها را خالی برگرداند */
export async function enrichPaymentRequestForApprover(
  record: PaymentRequestResponse,
): Promise<PaymentRequestResponse> {
  const requesterIdNum = Number(record.requesterId);
  if (!Number.isFinite(requesterIdNum) || requesterIdNum < 1) {
    return record;
  }

  const needsName = !record.requesterName?.trim() || record.requesterName === '—';
  const needsReceiver = isPlaceholderPaymentAccount(record.receiver);
  const needsInfo = !record.requesterInfo;

  if (!needsName && !needsReceiver && !needsInfo) {
    return record;
  }

  const usersRes = await getUsersAction({ id: requesterIdNum, pageSize: 1 });
  if (!usersRes.success || !usersRes.data?.items?.[0]) {
    return record;
  }

  const user = usersRes.data.items[0];
  const requesterInfo = userToRequesterInfo(user);
  const requesterName = needsName ? requesterInfo.displayName : record.requesterName;
  const receiver = needsReceiver ? receiverFromRequesterInfo(requesterInfo, record.receiver) : record.receiver;

  let receiverAccountDetail = record.receiverAccountDetail;
  if (needsReceiver && (requesterInfo.shebaNumber || requesterInfo.cardNumber)) {
    receiverAccountDetail = {
      label: requesterInfo.displayName,
      bankName: null,
      accountNumber: null,
      shebaNumber: requesterInfo.shebaNumber ?? null,
      cardNumber: requesterInfo.cardNumber ?? null,
    };
  }

  return {
    ...record,
    requesterName,
    requesterInfo,
    receiver,
    receiverAccountDetail,
  };
}

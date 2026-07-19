import { getUsersAction } from '@/app/_actions/user-actions';
import type { AdminUser } from '@/app/_types/user.types';
import type { PaymentRequestRequesterInfo } from '@/app/dashboard/payment-request/_types/payment-request.types';
import type { PettyCashResponse } from '../_types/petty-cash.types';

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

/** تکمیل حساب مقصد تنخواه از پروفایل درخواست‌کننده برای نمایش در تأیید */
export async function enrichPettyCashForApprover(
  record: PettyCashResponse,
): Promise<PettyCashResponse> {
  const requesterIdNum = Number(record.requesterId);
  if (!Number.isFinite(requesterIdNum) || requesterIdNum < 1) {
    return record;
  }

  const needsName = !record.requesterName?.trim() || record.requesterName === '—';
  const needsInfo =
    !record.requesterInfo ||
    (!record.requesterInfo.shebaNumber && !record.requesterInfo.cardNumber);

  if (!needsName && !needsInfo) {
    return record;
  }

  const usersRes = await getUsersAction({ id: requesterIdNum, pageSize: 1 });
  if (!usersRes.success || !usersRes.data?.items?.[0]) {
    return record;
  }

  const requesterInfo = userToRequesterInfo(usersRes.data.items[0]);
  return {
    ...record,
    requesterName: needsName ? requesterInfo.displayName : record.requesterName,
    requesterInfo: record.requesterInfo
      ? {
          ...record.requesterInfo,
          ...requesterInfo,
          shebaNumber: record.requesterInfo.shebaNumber || requesterInfo.shebaNumber,
          cardNumber: record.requesterInfo.cardNumber || requesterInfo.cardNumber,
        }
      : requesterInfo,
  };
}

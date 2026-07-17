'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import {
  PaymentRequestType,
  type PaymentRequestResponse,
} from '../_types/payment-request.types';
import { paymentTypeLabel } from '../_utils/payment-type-labels';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { formatAmount } from '@/app/utils/number-format';

const statusLabels: Record<string, string> = {
  pending: 'در انتظار',
  approved: 'تایید شده',
  rejected: 'رد شده',
  paid: 'پرداخت شده',
};

const statusClass: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-blue-100 text-blue-800',
};

function partyCell(row: PaymentRequestResponse): string {
  if (
    row.type === PaymentRequestType.LOAN ||
    row.type === PaymentRequestType.ADVANCE
  ) {
    // وام/مساعده: طرف حساب = خود درخواست‌کننده
    return row.requesterName && row.requesterName !== '—'
      ? row.requesterName
      : 'خود درخواست‌کننده';
  }
  if (row.type === PaymentRequestType.PAYMENT_ORDER) {
    const name =
      row.counterparty?.name?.trim() ||
      (row.receiver?.name && row.receiver.name !== row.receiver.accountNumber
        ? row.receiver.name.trim()
        : '') ||
      '';
    const account =
      row.receiver?.accountNumber?.trim() ||
      row.receiverAccountDetail?.accountNumber?.trim() ||
      row.receiverAccountDetail?.shebaNumber?.trim() ||
      '';
    if (name && account) return `${name} — ${account}`;
    if (name) return name;
    if (account) return account;
    return '—';
  }
  return row.counterparty?.name ?? '—';
}

type Handlers = {
  onEdit: (row: PaymentRequestResponse) => void;
  onDelete: (id: string) => void;
  deletePending?: boolean;
  canEdit?: (row: PaymentRequestResponse) => boolean;
};

export function getPaymentRequestsTableColumns({
  onEdit,
  onDelete,
  deletePending,
  canEdit,
}: Handlers): ColumnDef<PaymentRequestResponse>[] {
  return [
    {
      accessorKey: 'id',
      header: 'شناسه',
      cell: ({ row }) => row.original.id,
    },
    {
      id: 'requester',
      header: 'درخواست‌کننده',
      cell: ({ row }) =>
        row.original.requesterName && row.original.requesterName !== '—'
          ? row.original.requesterName
          : '—',
    },
    {
      accessorKey: 'type',
      header: 'نوع',
      cell: ({ row }) => paymentTypeLabel(row.original.type),
    },
    {
      id: 'counterparty',
      header: 'طرف‌حساب / مقصد',
      cell: ({ row }) => partyCell(row.original),
    },
    {
      accessorKey: 'amount',
      header: 'مبلغ',
      cell: ({ row }) => formatAmount(row.original.amount, { unit: 'ریال' }),
    },
    {
      id: 'createdAt',
      header: 'تاریخ ثبت',
      cell: ({ row }) =>
        formatJalaliDate(row.original.createdAt ?? row.original.paymentDate, {
          withTime: Boolean(row.original.createdAt),
        }),
    },
    {
      accessorKey: 'paymentDate',
      header: 'تاریخ پرداخت',
      cell: ({ row }) => formatJalaliDate(row.original.paymentDate),
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => (
        <Badge className={statusClass[row.original.status] ?? ''}>
          {statusLabels[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      id: 'attachments',
      header: 'پیوست',
      cell: ({ row }) => row.original.attachmentCount ?? row.original.documentsUrls?.length ?? 0,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const editable = canEdit ? canEdit(row.original) : true;
        return (
          <div className="flex gap-1 justify-end">
            {editable && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              disabled={deletePending}
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}

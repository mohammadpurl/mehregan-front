'use client';

import type { FinancialDocumentResponse } from '../_types/financial-document.types';
import {
  financialDocumentStatusLabel,
  financialDocumentTypeLabel,
} from '../_utils/financial-document-labels';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';
import { RequestAttachmentsPanel } from '@/app/components/attachments/request-attachments-panel';
import { SepidarRegistrationStatus } from '@/app/dashboard/workflow/_components/sepidar-registration-status';

type Props = {
  record: FinancialDocumentResponse;
};

export function FinancialDocumentDetailPanel({ record }: Props) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-2 md:grid-cols-2">
        <p>
          <span className="text-muted-foreground">نوع: </span>
          {financialDocumentTypeLabel(record.documentType)}
        </p>
        <p>
          <span className="text-muted-foreground">وضعیت: </span>
          {financialDocumentStatusLabel(record.status)}
        </p>
        <p>
          <span className="text-muted-foreground">ثبت‌کننده: </span>
          {record.requesterName || '—'}
        </p>
        {record.amount != null && record.amount > 0 && (
          <p>
            <span className="text-muted-foreground">مبلغ: </span>
            {formatAmount(record.amount, { unit: 'ریال' })}
          </p>
        )}
        {record.documentDate && (
          <p>
            <span className="text-muted-foreground">تاریخ سند: </span>
            {formatJalaliDate(record.documentDate)}
          </p>
        )}
        {record.checkNumber && (
          <p>
            <span className="text-muted-foreground">شماره چک: </span>
            {record.checkNumber}
          </p>
        )}
        {record.partyName && (
          <p>
            <span className="text-muted-foreground">طرف / صادرکننده: </span>
            {record.partyName}
          </p>
        )}
      </div>
      {record.title && (
        <p>
          <span className="text-muted-foreground">عنوان: </span>
          {record.title}
        </p>
      )}
      {record.description && (
        <p>
          <span className="text-muted-foreground">شرح: </span>
          {record.description}
        </p>
      )}
      <SepidarRegistrationStatus
        registeredAt={record.sepidarRegisteredAt}
        confirmedAt={record.sepidarConfirmedAt}
      />

      <RequestAttachmentsPanel
        title="تصاویر / پیوست‌های سند"
        documentsUrls={record.documentsUrls}
        attachments={record.attachments}
      />
    </div>
  );
}

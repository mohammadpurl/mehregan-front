'use client';

import type { PettyCashExpenseLine } from '../_types/petty-cash.types';
import { formatAmount } from '@/app/utils/number-format';
import { formatJalaliDate } from '@/app/utils/jalali-date';

type Props = {
  lines: PettyCashExpenseLine[];
  emptyMessage?: string;
};

export function PettyCashExpenseLinesTable({
  lines,
  emptyMessage = 'هنوز اقلام خرج ثبت نشده است.',
}: Props) {
  if (!lines.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-right">
            <th className="p-2 w-12">#</th>
            <th className="p-2">شرح</th>
            <th className="p-2">مبلغ (ریال)</th>
            <th className="p-2">تاریخ هزینه</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={line.id ?? i} className="border-b">
              <td className="p-2 text-muted-foreground">{i + 1}</td>
              <td className="p-2">{line.description}</td>
              <td className="p-2 whitespace-nowrap">{formatAmount(line.amount, { unit: 'ریال' })}</td>
              <td className="p-2">{line.date ? formatJalaliDate(line.date) : '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/20 font-medium">
            <td colSpan={2} className="p-2 text-left">
              جمع
            </td>
            <td className="p-2" colSpan={2}>
              {formatAmount(
                lines.reduce((s, l) => s + (Number(l.amount) || 0), 0),
                { unit: 'ریال' },
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

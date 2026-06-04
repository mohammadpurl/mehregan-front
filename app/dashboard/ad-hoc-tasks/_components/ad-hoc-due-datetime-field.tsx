'use client';

import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { JalaliDatePicker } from '@/app/components/ui/jalali-date-input';

type Props = {
  date: string;
  time: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  disabled?: boolean;
  label?: string;
};

export function AdHocDueDatetimeField({
  date,
  time,
  onDateChange,
  onTimeChange,
  disabled,
  label = 'مهلت انجام کار',
}: Props) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <JalaliDatePicker
          value={date}
          onChange={onDateChange}
          disabled={disabled}
          placeholder="تاریخ مهلت"
        />
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          disabled={disabled}
          dir="ltr"
          className="text-left"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        در صورت عدم انجام تا این زمان، به گیرنده و مدیرعامل اعلان ارسال می‌شود.
      </p>
    </div>
  );
}

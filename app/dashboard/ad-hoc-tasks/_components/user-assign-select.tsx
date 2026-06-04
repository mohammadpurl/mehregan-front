'use client';

import { useEffect, useState } from 'react';
import { lookupUsersForAssignAction } from '@/app/_actions/ad-hoc-task-actions';
import type { UserLookupItem } from '@/app/_types/ad-hoc-task.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

type Props = {
  value: string;
  onValueChange: (userId: string) => void;
  label?: string;
  disabled?: boolean;
};

export function UserAssignSelect({ value, onValueChange, label = 'گیرنده', disabled }: Props) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserLookupItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await lookupUsersForAssignAction(search);
      if (!cancelled) {
        setUsers(res.success ? res.data : []);
        setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        placeholder="جستجوی نام یا نام کاربری..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={disabled}
      />
      <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'در حال بارگذاری...' : 'انتخاب کاربر'} />
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={String(u.id)}>
              {u.fullName ? `${u.fullName} (${u.username})` : u.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

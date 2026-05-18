'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdvancedModal } from '@/app/components/Modal';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { getUsersAction } from '@/app/_actions/user-actions';
import type { AdminUser } from '@/app/_types/user.types';
import type { DepartmentTreeNode } from '@/app/_types/department.types';
import { collectDescendantIds, flattenDepartmentTree } from '@/app/_utils/department-mapper';
import { Loader2 } from 'lucide-react';

export type DepartmentFormValues = {
  name: string;
  parentId: number | null;
  headUserId: number | null;
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  tree: DepartmentTreeNode[];
  editingId?: number | null;
  fixedParentId?: number | null;
  initial?: Partial<DepartmentFormValues>;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DepartmentFormValues) => void;
};

const NONE = '__none__';

function userLabel(u: AdminUser): string {
  const name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return name ? `${name} (${u.username})` : u.username;
}

export function DepartmentFormDialog({
  open,
  mode,
  tree,
  editingId,
  fixedParentId,
  initial,
  saving,
  onOpenChange,
  onSubmit,
}: Props) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [headUserId, setHeadUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setParentId(
      fixedParentId !== undefined ? fixedParentId : (initial?.parentId ?? null),
    );
    setHeadUserId(initial?.headUserId ?? null);
  }, [open, initial?.name, initial?.parentId, initial?.headUserId, fixedParentId]);

  useEffect(() => {
    if (!open) return;
    setLoadingUsers(true);
    void getUsersAction({ page: 1, pageSize: 100 }).then((res) => {
      if (res.success && res.data?.items) setUsers(res.data.items);
      setLoadingUsers(false);
    });
  }, [open]);

  const parentOptions = useMemo(() => {
    const flat = flattenDepartmentTree(tree);
    if (mode !== 'edit' || !editingId) return flat;

    const self = flat.find((d) => d.id === editingId);
    if (!self) return flat.filter((d) => d.id !== editingId);

    const blocked = new Set<number>([editingId, ...collectDescendantIds(self)]);
    return flat.filter((d) => !blocked.has(d.id));
  }, [tree, mode, editingId]);

  const parentLocked = fixedParentId !== undefined;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, parentId, headUserId });
  };

  const title =
    mode === 'create'
      ? parentLocked && parentId
        ? 'افزودن زیرواحد'
        : 'افزودن واحد سازمانی'
      : 'ویرایش واحد سازمانی';

  return (
    <AdvancedModal open={open} onOpenChange={onOpenChange} title={title}>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="dept-name">نام واحد</Label>
          <Input
            id="dept-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: واحد مالی"
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label>واحد والد</Label>
          <Select
            value={parentId == null ? NONE : String(parentId)}
            onValueChange={(v) => setParentId(v === NONE ? null : Number(v))}
            disabled={saving || parentLocked}
          >
            <SelectTrigger>
              <SelectValue placeholder="بدون والد (ریشه)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>بدون والد (ریشه)</SelectItem>
              {parentOptions.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {parentLocked && parentId != null && (
            <p className="text-xs text-muted-foreground">
              زیرمجموعهٔ واحد انتخاب‌شده در درخت ایجاد می‌شود.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>مسئول واحد (head)</Label>
          <Select
            value={headUserId == null ? NONE : String(headUserId)}
            onValueChange={(v) => setHeadUserId(v === NONE ? null : Number(v))}
            disabled={saving || loadingUsers}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingUsers ? 'در حال بارگذاری...' : 'بدون مسئول'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>بدون مسئول</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {userLabel(u)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            در workflow با استراتژی «مسئول واحد سازمانی» از این کاربر استفاده می‌شود.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            انصراف
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'ایجاد' : 'ذخیره'}
          </Button>
        </div>
      </div>
    </AdvancedModal>
  );
}

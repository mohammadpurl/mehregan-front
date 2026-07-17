'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  ArrowDown,
  Building2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  UserCheck,
  Users,
  Loader2,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { getAllRolesAction } from '@/app/_actions/role-actions';
import { getUsersAction } from '@/app/_actions/user-actions';
import { getProfileAction } from '@/app/_actions/profile-actions';
import { getWorkflowAssigneesPreviewAction } from '@/app/_actions/workflow-definition-actions';
import type { ProfileDto } from '@/app/_types/profile.types';
import { roleLabel, type Role } from '@/app/_types/role.types';
import type { AdminUser } from '@/app/_types/user.types';
import type {
  AssigneeStrategy,
  WorkflowAssigneePreview,
  WorkflowStepConfig,
} from '@/app/_types/workflow-definition.types';
import type { WorkflowBusinessRefType } from '@/app/_types/workflow-runtime.types';
import { createEmptyStep, canonicalizeAliasesAgainstRoles, scrubStepsRoleAliases } from '../_utils/workflow-definition-mapper';
import { cn } from '@/lib/utils';

const STEP_ACTION_OPTIONS: { value: string; label: string; description: string }[] = [
  {
    value: 'approval',
    label: 'تأیید عادی',
    description: 'دکمه تأیید معمول در کارتابل',
  },
  {
    value: 'mark_payment',
    label: 'ثبت در سپیدار (کارشناس مالی)',
    description: 'پس از ثبت بیرونی در سپیدار، دکمه «ثبت در سپیدار انجام شد»',
  },
  {
    value: 'confirm_sepidar',
    label: 'تأیید ثبت سپیدار (سرپرست مالی)',
    description: 'چک‌باکس اجباری «در سپیدار ثبت شده» + تأیید',
  },
];

const STRATEGY_OPTIONS: {
  value: AssigneeStrategy;
  label: string;
  description: string;
  icon: typeof Users;
}[] = [
  {
    value: 'role_pool',
    label: 'انتخاب از نقش',
    description: 'یکی از کاربران فعال که حداقل یکی از نقش‌های انتخاب‌شده را دارد',
    icon: Users,
  },
  {
    value: 'fixed_user',
    label: 'شخص مشخص (با همان نقش)',
    description: 'کاربر ثابت؛ باید یکی از نقش‌های انتخاب‌شده را داشته باشد',
    icon: UserCheck,
  },
  {
    value: 'submitter_manager',
    label: 'مدیر مستقیم ثبت‌کننده',
    description: 'بر اساس فیلد «مدیر مستقیم» کاربر درخواست‌دهنده در مدیریت کاربران',
    icon: UserCheck,
  },
  {
    value: 'department_head',
    label: 'مسئول واحد',
    description: 'بر اساس واحد سازمانی ثبت‌کننده و «مسئول واحد» در ساختار سازمانی',
    icon: Building2,
  },
];

type Props = {
  refType: WorkflowBusinessRefType;
  steps: WorkflowStepConfig[];
  onChange: (steps: WorkflowStepConfig[]) => void;
  disabled?: boolean;
};

function userLabel(u: AdminUser): string {
  const name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return name ? `${name} (${u.username})` : u.username;
}

export function WorkflowStepsBuilder({ refType, steps, onChange, disabled }: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentProfile, setCurrentProfile] = useState<ProfileDto | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  /** خالی = خود کاربر جاری؛ در غیر این صورت شناسه کاربر انتخاب‌شده از لیست */
  const [previewAsUserId, setPreviewAsUserId] = useState('');
  const [preview, setPreview] = useState<WorkflowAssigneePreview[] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      setProfileLoading(true);
      const [rolesRes, usersRes, profileRes] = await Promise.all([
        getAllRolesAction(),
        getUsersAction({ page: 1, pageSize: 100 }),
        getProfileAction(),
      ]);
      if (rolesRes.success && rolesRes.data?.items) {
        const loaded = rolesRes.data.items;
        setRoles(loaded);
        // حذف aliasهای فارسی/تکراری تا فقط role.name در فرم بماند
        onChange(scrubStepsRoleAliases(steps, loaded));
      }
      if (usersRes.success && usersRes.data?.items) setUsers(usersRes.data.items);
      if (profileRes.success && profileRes.data) setCurrentProfile(profileRes.data);
      setProfileLoading(false);
    })();
    // فقط یک‌بار هنگام باز شدن فرم
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStep = useCallback(
    (index: number, patch: Partial<WorkflowStepConfig>) => {
      const next = steps.map((s, i) => (i === index ? { ...s, ...patch, order: i + 1 } : { ...s, order: i + 1 }));
      onChange(next);
    },
    [steps, onChange],
  );

  const addStep = () => {
    onChange([...steps, createEmptyStep(steps.length + 1)]);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const moveStep = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const toggleRoleAlias = (index: number, roleName: string) => {
    const step = steps[index];
    const current = canonicalizeAliasesAgainstRoles(step.role_aliases, roles);
    const has = current.includes(roleName);
    const role_aliases = has
      ? current.filter((a) => a !== roleName)
      : [...current, roleName];
    updateStep(index, { role_aliases });
  };

  const previewSubmitterLabel = useCallback(() => {
    if (previewAsUserId) {
      const u = users.find((x) => String(x.id) === previewAsUserId);
      return u ? userLabel(u) : `کاربر #${previewAsUserId}`;
    }
    if (currentProfile) {
      const name =
        currentProfile.full_name?.trim() ||
        [currentProfile.first_name, currentProfile.last_name].filter(Boolean).join(' ').trim();
      return name ? `${name} (${currentProfile.username})` : currentProfile.username;
    }
    return null;
  }, [previewAsUserId, users, currentProfile]);

  const runPreview = () => {
    const rawId = previewAsUserId ? Number(previewAsUserId) : currentProfile?.id;
    if (rawId === undefined || !Number.isFinite(rawId) || rawId < 1) {
      setPreviewError(
        profileLoading
          ? 'در حال بارگذاری حساب شما…'
          : 'حساب کاربری شما شناسایی نشد. یک‌بار از سیستم خارج و دوباره وارد شوید.',
      );
      setPreview(null);
      return;
    }
    const submitterId = rawId;
    setPreviewError(null);
    startTransition(async () => {
      const res = await getWorkflowAssigneesPreviewAction(refType, submitterId, steps);
      if (res.success && res.data) {
        setPreview(res.data);
      } else {
        setPreview(null);
        setPreviewError(res.error ?? 'پیش‌نمایش ناموفق بود');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">چگونه بخوانید؟</p>
        <p>
          جریان از بالا به پایین است: ابتدا «ثبت درخواست»، سپس مرحلهٔ ۱، ۲، … — هر کارت یک مرحلهٔ تأیید است.
          ترتیب را با دکمه‌های بالا/پایین هر کارت عوض کنید.
        </p>
        <p>
          <span className="font-medium text-foreground">نقش (Role)</span> تعیین می‌کند چه کسی حق تأیید دارد؛{' '}
          <span className="font-medium text-foreground">مجوز (Permission)</span> فقط دسترسی به منو و تنظیمات است.
        </p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>
            <span className="font-medium">نقش‌های مجاز:</span> تأییدکننده باید حداقل یکی از نقش‌های انتخاب‌شده را در
            بخش کاربران داشته باشد.
          </li>
          <li>
            <span className="font-medium">چند نقش:</span> یعنی «یکی از این نقش‌ها» (OR) — مثلاً حسابدار یا مدیر مالی.
          </li>
          <li>
            <span className="font-medium">نقش تک‌نفره:</span> مثل مدیرعامل — فقط یک کاربر در سیستم می‌تواند آن نقش را
            داشته باشد.
          </li>
        </ul>
      </div>

      <div className="relative mx-auto max-w-2xl space-y-0">
        <div className="flex justify-center">
          <div className="rounded-full border-2 border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            شروع — ثبت درخواست
          </div>
        </div>

        {steps.map((step, index) => {
          const strategyMeta = STRATEGY_OPTIONS.find((o) => o.value === step.assignee_strategy);
          const StrategyIcon = strategyMeta?.icon ?? Users;

          return (
            <div key={`step-${index}`} className="relative">
              <div className="flex justify-center py-2 text-muted-foreground">
                <ArrowDown className="h-5 w-5" />
              </div>

              <div
                className={cn(
                  'rounded-xl border-2 bg-card p-4 shadow-sm transition-colors',
                  index === 0 ? 'border-primary/30' : 'border-border',
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">مرحله تأیید {index + 1}</p>
                      <p className="text-xs text-muted-foreground">{strategyMeta?.description}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={disabled || index === 0}
                      onClick={() => moveStep(index, -1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={disabled || index === steps.length - 1}
                      onClick={() => moveStep(index, 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      disabled={disabled || steps.length <= 1}
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">عنوان مرحله (اختیاری)</label>
                    <Input
                      value={step.label ?? ''}
                      onChange={(e) => updateStep(index, { label: e.target.value })}
                      placeholder="مثلاً تأیید مدیر مالی"
                      disabled={disabled}
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">نوع اقدام مرحله</label>
                    <Select
                      value={step.step_action?.trim() || 'approval'}
                      onValueChange={(v) => updateStep(index, { step_action: v })}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STEP_ACTION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      {
                        STEP_ACTION_OPTIONS.find(
                          (o) => o.value === (step.step_action?.trim() || 'approval'),
                        )?.description
                      }
                    </p>
                  </div>

                  <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <label className="text-xs font-medium">نقش‌های مجاز این مرحله *</label>
                    <p className="text-[11px] text-muted-foreground">
                      یک یا چند نقش انتخاب کنید. تأییدکننده باید کاربر فعالی باشد که حداقل یکی از این نقش‌ها را دارد.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {roles.map((role) => {
                        const selected = canonicalizeAliasesAgainstRoles(
                          step.role_aliases,
                          roles,
                        ).includes(role.name);
                        return (
                          <button
                            key={role.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleRoleAlias(index, role.name)}
                            className={cn(
                              'rounded-md border px-2.5 py-1.5 text-xs transition-colors',
                              selected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background hover:bg-accent',
                            )}
                            title={role.name}
                          >
                            {roleLabel(role)}
                            {role.isSingleton ? (
                              <span className="mr-1 opacity-80"> (تک‌نفره)</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    {step.role_aliases.length === 0 && (
                      <p className="text-[11px] text-destructive">حداقل یک نقش انتخاب کنید.</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">نحوه تعیین تأییدکننده</label>
                    <Select
                      value={step.assignee_strategy}
                      onValueChange={(v) =>
                        updateStep(index, {
                          assignee_strategy: v as AssigneeStrategy,
                          assignee_user_id: v === 'fixed_user' ? step.assignee_user_id : null,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STRATEGY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <opt.icon className="h-3.5 w-3.5" />
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {step.assignee_strategy === 'fixed_user' && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium">کاربر تأییدکننده</label>
                      <Select
                        value={step.assignee_user_id ? String(step.assignee_user_id) : ''}
                        onValueChange={(v) => updateStep(index, { assignee_user_id: Number(v) })}
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب کاربر" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {userLabel(u)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StrategyIcon className="h-3.5 w-3.5" />
                    <span>{strategyMeta?.label}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-center pt-2">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex justify-center pb-2">
          <div className="rounded-full border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400">
            پایان — تأیید نهایی
          </div>
        </div>
      </div>

      <Button type="button" variant="outline" className="w-full" disabled={disabled} onClick={addStep}>
        <Plus className="ml-2 h-4 w-4" />
        افزودن مرحله تأیید
      </Button>

      <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
        <p className="text-sm font-medium">پیش‌نمایش تأییدکنندگان</p>
        <p className="text-xs text-muted-foreground">
          فرض می‌شود <span className="font-medium text-foreground">شما</span> درخواست را ثبت می‌کنید و
          می‌بینید هر مرحله به چه کسی می‌رسد (نیازی به وارد کردن شناسه عددی نیست).
        </p>
        <div className="rounded-md border bg-background px-3 py-2 text-sm">
          {profileLoading ? (
            <span className="text-muted-foreground">در حال بارگذاری حساب شما…</span>
          ) : previewSubmitterLabel() ? (
            <span>
              ثبت‌کنندهٔ شبیه‌سازی‌شده:{' '}
              <span className="font-medium text-foreground">{previewSubmitterLabel()}</span>
            </span>
          ) : (
            <span className="text-destructive">اطلاعات حساب شما در دسترس نیست.</span>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={runPreview}
            disabled={disabled || profileLoading || previewPending}
          >
            {previewPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            نمایش پیش‌نمایش
          </Button>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">اختیاری — شبیه‌سازی برای کاربر دیگر:</p>
          <Select
            value={previewAsUserId || '__self__'}
            onValueChange={(v) => {
              setPreviewAsUserId(v === '__self__' ? '' : v);
              setPreview(null);
              setPreviewError(null);
            }}
            disabled={disabled}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="همان حساب من" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__self__">همان حساب من (پیش‌فرض)</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {userLabel(u)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {previewError && <p className="text-sm text-destructive">{previewError}</p>}
        {preview && preview.length > 0 && (
          <div className="space-y-2">
            {preview.map((row) => (
              <div
                key={row.order}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm"
              >
                <span className="font-medium">مرحله {row.order}</span>
                <span className="text-muted-foreground">
                  {row.resolvedUserName
                    ? `\u2190 ${row.resolvedUserName}`
                    : row.assigneeStrategy === 'role_pool'
                      ? '\u2190 از بین نقش'
                      : '\u2190 (تعیین نشده)'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

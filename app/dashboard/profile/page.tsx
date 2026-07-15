'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { DashboardPageShell } from '@/app/components/layout/DashboardPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { FormGenerator } from '@/app/components/form-input/form-generator/form-generator';
import type { FormSchema } from '@/app/components/form-input/form-generator/form-generator.types';
import { useFormAction } from '@/app/hooks/use-form-action';
import { getProfileAction, updateProfileAction } from '@/app/_actions/profile-actions';
import type { ProfileDto } from '@/app/_types/profile.types';
import { ProfileUpdateSchema, type ProfileUpdateFormValues } from '@/app/_types/profile.schema';
import { resolveMediaUrl } from '@/app/utils/media-url';
import { validateAvatarFile } from '@/app/utils/validate-avatar';
import { useSessionStore } from '@/app/_store/auth-store';
import { showNotification } from '@/app/_store/notification.store';
import { Loader2, User } from 'lucide-react';
import { ProfileAvatarUpload } from './ProfileAvatarUpload';

type AvatarApiResponse =
  | { success: true; data: ProfileDto }
  | { success: false; error?: string };

function profileToFormValues(profile: ProfileDto): ProfileUpdateFormValues {
  return {
    email: profile.email ?? '',
    mobile: profile.mobile ?? '',
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    national_id: profile.national_id ?? '',
    father_name: profile.father_name ?? '',
    account_number: profile.account_number ?? profile.bank_account_number ?? '',
    card_number: profile.card_number ?? '',
    sheba_number: profile.sheba_number ?? '',
  };
}

export default function ProfilePage() {
  const { runAction, notifyError, isPending: saving } = useFormAction();
  const updateSession = useSessionStore((s) => s.updateSession);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarPending, startAvatarTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const result = await getProfileAction();
    if (result.success && result.data) {
      setProfile(result.data);
      setAvatarPreview(resolveMediaUrl(result.data.pic));
    } else {
      notifyError(result.error || 'دریافت اطلاعات پروفایل ناموفق بود');
    }
    setLoading(false);
  }, [notifyError]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const formSchema: FormSchema = useMemo(
    () => ({
      fields: [
        {
          name: 'email',
          label: 'ایمیل',
          type: 'email',
          required: true,
          row: 0,
          lgSpan: 6,
          placeholder: 'user@example.com',
        },
        {
          name: 'mobile',
          label: 'موبایل',
          type: 'text',
          required: true,
          row: 0,
          lgSpan: 6,
          placeholder: '09123456789',
        },
        {
          name: 'first_name',
          label: 'نام',
          type: 'text',
          required: true,
          row: 1,
          lgSpan: 6,
        },
        {
          name: 'last_name',
          label: 'نام خانوادگی',
          type: 'text',
          required: true,
          row: 1,
          lgSpan: 6,
        },
        {
          name: 'national_id',
          label: 'کد ملی',
          type: 'text',
          required: false,
          row: 2,
          lgSpan: 6,
          placeholder: '۱۰ رقم',
        },
        {
          name: 'father_name',
          label: 'نام پدر',
          type: 'text',
          required: false,
          row: 2,
          lgSpan: 6,
        },
        {
          name: 'account_number',
          label: 'شماره حساب',
          type: 'text',
          required: false,
          row: 3,
          lgSpan: 6,
          placeholder: 'شماره حساب بانکی (اختیاری)',
        },
        {
          name: 'sheba_number',
          label: 'شماره شبا',
          type: 'text',
          required: false,
          row: 3,
          lgSpan: 6,
          placeholder: 'IR… (اختیاری)',
        },
        {
          name: 'card_number',
          label: 'شماره کارت',
          type: 'text',
          required: false,
          row: 4,
          lgSpan: 6,
          placeholder: '۱۶ رقم (اختیاری)',
        },
      ],
    }),
    [],
  );

  const defaultValues = useMemo(
    () => (profile ? profileToFormValues(profile) : undefined),
    [profile],
  );

  const handleSaveProfile = (values: ProfileUpdateFormValues) => {
    const parsed = ProfileUpdateSchema.safeParse(values);
    if (!parsed.success) {
      notifyError(parsed.error.issues[0]?.message || 'اطلاعات فرم نامعتبر است');
      return;
    }

    runAction(() => updateProfileAction(parsed.data), {
      successMessage: 'اطلاعات پروفایل به‌روزرسانی شد',
      errorMessage: 'ذخیره پروفایل ناموفق بود',
      onSuccess: async (data) => {
        if (!data) return;
        setProfile(data);
        setAvatarPreview(resolveMediaUrl(data.pic));
        await updateSession();
      },
    });
  };

  const notifyAvatarError = (message: string) => {
    showNotification([{ type: 'error', message, duration: 6000 }]);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      notifyAvatarError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    startAvatarTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        let result: AvatarApiResponse;
        try {
          result = (await res.json()) as AvatarApiResponse;
        } catch {
          notifyAvatarError(
            res.status === 413
              ? 'حجم تصویر بیش از حد مجاز است. حداکثر ۵ مگابایت'
              : 'پاسخ سرور نامعتبر بود',
          );
          return;
        }

        if (!res.ok || !result.success) {
          notifyAvatarError(
            result.success === false && result.error
              ? result.error
              : res.status === 413
                ? 'حجم تصویر بیش از حد مجاز است. حداکثر ۵ مگابایت'
                : 'آپلود تصویر ناموفق بود',
          );
          return;
        }

        setProfile(result.data);
        setAvatarPreview(resolveMediaUrl(result.data.pic));
        await updateSession();
        showNotification([
          { type: 'success', message: 'تصویر پروفایل با موفقیت به‌روزرسانی شد', duration: 4000 },
        ]);
      } catch {
        notifyAvatarError('خطا در ارتباط با سرور. اتصال اینترنت را بررسی کنید.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleDeleteAvatar = () => {
    startAvatarTransition(async () => {
      try {
        const res = await fetch('/api/profile/avatar', {
          method: 'DELETE',
          credentials: 'include',
        });
        const result = (await res.json()) as AvatarApiResponse;

        if (!res.ok || !result.success) {
          notifyAvatarError(
            result.success === false && result.error ? result.error : 'حذف تصویر ناموفق بود',
          );
          return;
        }

        setProfile((prev) => (prev ? { ...prev, pic: '' } : prev));
        setAvatarPreview(null);
        await updateSession();
        showNotification([{ type: 'success', message: 'تصویر پروفایل حذف شد', duration: 4000 }]);
      } catch {
        notifyAvatarError('خطا در حذف تصویر. دوباره تلاش کنید.');
      }
    });
  };

  if (loading) {
    return (
      <DashboardPageShell variant="form">
        <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          در حال بارگذاری پروفایل...
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell variant="form" className="pb-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold sm:text-2xl">پروفایل من</h1>
        <p className="text-sm text-muted-foreground">اطلاعات حساب کاربری و تصویر پروفایل را تکمیل کنید.</p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <ProfileAvatarUpload
            avatarPreview={avatarPreview}
            avatarPending={avatarPending}
            fileInputRef={fileInputRef}
            onFileSelect={handleAvatarSelect}
            onDelete={handleDeleteAvatar}
            altText={profile?.full_name || 'پروفایل'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات شخصی</CardTitle>
          {profile?.username && (
            <CardDescription className="space-y-1">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                نام کاربری: <span className="font-medium text-foreground">{profile.username}</span>
              </span>
              {profile.full_name && (
                <span className="block text-muted-foreground">
                  نام صاحب حساب واریز:{' '}
                  <span className="font-medium text-foreground">{profile.full_name}</span> (همان نام شما)
                </span>
              )}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultValues ? (
            <>
              <FormGenerator
                key={profile?.id ?? 'profile'}
                schema={formSchema}
                formId="profile-form"
                defaultValues={defaultValues}
                onSubmit={handleSaveProfile}
                isLoading={saving}
              />
              <div className="flex justify-end border-t pt-4">
                <Button type="submit" form="profile-form" disabled={saving}>
                  {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  ذخیره تغییرات
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">اطلاعات پروفایل در دسترس نیست.</p>
          )}
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}

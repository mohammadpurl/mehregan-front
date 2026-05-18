'use client';

import { Button } from '@/app/components/ui/button';
import { AVATAR_ACCEPT } from '@/app/_types/profile.schema';
import { cn } from '@/lib/utils';
import { CircleUserRound, Loader2 } from 'lucide-react';
import type { ChangeEvent, RefObject } from 'react';

type ProfileAvatarUploadProps = {
  avatarPreview: string | null;
  avatarPending: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  altText?: string;
};

export function ProfileAvatarUpload({
  avatarPreview,
  avatarPending,
  fileInputRef,
  onFileSelect,
  onDelete,
  altText = 'تصویر پروفایل',
}: ProfileAvatarUploadProps) {
  return (
    <section
      className={cn(
        'flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed px-6 py-10 sm:py-12',
        'border-primary/35 bg-muted/20 dark:border-sky-800/55 dark:bg-[#0a1628]/80',
      )}
    >
      <figure
        className={cn(
          'relative m-0 flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center overflow-hidden rounded-full',
          'border border-primary/25 bg-primary/5 dark:border-sky-700/45 dark:bg-sky-950/50',
        )}
      >
        {avatarPreview ? (
          <img src={avatarPreview} alt={altText} className="h-full w-full object-cover" />
        ) : (
          <CircleUserRound
            className="h-[4.5rem] w-[4.5rem] stroke-[1.25] text-muted-foreground/55 dark:text-sky-200/35"
            aria-hidden
          />
        )}
        {avatarPending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-[2px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </span>
        )}
      </figure>

      <p className="max-w-lg text-center text-sm leading-7 text-muted-foreground">
        فرمت تصویر webp و بهتر است برای نمایش بهتر عرض آن ۵۱۲ در ۵۱۲ پیکسل باشد.
        <span className="mt-2 block text-xs text-muted-foreground/80">(jpg، png، gif — حداکثر ۵ مگابایت)</span>
      </p>

      <input ref={fileInputRef} type="file" accept={AVATAR_ACCEPT} className="hidden" onChange={onFileSelect} />

      <div className="flex flex-col items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={avatarPending}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'min-h-10 min-w-[11rem] rounded-lg border-primary/40 bg-transparent px-8 text-sm font-normal',
            'hover:bg-muted/40 dark:border-sky-700/60 dark:hover:bg-sky-950/40',
          )}
        >
          {avatarPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="mr-2">در حال بارگذاری...</span>
            </>
          ) : (
            'بارگذاری تصویر'
          )}
        </Button>

        {avatarPreview && !avatarPending && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-destructive underline-offset-4 hover:underline"
          >
            حذف تصویر
          </button>
        )}
      </div>
    </section>
  );
}

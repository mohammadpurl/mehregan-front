'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { signOutAction } from '../_actions/auth-actions';
import { useSessionStore } from '../_store/auth-store';
import { resolveMediaUrl } from '@/app/utils/media-url';
import { Loading } from './loading';
import { Button } from './button';
import { cn } from '@/lib/utils';

const AVATAR_SIZES = {
  sm: 'h-10 w-10',
  lg: 'h-[4.5rem] w-[4.5rem]',
} as const;

const MENU_WIDTH_PX = 240;
const MENU_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 12;

type AvatarSize = keyof typeof AVATAR_SIZES;

function ProfileAvatarCircle({
  pic,
  name,
  size = 'sm',
  className,
}: {
  pic?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  const url = resolveMediaUrl(pic);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted',
        AVATAR_SIZES[size],
        className,
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={name || 'پروفایل'}
          fill
          sizes={size === 'sm' ? '40px' : '72px'}
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
          <User className={size === 'sm' ? 'h-5 w-5' : 'h-8 w-8'} strokeWidth={1.75} />
        </span>
      )}
    </div>
  );
}

export const TopNavigationAccount = () => {
  const status = useSessionStore((state) => state.status);
  const session = useSessionStore((state) => state.session);
  const clearSession = useSessionStore((state) => state.clearSession);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const canHoverRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => setOpen(false), 200);
  }, [cancelScheduledClose]);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = menu?.offsetWidth ?? MENU_WIDTH_PX;
    const maxLeft = window.innerWidth - menuWidth - VIEWPORT_PADDING_PX;

    // وسط‌چین زیر آواتار، با محدودیت تا از viewport خارج نشود
    let left = rect.left + rect.width / 2 - menuWidth / 2;
    left = Math.max(VIEWPORT_PADDING_PX, Math.min(left, maxLeft));

    setMenuStyle({
      top: rect.bottom + MENU_GAP_PX,
      left,
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => {
      canHoverRef.current = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => () => cancelScheduledClose(), [cancelScheduledClose]);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const timer = window.setTimeout(() => {
      document.addEventListener('click', onOutside);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('click', onOutside);
    };
  }, [open]);

  const handleSignOut = useCallback(() => {
    setOpen(false);
    startTransition(async () => {
      const response = await signOutAction();
      if (response.success) {
        clearSession();
        router.push('/login');
      }
    });
  }, [clearSession, router]);

  const handleHoverZoneEnter = () => {
    if (!canHoverRef.current) return;
    cancelScheduledClose();
    setOpen(true);
  };

  const handleHoverZoneLeave = () => {
    if (!canHoverRef.current) return;
    scheduleClose();
  };

  const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (canHoverRef.current) return;
    setOpen((v) => !v);
  };

  if (status === 'loading') {
    return <div className="h-10 w-10 shrink-0 rounded-full bg-muted/60" aria-hidden />;
  }

  if (status !== 'authenticated') {
    return (
      <Button variant="outlined" href="/login">
        ورود به سایت
      </Button>
    );
  }

  const displayName = session?.fullName?.trim() || session?.username || 'کاربر';

  const menuPanel = (
    <div
      ref={menuRef}
      role="menu"
      style={{ top: menuStyle.top, left: menuStyle.left }}
      className="fixed z-100 w-60 max-w-[calc(100vw-1.5rem)] animate-in fade-in-0 zoom-in-95 duration-150"
      onMouseEnter={handleHoverZoneEnter}
      onMouseLeave={handleHoverZoneLeave}
    >
      <div className="overflow-hidden rounded-xl border border-white/10 bg-primary py-4 text-sidebar-foreground shadow-xl">
        <div className="flex flex-col items-center gap-3 px-4 pb-3">
          <ProfileAvatarCircle pic={session?.pic} name={displayName} size="lg" />
          <p className="max-w-full truncate text-center text-sm font-medium text-white">
            {displayName}
          </p>
        </div>

        <div className="px-2">
          <Link
            href="/dashboard/profile"
            role="menuitem"
            className="flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/90 transition-colors hover:bg-white/5 hover:text-white"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
            <span>پروفایل من</span>
          </Link>

          <div className="my-2 border-t border-white/10" />

          <button
            type="button"
            role="menuitem"
            disabled={isPending}
            onClick={handleSignOut}
            className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#e85d4c] transition-colors hover:bg-white/5 disabled:opacity-60"
          >
            {isPending ? (
              <Loading color="error" size="xs" text="" />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            )}
            <span>{isPending ? 'در حال خروج...' : 'خروج از حساب کاربری'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        onMouseEnter={handleHoverZoneEnter}
        onMouseLeave={handleHoverZoneLeave}
        className="relative flex touch-manipulation items-center rounded-full outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="منوی حساب کاربری"
      >
        <ProfileAvatarCircle pic={session?.pic} name={displayName} size="sm" />
      </button>

      {isClient && open ? createPortal(menuPanel, document.body) : null}
    </>
  );
};

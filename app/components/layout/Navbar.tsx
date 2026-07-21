// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { navItems } from '@/public/assets';
import { createPortal } from 'react-dom';

import NavbarBottomItem from './NavbarBottomItem';
import { NavigationItemsType } from '@/types/navigation-items-type';
import { useSessionStore } from '@/app/_store/auth-store';
import { filterNavItemsByAccess } from '@/lib/nav-access';

interface NavbarProps {
  pathname: string;
  sidebarOpen: boolean;
}

const FLYOUT_WIDTH = 256;
const FLYOUT_GAP = 8;
const VIEWPORT_PADDING = 8;

/** Position collapsed-sidebar flyout so long menus (e.g. مدیریت) stay inside the viewport. */
function computeFlyoutPosition(
  trigger: DOMRect,
  flyoutHeight: number
): { top: number; left: number } {
  const left = Math.max(VIEWPORT_PADDING, trigger.left - FLYOUT_WIDTH - FLYOUT_GAP);
  const maxTop = window.innerHeight - flyoutHeight - VIEWPORT_PADDING;
  // Prefer aligning with trigger; shift upward when needed so bottom items stay visible.
  const top = Math.min(trigger.top, Math.max(VIEWPORT_PADDING, maxTop));
  return { top, left };
}

function estimateFlyoutHeight(childCount: number): number {
  const header = 28;
  const item = 44; // min-h-11
  const padding = 16;
  return header + childCount * item + padding;
}

const NavItem = ({ 
  item, 
  pathname, 
  sidebarOpen 
}: { 
  item: NavigationItemsType; 
  pathname: string; 
  sidebarOpen: boolean;
}) => {
  const isChildActive = item.children?.some(child => pathname === child.href);
  const [isOpen, setIsOpen] = useState(!!isChildActive);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href ? pathname === item.href : false;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  /** Inline submenu (sidebar expanded) — must be included in “inside” checks so links stay mounted through click. */
  const submenuRef = useRef<HTMLDivElement | null>(null);
  const flyoutRef = useRef<HTMLDivElement | null>(null);

  const handleToggle = () => {
    if (sidebarOpen) {
      setIsOpen((prev) => !prev);
      return;
    }

    if (isOpen) {
      setIsOpen(false);
      setFlyoutPosition(null);
      return;
    }

    if (!buttonRef.current) {
      setIsOpen(true);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const estimated = estimateFlyoutHeight(item.children?.length ?? 0);
    setFlyoutPosition(computeFlyoutPosition(rect, estimated));
    setIsOpen(true);
  };

  // After mount, remeasure actual flyout height and clamp again (long admin menus).
  useLayoutEffect(() => {
    if (sidebarOpen || !isOpen || !buttonRef.current || !flyoutRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const height = flyoutRef.current.getBoundingClientRect().height;
    const next = computeFlyoutPosition(rect, height);
    setFlyoutPosition((prev) => {
      if (prev && prev.top === next.top && prev.left === next.left) return prev;
      return next;
    });
  }, [sidebarOpen, isOpen, item.children?.length]);

  useEffect(() => {
    if (!isOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideToggle = buttonRef.current?.contains(target);
      const insideInlineSubmenu = submenuRef.current?.contains(target);
      const insideFlyout = flyoutRef.current?.contains(target);
      if (!insideToggle && !insideInlineSubmenu && !insideFlyout) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const reposition = () => {
      if (sidebarOpen || !buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const height =
        flyoutRef.current?.getBoundingClientRect().height ??
        estimateFlyoutHeight(item.children?.length ?? 0);
      setFlyoutPosition(computeFlyoutPosition(rect, height));
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen, sidebarOpen, item.children?.length]);

  // اگر item فرزند دارد
  if (hasChildren) {
    return (
      <div className="space-y-1 relative">
        <button
          type="button"
          ref={buttonRef}
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={sidebarOpen ? `${item.label}، ${isOpen ? 'بستن زیرمنو' : 'باز کردن زیرمنو'}` : item.label}
          className={`
            flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-lg px-3 py-3 text-right transition-all duration-200
            ${isChildActive ? 'erp-nav-item-active font-semibold' : 'erp-nav-item-idle'}
          `}
        >
          <item.icon className="w-5 h-5 shrink-0" />
          
          {sidebarOpen && (
            <span className="text-sm flex-1 min-w-0 whitespace-normal leading-5">{item.label}</span>
          )}

          {sidebarOpen && (
            <div className="ml-auto">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          )}
        </button>

        {/* زیرمنو */}
        {(sidebarOpen && isOpen) && (
          <div ref={submenuRef} className="mr-6 space-y-1">
            {item.children && item.children.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href!}
                  className={`
                    flex min-h-11 touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all
                    ${childActive ? 'erp-nav-child-active font-medium' : 'erp-nav-child-idle'}
                  `}
                >
                  <child.icon className="w-4 h-4" />
                  <span className="min-w-0 whitespace-normal leading-5">{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* زیرمنو شناور وقتی سایدبار بسته است */}
        {!sidebarOpen &&
          isOpen &&
          flyoutPosition &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={flyoutRef}
              style={{ top: flyoutPosition.top, left: flyoutPosition.left }}
              className="erp-sidebar-shell fixed z-50 flex max-h-[calc(100vh-16px)] w-64 flex-col overflow-hidden rounded-xl border border-[oklch(0.3783_0.0647_256.94)] p-2 shadow-xl"
            >
              <div className="shrink-0 px-2 py-1.5 text-xs font-medium opacity-60">{item.label}</div>
              <div className="min-h-0 space-y-1 overflow-y-auto overscroll-contain">
                {item.children?.map((child) => {
                  const childActive = pathname === child.href;
                  return (
                    <Link
                      key={child.href}
                      href={child.href!}
                      onClick={() => setIsOpen(false)}
                      className={
                        childActive
                          ? 'erp-nav-item-active flex min-h-11 touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium'
                          : 'erp-nav-item-idle flex min-h-11 touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors'
                      }
                    >
                      <child.icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="min-w-0 whitespace-normal leading-5">{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }

  // آیتم بدون فرزند (ساده)
  return (
    <Link
      href={item.href!}
      className={`
        flex min-h-11 touch-manipulation items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200
        ${isActive ? 'erp-nav-item-active font-semibold' : 'erp-nav-item-idle'}
      `}
    >
      <item.icon className="w-5 h-5 shrink-0" />
      {sidebarOpen && <span className="text-sm min-w-0 whitespace-normal leading-5">{item.label}</span>}
    </Link>
  );
};

const Navbar = ({ pathname, sidebarOpen }: NavbarProps) => {
  const session = useSessionStore((state) => state.session);
  const userRoles = Array.isArray(session?.roles)
    ? session.roles.map((r) => String(r).trim()).filter(Boolean)
    : [];
  const rawPermissions = session?.permissions as string[] | string | undefined;
  const userPermissions = Array.isArray(rawPermissions)
    ? rawPermissions.map((p) => String(p).trim()).filter(Boolean)
    : typeof rawPermissions === 'string' && rawPermissions
      ? rawPermissions.split(/[,\s]+/).map((p) => p.trim()).filter(Boolean)
      : [];
  const accessibleNavItems = filterNavItemsByAccess(navItems, userRoles, userPermissions);

  return (
    <>
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {accessibleNavItems.map((item, index) => (
          <NavItem 
            key={index} 
            item={item} 
            pathname={pathname} 
            sidebarOpen={sidebarOpen} 
          />
        ))}
      </nav>

      <NavbarBottomItem />
    </>
  );
};

export default Navbar;
// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { navItems } from '@/public/assets';
import { createPortal } from 'react-dom';

import NavbarBottomItem from './NavbarBottomItem';
import { NavigationItemsType } from '@/types/navigation-items-type';
import { useSessionStore } from '@/app/_store/auth-store';
import { hasAnyPermission, hasAnyRole } from '@/lib/permissions';

interface NavbarProps {
  pathname: string;
  sidebarOpen: boolean;
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
    const flyoutWidth = 256; // w-64
    const gap = 8;
    const top = rect.top;
    const left = Math.max(8, rect.left - flyoutWidth - gap);
    setFlyoutPosition({ top, left });
    setIsOpen(true);
  };

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

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isOpen]);

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
            ${isChildActive 
              ? "bg-sidebar-accent text-sidebar-primary font-semibold" 
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }
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
                    ${childActive 
                      ? "bg-sidebar-accent/70 text-sidebar-primary font-medium" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30"
                    }
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
              className="fixed z-50 w-64 rounded-xl border border-zinc-200 bg-white p-2 text-zinc-900 shadow-lg dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</div>
              <div className="space-y-1">
                {item.children?.map((child) => {
                  const childActive = pathname === child.href;
                  return (
                    <Link
                      key={child.href}
                      href={child.href!}
                      onClick={() => setIsOpen(false)}
                      className={
                        childActive
                          ? 'flex min-h-11 touch-manipulation items-center gap-3 rounded-lg bg-sky-100 px-3 py-2.5 text-sm font-medium text-sky-900 dark:bg-sky-900/40 dark:text-sky-100'
                          : 'flex min-h-11 touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80'
                      }
                    >
                      <child.icon className="h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-300" />
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
        ${isActive
          ? "bg-sidebar-accent text-sidebar-primary font-semibold"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        }
      `}
    >
      <item.icon className="w-5 h-5 shrink-0" />
      {sidebarOpen && <span className="text-sm min-w-0 whitespace-normal leading-5">{item.label}</span>}
    </Link>
  );
};

const canAccessNavItem = (
  item: NavigationItemsType,
  userRoles: string[],
  userPermissions: string[]
) => {
  return (
    hasAnyRole(userRoles, item.requiredRoles) &&
    hasAnyPermission(userPermissions, item.requiredPermissions)
  );
};

const filterNavItemsByAccess = (
  items: NavigationItemsType[],
  userRoles: string[],
  userPermissions: string[]
): NavigationItemsType[] => {
  return items.reduce<NavigationItemsType[]>((acc, item) => {
    if (!canAccessNavItem(item, userRoles, userPermissions)) {
      return acc;
    }

    if (item.children && item.children.length > 0) {
      const filteredChildren = filterNavItemsByAccess(item.children, userRoles, userPermissions);

      if (filteredChildren.length === 0) {
        return acc;
      }

      acc.push({ ...item, children: filteredChildren });
      return acc;
    }

    acc.push(item);
    return acc;
  }, []);
};

const Navbar = ({ pathname, sidebarOpen }: NavbarProps) => {
  const session = useSessionStore((state) => state.session);
  const userRoles = session?.roles ?? [];
  const userPermissions = session?.permissions ?? [];
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
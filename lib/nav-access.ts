import type { NavigationItemsType } from '@/types/navigation-items-type';
import { hasAnyPermission, hasAnyRole } from '@/lib/permissions';

export function canAccessNavItem(
  item: Pick<NavigationItemsType, 'requiredRoles' | 'requiredPermissions'>,
  userRoles: string[],
  userPermissions: string[],
): boolean {
  return (
    hasAnyRole(userRoles, item.requiredRoles) &&
    hasAnyPermission(userPermissions, item.requiredPermissions)
  );
}

export function filterNavItemsByAccess(
  items: NavigationItemsType[],
  userRoles: string[],
  userPermissions: string[],
): NavigationItemsType[] {
  return items.reduce<NavigationItemsType[]>((acc, item) => {
    if (!canAccessNavItem(item, userRoles, userPermissions)) {
      return acc;
    }

    if (item.children && item.children.length > 0) {
      const filteredChildren = filterNavItemsByAccess(
        item.children,
        userRoles,
        userPermissions,
      );
      if (filteredChildren.length === 0) {
        return acc;
      }
      acc.push({ ...item, children: filteredChildren });
      return acc;
    }

    acc.push(item);
    return acc;
  }, []);
}

/** لینک‌های برگ با href از درخت منو (پس از فیلتر دسترسی) */
export function flattenAccessibleNavLinks(
  items: NavigationItemsType[],
): Array<Pick<NavigationItemsType, 'href' | 'label' | 'icon'>> {
  const out: Array<Pick<NavigationItemsType, 'href' | 'label' | 'icon'>> = [];
  for (const item of items) {
    if (item.children?.length) {
      out.push(...flattenAccessibleNavLinks(item.children));
      continue;
    }
    if (item.href) {
      out.push({ href: item.href, label: item.label, icon: item.icon });
    }
  }
  return out;
}

export function canAccessByPermissions(
  userPermissions: string[] | undefined,
  required: string[] | undefined,
): boolean {
  return hasAnyPermission(userPermissions, required);
}

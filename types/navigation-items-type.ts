import type { LucideIcon } from 'lucide-react';

export type NavigationItemsType = {
    href?: string;
    label: string;
    icon: LucideIcon;
    children?: NavigationItemsType[];
    requiredRoles?: string[];
    requiredPermissions?: string[];
}


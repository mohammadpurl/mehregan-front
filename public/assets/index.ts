import { NavigationItemsType } from '@/types/navigation-items-type';
import {
  FileText,
  Package,
  ShoppingCart,
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  ShieldCheck,
  KeyRound,
  UserCircle,
  DollarSign,
  Building2,
  Contact,
  Landmark,
  Wallet,
  Receipt,
  Banknote,
  ClipboardList,
  Truck,
  Plus,
  FileSpreadsheet,
  Timer,
} from 'lucide-react';

export const navItems: NavigationItemsType[] = [
  {
    href: "/dashboard",
    label: "داشبورد",
    icon: LayoutDashboard,
    requiredPermissions: ["dashboard.read"],
  },
  // {
  //   href: "/dashboard/profile",
  //   label: "پروفایل من",
  //   icon: UserCircle,
  // },
  {
    label: "درخواست‌های مالی",
    icon: DollarSign,
    requiredPermissions: ["payment.create"],
    children: [
      {
        href: "/dashboard/payment-request",
        label: "وام، مساعده و دستور پرداخت",
        icon: Banknote,
        requiredPermissions: ["payment.create"],
      },
      {
        href: "/dashboard/payment-request/procurement",
        label: "پرداخت‌های خرید",
        icon: ShoppingCart,
        requiredPermissions: ["payment.create", "payment.approve", "procurement.read"],
      },
      {
        href: "/dashboard/financial-documents",
        label: "اسناد مالی",
        icon: FileText,
        requiredPermissions: ["payment.create"],
      },
      {
        href: "/dashboard/petty-cash",
        label: "درخواست تنخواه",
        icon: Wallet,
        requiredPermissions: ["payment.create"],
      },
      {
        href: "/dashboard/mission-requests",
        label: "درخواست ماموریت",
        icon: ClipboardList,
        requiredPermissions: ["payment.create"],
      },
      {
        href: "/dashboard/petty-cash/settlement",
        label: "ثبت خرج تنخواه",
        icon: Receipt,
        requiredPermissions: ["payment.create"],
      },
      {
        href: "/dashboard/petty-cash/ledger",
        label: "دفتر تنخواه (گزارش)",
        icon: FileSpreadsheet,
        requiredPermissions: ["payment.approve", "payment.create"],
      },
    ],
  },
  {
    label: "گردش کار",
    icon: FileText,
    children: [
      {
        href: "/dashboard/workflow/inbox",
        label: "کارهای من (Inbox)",
        icon: BarChart3,
        requiredPermissions: ["workflow.inbox.read", "dashboard.read"],
      },
      {
        href: "/dashboard/ad-hoc-tasks",
        label: "کارهای پیش‌بینی‌نشده",
        icon: ClipboardList,
        requiredPermissions: ["dashboard.read"],
      },
      {
        href: "/dashboard/workflow/tracking",
        label: "پیگیری گردش کار",
        icon: BarChart3,
        requiredPermissions: ["workflow.tracking.read"],
      },
      {
        href: "/dashboard/reports/sla",
        label: "گزارش SLA",
        icon: Timer,
        requiredPermissions: ["workflow.tracking.read", "dashboard.read"],
      },
      {
        href: "/dashboard/reports/financial",
        label: "گزارش مالی اجرایی",
        icon: DollarSign,
        requiredPermissions: ["payment.create", "payment.approve", "workflow.tracking.read"],
      },
      {
        href: "/dashboard/reports/warehouse",
        label: "گزارش روزانه انبار",
        icon: Package,
        requiredPermissions: ["inventory.read", "procurement.read"],
      },
    ],
  },
  {
    label: "تدارکات و خرید",
    icon: ShoppingCart,
    requiredPermissions: ["procurement.read"],
    children: [
      {
        href: "/dashboard/procurement/requests?create=1",
        label: "ثبت درخواست خرید",
        icon: Plus,
        requiredPermissions: ["procurement.write"],
      },
      {
        href: "/dashboard/procurement/requests",
        label: "درخواست‌های خرید",
        icon: ClipboardList,
        requiredPermissions: ["procurement.read"],
      },
      {
        href: "/dashboard/master/suppliers",
        label: "تأمین‌کنندگان",
        icon: Truck,
        requiredPermissions: ["procurement.read", "masterdata.manage"],
      },
      {
        href: "/dashboard/procurement/orders",
        label: "سفارش‌های خرید (PO)",
        icon: Package,
        requiredPermissions: ["procurement.read"],
      },
      {
        href: "/dashboard/procurement/grn",
        label: "رسید انبار (فاکتور خرید)",
        icon: Package,
        requiredPermissions: ["procurement.read"],
      },
    ],
  },
  {
    label: "انبار",
    icon: Package,
    requiredPermissions: ["inventory.read", "inventory.transfer"],
    children: [
      {
        href: "/dashboard/inventory/stock",
        label: "موجودی انبار",
        icon: BarChart3,
        requiredPermissions: ["inventory.read"],
      },
      {
        href: "/dashboard/inventory/transactions",
        label: "تراکنش‌ها",
        icon: BarChart3,
        requiredPermissions: ["inventory.transfer"],
      },
    ],
  },
  {
    label: "اطلاعات پایه",
    icon: Settings,
    requiredPermissions: ["masterdata.manage", "item.read", "item.*"],
    children: [
      {
        href: "/dashboard/master/items",
        label: "کالاها",
        icon: BarChart3,
        requiredPermissions: ["item.read", "item.*"],
      },
      {
        href: "/dashboard/master/categories",
        label: "گروه کالا",
        icon: BarChart3,
        requiredPermissions: ["masterdata.manage"],
      },
      {
        href: "/dashboard/master/warehouses",
        label: "انبارها",
        icon: BarChart3,
        requiredPermissions: ["masterdata.manage"],
      },
      {
        href: "/dashboard/master/suppliers",
        label: "تامین‌کنندگان",
        icon: BarChart3,
        requiredPermissions: ["masterdata.manage"],
      },
    ],
  },
  {
    label: "مدیریت",
    icon: ShieldCheck,
    requiredPermissions: ["admin.manage"],
    children: [
      { href: "/dashboard/admin/users", label: "کاربران", icon: Users, requiredPermissions: ["admin.manage"] },
      { href: "/dashboard/admin/departments/tree", label: "واحدهای سازمانی", icon: Building2, requiredPermissions: ["admin.manage"] },
      { href: "/dashboard/admin/roles", label: "نقش‌ها", icon: ShieldCheck, requiredPermissions: ["admin.manage"] },
      { href: "/dashboard/admin/permissions", label: "مجوزها", icon: KeyRound, requiredPermissions: ["admin.manage"] },
      { href: "/dashboard/admin/assignment-rules", label: "مجوزهای نقش", icon: Settings, requiredPermissions: ["admin.manage"] },
      { href: "/dashboard/admin/workflow-definitions", label: "تعریف workflow", icon: Settings, requiredPermissions: ["admin.manage"] },
      { href: "/dashboard/admin/audit", label: "مرکز ممیزی", icon: ShieldCheck, requiredPermissions: ["admin.manage"] },
      { href: "/dashboard/admin/counterparties", label: "طرف‌حساب‌ها", icon: Contact, requiredPermissions: ["admin.manage"] },
      { href: "/dashboard/admin/company-bank-accounts", label: "حساب‌های بانکی شرکت", icon: Landmark, requiredPermissions: ["admin.manage"] },
    ],
  },
];

export const bottomItems = [
  { path: "/dashboard/profile", label: "پروفایل من", icon: Users },
];

'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  getExecutiveFinancialReportAction,
  getManagementDashboardAction,
  getUserDashboardAction,
  getWarehouseDailyReportAction,
  type ExecutiveFinancialReport,
  type ManagementDashboard,
  type UserDashboard,
  type WarehouseDailyReport,
} from '@/app/_actions/dashboard-actions';
import { Button } from '@/app/components/ui/button';
import { formatAmount } from '@/app/utils/number-format';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ChevronLeft,
  Inbox,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Warehouse,
  Workflow,
  Timer,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Accent = 'blue' | 'violet' | 'teal' | 'amber' | 'rose';

const accentStyles: Record<
  Accent,
  { badge: string; bar: string; pill: string }
> = {
  blue: {
    badge: 'bg-gradient-to-br from-sky-400 to-blue-600',
    bar: 'from-sky-400 to-blue-500',
    pill: 'bg-sky-50 text-sky-800 ring-sky-100',
  },
  violet: {
    badge: 'bg-gradient-to-br from-violet-400 to-indigo-600',
    bar: 'from-violet-400 to-indigo-500',
    pill: 'bg-violet-50 text-violet-800 ring-violet-100',
  },
  teal: {
    badge: 'bg-gradient-to-br from-teal-400 to-cyan-600',
    bar: 'from-teal-400 to-cyan-500',
    pill: 'bg-teal-50 text-teal-800 ring-teal-100',
  },
  amber: {
    badge: 'bg-gradient-to-br from-amber-400 to-orange-500',
    bar: 'from-amber-400 to-orange-500',
    pill: 'bg-amber-50 text-amber-900 ring-amber-100',
  },
  rose: {
    badge: 'bg-gradient-to-br from-rose-400 to-pink-600',
    bar: 'from-rose-400 to-pink-500',
    pill: 'bg-rose-50 text-rose-800 ring-rose-100',
  },
};

function SoftStatCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  accent = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  icon: LucideIcon;
  accent?: Accent;
}) {
  const styles = accentStyles[accent];
  const content = (
    <div
      className={cn(
        'soft-card relative overflow-hidden p-5',
        href && 'soft-card-interactive cursor-pointer',
      )}
    >
      <div
        className={cn('absolute inset-y-0 end-0 w-1 bg-gradient-to-b opacity-80', styles.bar)}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
          {subtitle ? <p className="text-xs leading-relaxed text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className={cn('soft-icon-badge', styles.badge)}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
      {href ? (
        <p className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
          مشاهده جزئیات
          <ChevronLeft className="h-3.5 w-3.5" />
        </p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl">
        {content}
      </Link>
    );
  }
  return content;
}

function SectionBlock({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: LucideIcon;
  accent: Accent;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn('soft-icon-badge h-9 w-9', accentStyles[accent].badge)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="soft-section-label">بخش</p>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function SoftPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('soft-card overflow-hidden', className)}>
      <div className="border-b border-border/40 bg-muted/20 px-5 py-3.5">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="dashboard-canvas -mx-3 min-h-full px-3 py-6 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8 animate-pulse">
        <div className="h-24 rounded-2xl bg-white/60" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/70" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-64 rounded-2xl bg-white/70 lg:col-span-2" />
          <div className="h-64 rounded-2xl bg-white/70" />
        </div>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [userDash, setUserDash] = useState<UserDashboard | null>(null);
  const [mgmt, setMgmt] = useState<ManagementDashboard | null>(null);
  const [financial, setFinancial] = useState<ExecutiveFinancialReport | null>(null);
  const [warehouse, setWarehouse] = useState<WarehouseDailyReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [u, m, f, w] = await Promise.all([
        getUserDashboardAction(),
        getManagementDashboardAction(),
        getExecutiveFinancialReportAction(),
        getWarehouseDailyReportAction(),
      ]);
      if (cancelled) return;
      if (u.success && u.data) setUserDash(u.data);
      if (m.success && m.data) setMgmt(m.data);
      if (f.success && f.data) setFinancial(f.data);
      if (w.success && w.data) setWarehouse(w.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const inboxPending = userDash?.stats.pending ?? 0;
  const wfPending = mgmt?.workflow.pending ?? financial?.workflow.all_pending_instances ?? 0;
  const slaOverdue = userDash?.stats.overdue ?? mgmt?.operations.sla_overdue ?? 0;

  const quickLinks = [
    { href: '/dashboard/workflow/inbox', label: 'کارتابل من', icon: Inbox },
    { href: '/dashboard/payment-request', label: 'درخواست پرداخت', icon: Wallet },
    { href: '/dashboard/petty-cash', label: 'تنخواه', icon: Wallet },
    { href: '/dashboard/procurement/requests', label: 'درخواست خرید', icon: ShoppingCart },
    { href: '/dashboard/inventory/stock', label: 'موجودی انبار', icon: Package },
    { href: '/dashboard/workflow/tracking', label: 'پیگیری گردش‌کار', icon: Workflow },
    { href: '/dashboard/reports/sla', label: 'گزارش SLA', icon: Timer },
  ];

  return (
    <div className="dashboard-canvas -mx-3 min-h-full px-3 py-5 sm:-mx-4 sm:px-4 sm:py-6 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* هدر */}
        <header className="soft-card overflow-hidden">
          <div className="bg-gradient-to-l from-primary/10 via-transparent to-accent/5 px-6 py-6 sm:px-8 sm:py-7">
            <p className="text-xs font-medium text-muted-foreground">خانه / داشبورد</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              داشبورد مدیریتی
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              نمای کلی مالی، انبار و گردش‌کار — مطابق سامانه اتوماسیون امور اداری و مالی
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-xl shadow-sm">
                <Link href="/dashboard/workflow/inbox">
                  <Inbox className="ms-1.5 h-4 w-4" />
                  کارتابل ({inboxPending})
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl border-border/60 bg-white/80">
                <Link href="/dashboard/workflow/tracking">پیگیری درخواست‌ها</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
          {/* ستون اصلی */}
          <div className="space-y-8 min-w-0">
            <SectionBlock title="کارهای من" icon={Inbox} accent="blue">
              <div className="grid gap-4 sm:grid-cols-2">
                <SoftStatCard
                  title="کارتابل باز"
                  value={inboxPending}
                  href="/dashboard/workflow/inbox"
                  icon={Inbox}
                  accent="blue"
                />
                <SoftStatCard
                  title="انجام‌شده"
                  value={userDash?.stats.done ?? 0}
                  subtitle="آیتم‌های inbox"
                  icon={TrendingUp}
                  accent="teal"
                />
                <SoftStatCard
                  title="تأخیر SLA"
                  value={slaOverdue}
                  subtitle={slaOverdue > 0 ? 'نیاز به پیگیری' : 'بدون تأخیر'}
                  href="/dashboard/reports/sla"
                  icon={Workflow}
                  accent={slaOverdue > 0 ? 'rose' : 'teal'}
                />
                <SoftStatCard
                  title="درخواست پرداخت من"
                  value={userDash?.stats.my_payment_requests ?? 0}
                  href="/dashboard/payment-request"
                  icon={Wallet}
                  accent="violet"
                />
              </div>
            </SectionBlock>

            {financial ? (
              <SectionBlock title="وضعیت مالی سازمان" icon={Wallet} accent="violet">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SoftStatCard
                    title="پرداخت — در انتظار"
                    value={financial.payment_requests.pending_count}
                    subtitle={`جمع: ${formatAmount(financial.payment_requests.total_amount)}`}
                    href="/dashboard/payment-request?scope=all"
                    icon={Wallet}
                    accent="violet"
                  />
                  <SoftStatCard
                    title="تنخواه — در انتظار تأیید"
                    value={financial.petty_cash.pending_count}
                    subtitle={`${financial.petty_cash.total} مورد ثبت‌شده`}
                    href="/dashboard/petty-cash/ledger"
                    icon={Wallet}
                    accent="amber"
                  />
                  <SoftStatCard
                    title="تنخواه — منتظر تسویه"
                    value={financial.petty_cash.awaiting_settlement_count}
                    href="/dashboard/petty-cash/settlement"
                    icon={Wallet}
                    accent="teal"
                  />
                  <SoftStatCard
                    title="گردش مالی معلق"
                    value={financial.workflow.financial_pending_instances}
                    subtitle={`${financial.workflow.financial_pending_steps} مرحله در صف`}
                    href="/dashboard/workflow/tracking?scope=all"
                    icon={Workflow}
                    accent="blue"
                  />
                </div>
              </SectionBlock>
            ) : null}

            {warehouse ? (
              <SectionBlock title={`انبار — امروز (${warehouse.date})`} icon={Warehouse} accent="amber">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SoftStatCard
                    title="تراکنش امروز"
                    value={warehouse.transactions_today.total}
                    href="/dashboard/inventory/transactions"
                    icon={Package}
                    accent="teal"
                  />
                  <SoftStatCard
                    title="رسید کالا (GRN)"
                    value={warehouse.grn.created_today}
                    subtitle={`ثبت‌شده: ${warehouse.grn.posted_today}`}
                    href="/dashboard/procurement/grn"
                    icon={ShoppingCart}
                    accent="amber"
                  />
                  <SoftStatCard title="انبارها" value={warehouse.warehouses_count} icon={Warehouse} accent="blue" />
                  <SoftStatCard
                    title="کمبود موجودی"
                    value={warehouse.low_stock_count}
                    subtitle="حداکثر ۵۰ مورد در گزارش"
                    href="/dashboard/inventory/stock"
                    icon={Package}
                    accent="rose"
                  />
                </div>

                {warehouse.low_stock.length > 0 ? (
                  <SoftPanel title="اقلام کم‌موجودی" className="mt-4">
                    <ul className="space-y-2">
                      {warehouse.low_stock.slice(0, 8).map((row) => (
                        <li
                          key={`${row.sku}-${row.warehouse_name}`}
                          className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2.5 text-sm"
                        >
                          <span
                            className="h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-rose-400 to-orange-400"
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 font-medium text-foreground">{row.item_name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{row.sku}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {row.warehouse_name}: {row.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </SoftPanel>
                ) : null}
              </SectionBlock>
            ) : null}

            {mgmt ? (
              <SectionBlock title="گردش‌کار" icon={Workflow} accent="violet">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SoftStatCard
                    title="کل نمونه‌ها"
                    value={mgmt.workflow.total}
                    href="/dashboard/workflow/tracking?scope=all"
                    icon={Workflow}
                    accent="violet"
                  />
                  <SoftStatCard title="در جریان" value={wfPending} icon={TrendingUp} accent="blue" />
                  <SoftStatCard title="تأییدشده" value={mgmt.workflow.approved} icon={TrendingUp} accent="teal" />
                  <SoftStatCard title="ردشده" value={mgmt.workflow.rejected} icon={Workflow} accent="rose" />
                </div>

                {Object.keys(mgmt.workflow.by_ref_type || {}).length > 0 ? (
                  <SoftPanel title="تفکیک بر اساس نوع" className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(mgmt.workflow.by_ref_type).map(([k, v]) => (
                        <span
                          key={k}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset',
                            accentStyles.violet.pill,
                          )}
                        >
                          {k}
                          <strong className="tabular-nums">{v}</strong>
                        </span>
                      ))}
                    </div>
                  </SoftPanel>
                ) : null}
              </SectionBlock>
            ) : null}
          </div>

          {/* ستون کناری — خلاصه و دسترسی سریع */}
          <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
            <SoftPanel title="خلاصه امروز">
              <ul className="space-y-4">
                <li className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">کارتابل باز</span>
                  <span className="text-lg font-bold tabular-nums text-primary">{inboxPending}</span>
                </li>
                <li className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">گردش‌کار در جریان</span>
                  <span className="text-lg font-bold tabular-nums">{wfPending}</span>
                </li>
                {financial ? (
                  <li className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">پرداخت معلق</span>
                    <span className="text-lg font-bold tabular-nums">
                      {financial.payment_requests.pending_count}
                    </span>
                  </li>
                ) : null}
                {warehouse ? (
                  <li className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">کمبود موجودی</span>
                    <span className="text-lg font-bold tabular-nums text-destructive">
                      {warehouse.low_stock_count}
                    </span>
                  </li>
                ) : null}
              </ul>
            </SoftPanel>

            <SoftPanel title="دسترسی سریع">
              <nav className="space-y-1">
                {quickLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      {label}
                    </span>
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </nav>
            </SoftPanel>
          </aside>
        </div>
      </div>
    </div>
  );
}

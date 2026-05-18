
import { headers } from 'next/headers';
import Header from '../components/header/Header';
import MobileSidebar from '../components/layout/MobileSidebar';
import { DashboardClientShell } from './dashboard-client-shell';

const DashboardLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const headersList = await headers();
  const pathname = headersList.get('x-current-path') || '/';

  return (
    <div className="grid h-dvh max-h-dvh grid-cols-1 overflow-hidden bg-background lg:grid-cols-[auto_1fr]">
      <MobileSidebar pathname={pathname} />

      <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_1fr]">
        <Header />
        <main className="min-h-0 min-w-0 w-full max-w-full overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 sm:px-4 md:px-6 lg:mx-auto lg:max-w-[min(100%,96rem)] lg:px-8">
          <DashboardClientShell>{children}</DashboardClientShell>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

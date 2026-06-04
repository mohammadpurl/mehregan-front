
'use client'
import Navbar from './Navbar';
import SidebarToggle from './SidebarToggle';
import { useUiStore } from '@/app/_store/ui-store';

interface SidebarProps {
  pathname: string;
 
}

const Sidebar = ({ pathname }: SidebarProps) => {
  const { mobileOpen, sidebarOpen } = useUiStore();
  return (    
    <aside
    className={`
      fixed top-0 right-0 bottom-0 z-50 flex h-dvh max-h-dvh flex-col erp-sidebar-shell
      transition-all duration-300 ease-in-out
      lg:sticky lg:top-0 lg:h-dvh lg:max-h-dvh lg:min-h-0
      ${sidebarOpen ? "w-64" : "w-20"}
      ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
    `}
  >
      <div className="flex h-full min-h-0 flex-col">
        <SidebarToggle />

        {/* Navbar */}
        <Navbar pathname={pathname} sidebarOpen={sidebarOpen} />
      </div>
    </aside>
  );
};

export default Sidebar;
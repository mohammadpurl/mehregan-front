import React from 'react'
import Link from 'next/link';
import { useUiStore } from '@/app/_store/ui-store';
import { bottomItems } from '@/public/assets';
import { TopNavigationAccount } from '../TopNavigationAccout';
import Signout from './Signout';
const NavbarBottomItem = () => {
    const {sidebarOpen} = useUiStore();
  return (
   
    <div className="py-4 px-3 border-t border-sidebar-border space-y-1">
          {bottomItems.map((item) => (
            <Link
              key={`bottomIte ${item.path}`}
              href={item.path}   
             
            //   onClick={() => setMobileOpen(false)}
              className={`
                flex min-h-11 touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200
                text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50
                ${!sidebarOpen ? "justify-center" : ""}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
          <Signout />
        </div>

  )
}

export default NavbarBottomItem
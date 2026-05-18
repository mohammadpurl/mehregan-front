
import Sidebar from './Sidebar';


export default function MobileSidebar({ pathname }: { pathname: string }) {
  

  return (
    <>
      {/* Overlay */}
      {/* {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )} */}

      {/* سایدبار موبایل */}
      <Sidebar pathname={pathname}  />
    </>
  );
}
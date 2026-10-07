import { useState, type ReactNode } from 'react';
import { Building2, ChevronRight, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../api';

export function AdminLayout({ children, adminName }: { children: ReactNode; adminName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await api.logout().catch(() => undefined);
    router.replace('/admin/login');
  }

  const nav = (
    <>
      <div className="sidebar-brand">
        {sidebarCollapsed ? (
          <button
            type="button"
            className="sidebar-favicon-button"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <img className="sidebar-favicon" src="/favicon-shilp.png" alt="" />
          </button>
        ) : (
          <>
            <img className="sidebar-logo" src="/shilp-group-black-logo.svg" alt="Shilp Group" />
            <button
              type="button"
              className="sidebar-collapse-button"
              onClick={() => setSidebarCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <Menu size={19} />
            </button>
          </>
        )}
      </div>
      <p className="nav-label">WORKSPACE</p>
      <Link href="/admin/dashboard" title="Overview" onClick={() => setMobileOpen(false)} className={`side-link ${pathname === '/admin/dashboard' ? 'active' : ''}`}>
        <LayoutDashboard size={18} /> <span className="side-link-label">Overview</span> <ChevronRight className="side-chevron" size={15} />
      </Link>
      <Link href="/admin/projects" title="Projects" onClick={() => setMobileOpen(false)} className={`side-link ${pathname?.startsWith('/admin/projects') ? 'active' : ''}`}>
        <Building2 size={18} /> <span className="side-link-label">Projects</span> <ChevronRight className="side-chevron" size={15} />
      </Link>
      <div className="sidebar-bottom"><div className="sidebar-user"><span className="user-avatar">{adminName.charAt(0).toUpperCase()}</span><span className="sidebar-user-details"><strong>{adminName}</strong><small>Administrator</small></span></div><button className="icon-button" title="Sign out" aria-label="Sign out" onClick={signOut}><LogOut size={17} /></button></div>
    </>
  );

  return (
    <div className={`admin-app${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="sidebar">{nav}</aside>
      <div className="mobile-topbar"><img src="/shilp-group-black-logo.svg" alt="Shilp Group" /><button className="icon-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
      {mobileOpen && <div className="mobile-drawer"><button className="icon-button drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>{nav}</div>}
      <main className="admin-main">{children}</main>
    </div>
  );
}
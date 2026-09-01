import { Activity, ArrowLeft, CalendarDays, Clock3, LayoutDashboard, MapPin, ShieldCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { SiteFooter } from './SiteFooter';
import { useAuth } from '../context/AuthContext';

const skipLink =
  'sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-slate-900 focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-200';

export function Layout() {
  const location = useLocation();
  return (
    <div className="app-shell flex min-h-screen flex-col">
      <a href="#main-content" className={skipLink}>Skip to main content</a>
      <Navbar />
      <div id="main-content" key={location.pathname} className="page-transition flex-1">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  );
}

export function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const links = [
    { label: 'Overview', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'Futsals', path: '/admin/futsals', icon: <MapPin size={18} /> },
    { label: 'Slots', path: '/admin/slots', icon: <CalendarDays size={18} /> },
    { label: 'Bookings', path: '/admin/bookings', icon: <Clock3 size={18} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={18} /> }
  ];

  return (
    // The admin console renders the site navbar too: without it there was no profile menu and
    // therefore no way to sign out of the console at all.
    <div className="app-shell flex min-h-screen flex-col">
      <a href="#main-content" className={skipLink}>Skip to main content</a>
      <Navbar />
      <div className="container-page page-transition flex-1 py-8">
        <div className="motion-section mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Admin Console</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Operations dashboard</h1>
            <p className="mt-2 text-slate-500">Signed in as {user?.name || 'Admin'}</p>
          </div>
          <Link to="/" className="btn-soft w-full md:w-auto">
            <ArrowLeft size={18} />
            Back to site
          </Link>
        </div>

        <div className="admin-grid">
          <aside className="panel motion-section h-max overflow-hidden lg:sticky lg:top-20">
            <div className="bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-sm font-black text-white">
                  {initials(user?.name || 'Admin')}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{user?.name || 'Admin'}</p>
                  <p className="truncate text-xs font-bold text-slate-300">{user?.email || 'Admin console'}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-green-300">Workspace</p>
                <p className="mt-1 text-sm font-bold text-slate-200">Operations control</p>
              </div>
            </div>

            <div className="p-3">
              <p className="mb-2 px-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Manage</p>
              <nav className="grid gap-1" aria-label="Admin sections">
                {links.map(({ label, path, icon }) => (
                  <NavLink
                    key={path}
                    end={path === '/admin'}
                    to={path}
                    className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-green-100 ${isActive ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
                  >
                    <span className="shrink-0">{icon}</span>
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="border-t border-slate-200 p-3">
              <p className="mb-2 px-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Focus</p>
              <div className="grid gap-2">
                <SidebarSignal icon={<Activity size={16} />} label="Live queue" value="Review bookings first" />
                <SidebarSignal icon={<ShieldCheck size={16} />} label="Access" value={user?.role || 'ADMIN'} />
              </div>
            </div>
          </aside>
          <div id="main-content" key={location.pathname} className="admin-content-motion min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function SidebarSignal({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-green-600">
        {icon}
        <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

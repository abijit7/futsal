import { ArrowLeft, CalendarDays, Clock3, LayoutDashboard, MapPin, Users } from 'lucide-react';
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
    { label: 'Overview', path: '/admin', icon: <LayoutDashboard size={17} /> },
    { label: 'Futsals', path: '/admin/futsals', icon: <MapPin size={17} /> },
    { label: 'Slots', path: '/admin/slots', icon: <CalendarDays size={17} /> },
    { label: 'Bookings', path: '/admin/bookings', icon: <Clock3 size={17} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={17} /> }
  ];

  return (
    // The admin console renders the site navbar too: without it there was no profile menu and
    // therefore no way to sign out of the console at all.
    <div className="app-shell flex min-h-screen flex-col">
      <a href="#main-content" className={skipLink}>Skip to main content</a>
      <Navbar />
      <div className="container-page flex-1 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-700">Admin console</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Operations</h1>
          </div>
          <Link to="/" className="btn-soft hidden min-h-10 rounded-xl px-4 py-2 text-sm sm:inline-flex">
            <ArrowLeft size={16} />
            Back to site
          </Link>
        </div>

        {/* Below lg the grid is a single column, so a vertical sidebar would push every page
            ~250px down the screen. Phones and tablets get a horizontal tab strip instead. */}
        <nav
          className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden"
          aria-label="Admin sections"
        >
          {links.map(({ label, path, icon }) => (
            <NavLink
              key={path}
              end={path === '/admin'}
              to={path}
              className={({ isActive }) => `flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-green-100 ${isActive ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
            >
              <span className="shrink-0">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-grid">
          <aside className="hidden h-max lg:block">
            <nav
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2"
              aria-label="Admin sections"
            >
              {links.map(({ label, path, icon }) => (
                <NavLink
                  key={path}
                  end={path === '/admin'}
                  to={path}
                  className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-green-100 ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <span className="shrink-0">{icon}</span>
                  {label}
                </NavLink>
              ))}
            </nav>
            <p className="mt-3 px-3 text-xs font-semibold text-slate-500">
              Signed in as {user?.name || 'Admin'}
            </p>
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

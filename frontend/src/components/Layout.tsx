import { ArrowLeft } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const location = useLocation();
  return (
    <div className="app-shell">
      <Navbar />
      <div key={location.pathname} className="page-transition">
        <Outlet />
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const links = [
    ['Overview', '/admin'],
    ['Futsals', '/admin/futsals'],
    ['Slots', '/admin/slots'],
    ['Bookings', '/admin/bookings'],
    ['Users', '/admin/users']
  ];
  return (
    <div className="container-page page-transition py-8">
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
        <aside className="panel motion-section h-max p-3">
          <Link to="/" className="mb-3 flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-green-200 hover:text-green-700">
            <ArrowLeft size={16} />
            Back to site
          </Link>
          {links.map(([label, path]) => (
            <NavLink
              key={path}
              end={path === '/admin'}
              to={path}
              className={({ isActive }) => `mb-1 block rounded-2xl px-4 py-3 text-sm font-bold transition ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {label}
            </NavLink>
          ))}
        </aside>
        <div key={location.pathname} className="admin-content-motion">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

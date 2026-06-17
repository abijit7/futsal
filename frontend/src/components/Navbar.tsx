import { Menu, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center justify-center whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkClass({ isActive })} w-full justify-start`;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path !== '/#about') return;
    event.preventDefault();
    setOpen(false);
    navigate('/#about');
    window.setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const nav = isAdmin
    ? [
        ['Dashboard', '/admin'],
        ['Futsals', '/admin/futsals'],
        ['Slots', '/admin/slots'],
        ['Bookings', '/admin/bookings'],
        ['Users', '/admin/users']
      ]
    : user
      ? [
          ['Dashboard', '/dashboard'],
          ['Futsals', '/venues'],
          ['Book Slot', '/booking'],
          ['My Bookings', '/my-bookings'],
          ['Profile', '/profile']
        ]
      : [
          ['Home', '/'],
          ['About', '/#about'],
          ['Futsals', '/venues']
        ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="container-page grid min-h-20 grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[minmax(190px,auto)_minmax(0,1fr)_minmax(220px,auto)]">
        <NavLink to="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
            <ShieldCheck size={24} className="text-green-400" />
          </div>
          <div className="min-w-0 leading-none">
            <div className="text-xl font-black tracking-tight text-slate-950">Mero<span className="text-green-600">Futsal</span></div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Book easy</div>
          </div>
        </NavLink>

        <nav className="hidden min-w-0 items-center justify-center gap-1 lg:flex">
          {nav.map(([label, path]) => <NavLink key={path} to={path} onClick={(event) => handleNavClick(event, path)} className={linkClass}>{label}</NavLink>)}
        </nav>

        <div className="hidden items-center justify-end gap-3 lg:flex">
          {!user ? (
            <>
              <NavLink to="/login" className="btn-soft px-4 py-2.5">Login</NavLink>
              <NavLink to="/register" className="btn-primary px-4 py-2.5">Sign Up</NavLink>
            </>
          ) : (
            <>
              <button className="btn-soft px-4 py-2.5" onClick={() => navigate('/venues')}>
                <Search size={16} /> Find pitch
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <UserRound size={18} className="text-green-600" />
                <span className="max-w-28 truncate text-sm font-bold text-slate-700">{user.name}</span>
              </div>
              <button className="btn-navy px-4 py-2.5" onClick={logout}>Logout</button>
            </>
          )}
        </div>

        <button
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-green-200 hover:text-green-700 focus:outline-none focus:ring-4 focus:ring-green-100 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <div className="container-page flex flex-col gap-2 py-4">
            {nav.map(([label, path]) => (
              <NavLink key={path} to={path} onClick={(event) => { setOpen(false); handleNavClick(event, path); }} className={mobileLinkClass}>{label}</NavLink>
            ))}
            {!user ? (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <NavLink to="/login" className="btn-soft" onClick={() => setOpen(false)}>Login</NavLink>
                <NavLink to="/register" className="btn-primary" onClick={() => setOpen(false)}>Sign Up</NavLink>
              </div>
            ) : (
              <button className="btn-navy mt-2" onClick={() => { logout(); setOpen(false); }}>Logout</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

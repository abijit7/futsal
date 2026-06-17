import { Facebook, Instagram, Mail, MapPin, Phone, ShieldCheck, Twitter } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer mt-auto bg-slate-950 text-slate-400">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_1fr] lg:gap-16">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
              <ShieldCheck size={24} className="text-green-600" />
            </div>
            <div className="leading-none">
              <div className="text-xl font-black tracking-tight">Mero<span className="text-green-400">Futsal</span></div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Book easy</div>
            </div>
          </Link>
          <p className="mt-6 max-w-sm text-base font-semibold leading-7 text-slate-400">
            Boost your game with MeroFutsal, where booking a pitch is fast, clear, and ready for match day.
          </p>
          <div className="mt-7 flex gap-3">
            <a className="footer-icon-btn" href="https://facebook.com" aria-label="Facebook">
              <Facebook size={18} />
            </a>
            <a className="footer-icon-btn" href="https://twitter.com" aria-label="Twitter">
              <Twitter size={18} />
            </a>
            <a className="footer-icon-btn" href="https://instagram.com" aria-label="Instagram">
              <Instagram size={18} />
            </a>
          </div>
        </div>

        <div>
          <h2 className="footer-heading">Explore</h2>
          <nav className="mt-6 grid gap-3">
            <Link className="footer-link" to="/venues">Futsals</Link>
            <Link className="footer-link" to="/booking">Book Slot</Link>
            <Link className="footer-link" to="/my-bookings">My Bookings</Link>
            <Link className="footer-link" to="/profile">Profile</Link>
          </nav>
        </div>

        <div>
          <h2 className="footer-heading">Contact</h2>
          <div className="mt-6 grid gap-5">
            <a className="footer-contact-row" href="mailto:info@merofutsal.com">
              <Mail size={21} />
              <span>info@merofutsal.com</span>
            </a>
            <div className="footer-contact-row">
              <MapPin size={21} />
              <span>Putalisadak - Star Mall, Kathmandu</span>
            </div>
            <a className="footer-contact-row" href="tel:+9779841063381">
              <Phone size={21} />
              <span>+977-9841063381</span>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm font-semibold text-slate-500">
        &copy; {new Date().getFullYear()} <span className="font-black text-green-400">MeroFutsal.</span> All rights reserved.
      </div>
    </footer>
  );
}

export function AdminLayout() {
  const { user } = useAuth();
  const links = [
    ['Overview', '/admin'],
    ['Futsals', '/admin/futsals'],
    ['Slots', '/admin/slots'],
    ['Bookings', '/admin/bookings'],
    ['Users', '/admin/users']
  ];
  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <p className="eyebrow">Admin Console</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Operations dashboard</h1>
        <p className="mt-2 text-slate-500">Signed in as {user?.name || 'Admin'}</p>
      </div>
      <div className="admin-grid">
        <aside className="panel h-max p-3">
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
        <Outlet />
      </div>
    </div>
  );
}

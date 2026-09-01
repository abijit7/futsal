import { ChevronDown, LayoutDashboard, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { BRAND_DISPLAY } from '../constants/brand';
import { useAuth } from '../context/AuthContext';
import { useAnimatedDisclosure } from '../hooks/useAnimatedDisclosure';

const HOW_IT_WORKS_PATH = '/#how-it-works';

/** Desktop nav item. slate-300 on the navy bar is 11.7:1; hover lifts it to white. */
const deskLink = ({ isActive }: { isActive: boolean }) =>
  `motion-press inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-400/60 ${
    isActive ? 'bg-white/10 text-green-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
  }`;

const mobileLink =
  'flex min-h-11 w-full items-center rounded-xl px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400/60';

export function Navbar() {
  const mobileMenu = useAnimatedDisclosure(220);
  const profileMenu = useAnimatedDisclosure(180);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = Boolean(user?.authToken);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const closeMenus = () => {
    mobileMenu.close();
    profileMenu.close();
  };

  // Route changes should never leave a menu hanging open behind the new page.
  useEffect(closeMenus, [location.pathname]);

  // The profile dropdown previously stayed open until its own button was clicked again.
  useEffect(() => {
    if (!profileMenu.isMounted) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) profileMenu.close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') profileMenu.close();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [profileMenu.isMounted]);

  /** Anchor links need a real href for middle-click, plus a manual scroll once routing settles. */
  const goToHowItWorks = (event: React.MouseEvent) => {
    event.preventDefault();
    closeMenus();
    navigate('/');
    window.setTimeout(
      () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      50
    );
  };

  const signOut = () => {
    closeMenus();
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full shadow-sm shadow-slate-950/10" style={{ background: 'var(--futsal-navy)' }}>
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link to="/" className="motion-press flex items-center gap-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/60">
            <BrandMark size={32} />
            <span className="text-lg font-bold tracking-wide text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {BRAND_DISPLAY}
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/venues" className={deskLink}>Find Venues</NavLink>
            <a href={HOW_IT_WORKS_PATH} onClick={goToHowItWorks} className={deskLink({ isActive: false })}>
              How it Works
            </a>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={profileMenu.toggle}
                  aria-haspopup="menu"
                  aria-expanded={profileMenu.isOpen}
                  className="motion-press flex min-h-11 items-center gap-2 rounded-xl px-3 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-green-400/60"
                  style={{ background: 'var(--futsal-navy-mid)' }}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--futsal-green)' }}>
                    {isAdmin ? 'AD' : initials(user?.name)}
                  </span>
                  <span className="hidden text-sm font-semibold text-white sm:block">
                    {isAdmin ? 'Admin' : user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown className={`text-slate-300 transition-transform duration-200 ${profileMenu.isOpen ? 'rotate-180' : ''}`} size={14} />
                </button>
                {profileMenu.isMounted && (
                  <div
                    className="motion-popover absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                    data-state={profileMenu.state}
                    role="menu"
                  >
                    <div className="border-b border-slate-200 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <MenuLink to={isAdmin ? '/admin' : '/dashboard'} onClick={closeMenus} icon={<LayoutDashboard size={15} />}>
                        {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
                      </MenuLink>
                      <MenuLink to="/profile" onClick={closeMenus} icon={<Settings size={15} />}>Settings</MenuLink>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={signOut}
                        className="flex min-h-11 w-full items-center gap-2 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:bg-red-50"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  to="/login"
                  className="motion-press inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400/60"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="motion-press inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold text-white transition-colors hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-green-300"
                  style={{ background: 'var(--futsal-green)' }}
                >
                  Get Started
                </Link>
              </div>
            )}

            <button
              onClick={mobileMenu.toggle}
              className="motion-press inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400/60 md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenu.isOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenu.isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenu.isMounted && (
        <div
          id="mobile-menu"
          className="motion-mobile-menu space-y-1 border-t border-white/10 px-4 py-3 md:hidden"
          data-state={mobileMenu.state}
          style={{ background: 'var(--futsal-navy-mid)' }}
        >
          <NavLink to="/venues" onClick={closeMenus} className={mobileLink}>Find Venues</NavLink>
          <a href={HOW_IT_WORKS_PATH} onClick={goToHowItWorks} className={mobileLink}>How it Works</a>
          {isLoggedIn ? (
            <>
              <NavLink to={isAdmin ? '/admin' : '/dashboard'} onClick={closeMenus} className={mobileLink}>
                {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
              </NavLink>
              <NavLink to="/profile" onClick={closeMenus} className={mobileLink}>Settings</NavLink>
              <button type="button" onClick={signOut} className={`${mobileLink} text-red-300 hover:text-red-200`}>
                Sign Out
              </button>
            </>
          ) : (
            <div className="grid gap-2 pt-2">
              <Link to="/login" onClick={closeMenus} className="btn-soft w-full">Sign In</Link>
              <Link to="/register" onClick={closeMenus} className="btn-primary w-full">Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function MenuLink({ to, onClick, icon, children }: { to: string; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className="flex min-h-11 w-full items-center gap-2 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:bg-slate-50"
    >
      {icon}
      {children}
    </Link>
  );
}

function initials(name?: string) {
  if (!name) return <User size={14} />;
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

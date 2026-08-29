import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAnimatedDisclosure } from '../hooks/useAnimatedDisclosure';

export function Navbar() {
  const mobileMenu = useAnimatedDisclosure(220);
  const profileMenu = useAnimatedDisclosure(180);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = Boolean(user?.authToken);

  const go = (path: string) => {
    mobileMenu.close();
    profileMenu.close();
    if (path === '/#how-it-works') {
      navigate('/');
      window.setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      return;
    }
    navigate(path);
  };

  const isActive = (path: string) => path !== '/' && location.pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 w-full shadow-sm shadow-slate-950/10" style={{ background: 'var(--futsal-navy)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button onClick={() => go('/')} className="motion-press flex items-center gap-2 focus:outline-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--futsal-green)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                <path d="M12 2L14.5 7H9.5L12 2Z" fill="white" />
                <path d="M12 22L9.5 17H14.5L12 22Z" fill="white" />
                <path d="M2 12L7 9.5V14.5L2 12Z" fill="white" />
                <path d="M22 12L17 14.5V9.5L22 12Z" fill="white" />
                <polygon points="12,7 14.5,9.5 13.5,12.5 10.5,12.5 9.5,9.5" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-wide text-white" style={{ fontFamily: 'var(--font-display)' }}>
              FUTSALGO
            </span>
          </button>

          <div className="hidden items-center gap-1 md:flex">
            <button
              onClick={() => go('/venues')}
              className="motion-press rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: isActive('/venues') ? 'var(--futsal-green-light)' : '#94A3B8' }}
            >
              Find Venues
            </button>
            <button
              onClick={() => go('/#how-it-works')}
              className="motion-press rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: '#94A3B8' }}
            >
              How it Works
            </button>
            <button
              onClick={() => go('/booking')}
              className="motion-press rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: isActive('/booking') ? 'var(--futsal-green-light)' : '#94A3B8' }}
            >
              Pricing
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <button className="motion-press relative rounded-lg p-2 transition-colors" style={{ color: '#94A3B8' }} aria-label="Notifications">
                <Bell size={18} />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ background: 'var(--futsal-green)' }} aria-hidden="true" />
              </button>
            )}

            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={profileMenu.toggle}
                  className="motion-press flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors"
                  style={{ background: 'var(--futsal-navy-mid)' }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--futsal-green)' }}>
                    {isAdmin ? 'AD' : initials(user?.name)}
                  </div>
                  <span className="hidden text-sm font-medium text-white sm:block">{isAdmin ? 'Admin' : user?.name?.split(' ')[0] || 'User'}</span>
                  <ChevronDown className={`transition-transform duration-200 ${profileMenu.isOpen ? 'rotate-180' : ''}`} size={14} style={{ color: '#64748B' }} />
                </button>
                {profileMenu.isMounted && (
                  <div className="motion-popover absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border bg-white shadow-xl" data-state={profileMenu.state} style={{ borderColor: 'var(--border)' }}>
                    <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--futsal-navy)' }}>{user?.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button onClick={() => go(isAdmin ? '/admin' : '/dashboard')} className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-50" style={{ color: 'var(--futsal-navy)' }}>
                        <LayoutDashboard size={14} />
                        {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
                      </button>
                      <button onClick={() => go('/profile')} className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-50" style={{ color: 'var(--futsal-navy)' }}>
                        <Settings size={14} />
                        Settings
                      </button>
                      <button onClick={() => { logout(); go('/'); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-red-50" style={{ color: '#DC2626' }}>
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="motion-press rounded-lg px-4 py-2 text-sm font-medium transition-colors" style={{ color: '#CBD5E1' }}>
                  Sign In
                </Link>
                <Link to="/register" className="motion-press rounded-lg px-4 py-2 text-sm font-semibold transition-colors" style={{ background: 'var(--futsal-green)', color: 'white' }}>
                  Get Started
                </Link>
              </div>
            )}

            <button onClick={mobileMenu.toggle} className="motion-press rounded-lg p-2 md:hidden" style={{ color: '#94A3B8' }} aria-label="Toggle navigation" aria-expanded={mobileMenu.isOpen} aria-controls="mobile-menu">
              {mobileMenu.isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenu.isMounted && (
        <div id="mobile-menu" className="motion-mobile-menu space-y-1 border-t px-4 py-3 md:hidden" data-state={mobileMenu.state} style={{ background: 'var(--futsal-navy-mid)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <button onClick={() => go('/venues')} className="block w-full rounded-lg px-3 py-2 text-left text-sm" style={{ color: '#CBD5E1' }}>Find Venues</button>
          <button onClick={() => go('/#how-it-works')} className="block w-full rounded-lg px-3 py-2 text-left text-sm" style={{ color: '#CBD5E1' }}>How it Works</button>
          <button onClick={() => go('/booking')} className="block w-full rounded-lg px-3 py-2 text-left text-sm" style={{ color: '#CBD5E1' }}>Pricing</button>
          {!isLoggedIn && (
            <button onClick={() => go('/login')} className="mt-2 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold" style={{ color: 'var(--futsal-green-light)' }}>Sign In / Register</button>
          )}
          {isLoggedIn && (
            <button onClick={() => go(isAdmin ? '/admin' : '/dashboard')} className="mt-2 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold" style={{ color: 'var(--futsal-green-light)' }}>{isAdmin ? 'Admin Dashboard' : 'My Dashboard'}</button>
          )}
        </div>
      )}
    </nav>
  );
}

function initials(name?: string) {
  if (!name) return <User size={14} />;
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { BRAND_DISPLAY, BRAND_TAGLINE, EVENING_FROM, POPULAR_CITIES } from '../constants/brand';
import { useAuth } from '../context/AuthContext';

/**
 * Site-wide footer.
 *
 * <p>Shaped around the one thing a footer on this site can usefully do: someone has reached the
 * bottom of a page without booking, so give them the shortest way back in. That is the evening
 * link and the city list, which are the loudest things here; the navigation columns are quiet
 * beside them.
 *
 * <p>Every link points at a route that exists. An earlier version of this footer was fifteen
 * `href="#"` placeholders, and the sparseness of the real link set is not a reason to return to
 * that - it is a reason to give the space to the links that do work.
 *
 * <p>Text colours are held at or above 4.5:1 on the navy ground: slate-300 is 11.7:1 and slate-400
 * is 6.8:1, where the old #475569 was 2.3:1 and effectively invisible.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  const { user, isAdmin } = useAuth();
  const isLoggedIn = Boolean(user?.authToken);

  // Offering "Sign in" and "Create account" to someone who is already signed in reads as a bug.
  const accountLinks = isLoggedIn
    ? [
        { label: isAdmin ? 'Admin console' : 'My dashboard', to: isAdmin ? '/admin' : '/dashboard' },
        { label: 'My bookings', to: '/my-bookings' },
        { label: 'Profile settings', to: '/profile' }
      ]
    : [
        { label: 'Sign in', to: '/login' },
        { label: 'Create account', to: '/register' }
      ];

  return (
    <footer className="border-t border-white/10 bg-navy">
      <div className="container-page py-14">
        {/* Brand column plus three link groups. The brand column is the widest because it carries
            the one thing this footer is really for: the way back into a booking. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-12">
          <div>
            <div className="flex items-center gap-2">
              <BrandMark size={28} />
              <span className="text-lg font-bold tracking-wide text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {BRAND_DISPLAY}
              </span>
            </div>

            <p
              className="mt-6 uppercase leading-none tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', fontWeight: 800 }}
            >
              Playing tonight?
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-300">{BRAND_TAGLINE}</p>

            {/* Venues.tsx reads a `from` with no `date` as today, so this single parameter is a
                complete "courts free this evening" query. Worded as what it shows, not as a
                promise that something is free. */}
            <Link
              to={`/venues?from=${EVENING_FROM}`}
              className="btn-primary mt-5 min-h-11 w-full rounded-xl px-5 py-3 text-sm sm:w-auto"
            >
              See this evening's courts
            </Link>
          </div>

          <FooterColumn
            title="Book"
            links={[
              { label: 'Find venues', to: '/venues' },
              { label: 'How it works', to: '/#how-it-works' },
              { label: 'Terms of service', to: '/terms' }
            ]}
          />

          {/* Owner routes are guarded, so a visitor without an owner account is sent to sign in
              rather than to a page that pretends to be theirs. */}
          <FooterColumn
            title="For owners"
            links={[
              { label: 'Owner dashboard', to: '/admin' },
              { label: 'Publish slots', to: '/admin/slots' },
              { label: 'Manage bookings', to: '/admin/bookings' }
            ]}
          />

          <FooterColumn title="Account" links={accountLinks} />
        </div>

        <nav className="mt-10 flex flex-wrap gap-2" aria-label="Cities we cover">
          {POPULAR_CITIES.map((city) => (
            <Link
              key={city}
              to={`/venues?q=${encodeURIComponent(city)}`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-green-400/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60"
              style={{ background: 'var(--futsal-navy-mid)' }}
            >
              {city}
            </Link>
          ))}
        </nav>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/10 pt-6">
          <p className="text-xs text-slate-400">© {year} {BRAND_DISPLAY}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              to="/terms"
              className="text-xs text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="text-xs text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map(({ label, to }) => (
          <li key={to}>
            <Link
              to={to}
              className="inline-flex min-h-6 items-center text-sm text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

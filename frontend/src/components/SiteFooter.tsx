import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { BRAND_DISPLAY, BRAND_TAGLINE, POPULAR_CITIES } from '../constants/brand';

/**
 * Site-wide footer.
 *
 * <p>Every link here points at a route that exists - the previous footer was fifteen `href="#"`
 * placeholders. Text colours are held at or above 4.5:1 on the navy ground: slate-300 is 11.7:1
 * and slate-400 is 6.8:1, where the old #475569 was 2.3:1 and effectively invisible.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10" style={{ background: 'var(--futsal-navy)' }}>
      <div className="container-page py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <BrandMark size={28} />
              <span className="text-lg font-bold tracking-wide text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {BRAND_DISPLAY}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">{BRAND_TAGLINE}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {POPULAR_CITIES.map((city) => (
                <Link
                  key={city}
                  to={`/venues?q=${encodeURIComponent(city)}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-green-400/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400/60"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>

          <FooterColumn
            title="Book"
            links={[
              { label: 'Find venues', to: '/venues' },
              { label: 'How it works', to: '/#how-it-works' }
            ]}
          />
          <FooterColumn
            title="Account"
            links={[
              { label: 'Sign in', to: '/login' },
              { label: 'Create account', to: '/register' },
              { label: 'My bookings', to: '/my-bookings' }
            ]}
          />
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-xs text-slate-400">© {year} {BRAND_DISPLAY}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map(({ label, to }) => (
          <li key={to}>
            <Link
              to={to}
              className="inline-flex min-h-6 items-center text-sm text-slate-300 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400/60"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

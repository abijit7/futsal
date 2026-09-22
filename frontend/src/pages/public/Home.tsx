import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BadgeCheck, Calendar, CalendarClock, ChevronRight, Clock, MapPin, Search, Trophy, Wallet
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { futsalApi } from '../../api/modules';
import { VenueCard } from '../../components/VenueCard';
import { VenueGridSkeleton } from '../../components/State';
import { Notice } from '../../components/UI';
import { POPULAR_CITIES } from '../../constants/brand';
import type { Futsal } from '../../types/api';
import { todayInput } from '../../utils/format';

/**
 * Every card states something the app actually does: the slot API is live, both payment methods
 * exist, the two-hour cancellation window is the promise the booking panel already makes, and
 * `verified` is a real field on the venue.
 */
const WHAT_YOU_GET = [
  { icon: MapPin, title: 'Courts near you', detail: 'Search by city, area or venue name across Nepal.' },
  { icon: CalendarClock, title: 'Live availability', detail: 'Each venue publishes its real schedule, hour by hour.' },
  { icon: Wallet, title: 'eSewa or cash', detail: 'Pay the gateway now, or settle at the venue when you play.' },
  { icon: BadgeCheck, title: 'Verified venues', detail: 'Listings confirmed with the operator carry a verified mark.' }
];

const HOW_IT_WORKS = [
  { icon: Search, title: 'Find a venue', detail: 'Search by city, date and the time you want to play.' },
  { icon: Clock, title: 'Pick a slot', detail: 'Open a venue and choose from the hours still free.' },
  { icon: Wallet, title: 'Book and pay', detail: 'eSewa confirms instantly; cash is settled at the court.' },
  { icon: Trophy, title: 'Play', detail: 'Track or cancel from My Bookings, free up to 2 hours before.' }
];

const FEATURED_COUNT = 6;

export function Home() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [featuredVenues, setFeaturedVenues] = useState<Futsal[]>([]);
  const [totalVenues, setTotalVenues] = useState(0);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venueError, setVenueError] = useState('');

  // The hero backdrop is a venue that actually exists. With nothing uploaded the gradient and
  // grid stand on their own rather than falling back to stock imagery.
  const heroPhoto = useMemo(
    () => featuredVenues.map((venue) => venue.imageUrl || venue.imageUrls?.[0]).find(Boolean),
    [featuredVenues]
  );

  const handleSearch = (location = searchLocation) => {
    const params = new URLSearchParams();
    const query = location.trim();
    if (query) params.set('q', query);
    if (searchDate) params.set('date', searchDate);
    navigate(`/venues${params.toString() ? `?${params.toString()}` : ''}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let active = true;
    setLoadingVenues(true);
    setVenueError('');
    futsalApi.list({ page: 0, size: FEATURED_COUNT, sort: 'recommended' })
      .then((data) => {
        if (!active) return;
        setFeaturedVenues(data.items || []);
        setTotalVenues(data.totalItems || 0);
      })
      .catch((err) => {
        if (active) setVenueError(err instanceof Error ? err.message : 'Failed to load venues');
      })
      .finally(() => {
        if (active) setLoadingVenues(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <main>
      <section className="relative overflow-hidden bg-navy">
        {heroPhoto && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroPhoto})` }} aria-hidden="true" />
        )}
        {/* Opaque enough to be the contrast floor on its own, so the white headline holds whether
            or not a venue photo loaded behind it. */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(13,27,42,0.95) 0%, rgba(17,38,54,0.92) 55%, rgba(21,128,61,0.55) 100%)' }}
          aria-hidden="true"
        />
        {/* Pitch grid, drawn rather than photographed. */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }}
          aria-hidden="true"
        />

        <div className="container-page relative pb-28 pt-16 sm:pt-20">
          <div className="max-w-3xl">
            {/* A real count or nothing at all. */}
            {!loadingVenues && !venueError && totalVenues > 0 && (
              <p className="mb-7 inline-flex items-center gap-2 rounded-full bg-green-500/15 px-4 py-1.5 text-sm font-semibold text-green-300 ring-1 ring-green-400/30">
                <span className="h-2 w-2 rounded-full bg-green-400" aria-hidden="true" />
                <span className="tabular-nums">{totalVenues}</span> {totalVenues === 1 ? 'venue' : 'venues'} available now
              </p>
            )}

            <h1
              className="mb-6 uppercase leading-[0.92] tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.75rem, 6vw, 4.5rem)', fontWeight: 800, letterSpacing: '-0.01em' }}
            >
              Book Your <span className="text-green-400">Futsal</span>
              <br />
              Court Instantly
            </h1>

            <p className="mb-9 max-w-xl text-lg leading-relaxed text-on-navy">
              Every listed court&rsquo;s live schedule in one place. Pick a slot, then pay with eSewa
              or cash at the venue.
            </p>

            <form
              onSubmit={(event) => { event.preventDefault(); handleSearch(); }}
              className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-md sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <MapPin size={18} className="shrink-0 text-green-400" aria-hidden="true" />
                <input
                  type="text"
                  aria-label="City, area or venue name"
                  placeholder="City, area or venue name..."
                  value={searchLocation}
                  onChange={(event) => setSearchLocation(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-300 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <Calendar size={18} className="shrink-0 text-green-400" aria-hidden="true" />
                <input
                  type="date"
                  aria-label="Date"
                  min={todayInput()}
                  value={searchDate}
                  onChange={(event) => setSearchDate(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-white focus:outline-none [color-scheme:dark]"
                />
              </div>
              <button type="submit" className="btn-primary min-h-12 shrink-0 rounded-xl sm:min-w-44">
                <Search size={16} aria-hidden="true" />
                Search Courts
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSearch(city)}
                  className="min-h-9 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-medium text-on-navy transition hover:border-green-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Curved hand-off into the page ground, as in the reference. */}
        <svg
          className="absolute inset-x-0 bottom-0 h-12 w-full text-page sm:h-16"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 80V40C240 8 480 0 720 12c240 12 480 28 720 28v40z" fill="currentColor" />
        </svg>
      </section>

      <section className="container-page py-14">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHAT_YOU_GET.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="rounded-panel border border-slate-200 bg-white p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-100">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pb-16">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Recommended venues</h2>
            {!loadingVenues && !venueError && totalVenues > 0 && (
              <p className="mt-1 text-sm tabular-nums text-muted">
                Showing {Math.min(featuredVenues.length, totalVenues)} of {totalVenues}
              </p>
            )}
          </div>
          <Link to="/venues" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-green-700 transition hover:text-green-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-100">
            View all <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {loadingVenues ? (
          <VenueGridSkeleton count={FEATURED_COUNT} />
        ) : venueError ? (
          <Notice tone="red">{venueError}</Notice>
        ) : featuredVenues.length === 0 ? (
          <div className="panel p-8">
            <h3 className="font-semibold text-slate-950">No venues added yet</h3>
            <p className="mt-1 text-base text-muted">Venues added from the admin panel appear here automatically.</p>
          </div>
        ) : (
          <div className="motion-stagger grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredVenues.map((venue) => <VenueCard key={venue.futsalId} futsal={venue} />)}
          </div>
        )}
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-navy py-20">
        <div className="container-page">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-green-400">Simple process</p>
          <h2
            className="mt-3 text-center uppercase leading-none tracking-tight text-white"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontWeight: 800 }}
          >
            Book in 4 easy steps
          </h2>

          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ icon: Icon, title, detail }, index) => (
              <li key={title} className="relative">
                {/* The connector only makes sense between columns, so it stops at the last one. */}
                {index < HOW_IT_WORKS.length - 1 && (
                  <span className="absolute left-16 right-0 top-6 hidden h-px bg-green-400/20 lg:block" aria-hidden="true" />
                )}
                <span
                  className="block text-green-400/20"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '3.25rem', fontWeight: 800, lineHeight: 0.8 }}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-400 ring-1 ring-green-400/25">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-on-navy-muted">{detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Owner accounts are granted rather than self-served, so this points at sign-in instead of
          promising a listing flow the app does not have. */}
      <section className="container-page py-16">
        <div className="relative overflow-hidden rounded-panel bg-green-600 p-8 sm:p-12">
          <span className="pointer-events-none absolute -right-16 -top-24 h-96 w-96 rounded-full bg-white/10" aria-hidden="true" />
          <span className="pointer-events-none absolute -bottom-32 right-24 h-72 w-72 rounded-full bg-white/5" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <h2
              className="uppercase leading-none tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', fontWeight: 800 }}
            >
              Run a futsal venue?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-green-50">
              Venue owners publish slots, approve bookings and track refunds from the owner dashboard.
              Sign in with the account your venue was set up with.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/login" className="btn-navy rounded-xl">
                Sign in to manage <ChevronRight size={16} aria-hidden="true" />
              </Link>
              <Link
                to="/venues"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/40 px-5 py-3 font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
              >
                Browse venues
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, ChevronRight, MapPin, Search, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { futsalApi, slotApi } from '../../api/modules';
import { VenueCard } from '../../components/VenueCard';
import { POPULAR_CITIES } from '../../constants/brand';
import type { Futsal } from '../../types/api';
import { money, todayInput } from '../../utils/format';

/**
 * Booking is four self-evident steps sitting directly under a search box that demonstrates them,
 * so it gets one line rather than the full-bleed section it used to have. The `how-it-works`
 * anchor stays because Navbar.tsx links to it.
 */
const HOW_IT_WORKS = ['Search', 'Pick a slot', 'Pay with eSewa or cash', 'Play'];

export function Home() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [featuredVenues, setFeaturedVenues] = useState<Futsal[]>([]);
  const [venueCount, setVenueCount] = useState<number | null>(null);
  const [slotsToday, setSlotsToday] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{ low: number; high: number } | null>(null);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venueError, setVenueError] = useState('');

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
    futsalApi.list({ page: 0, size: 6, sort: 'recommended' })
      .then((data) => {
        if (!active) return;
        setFeaturedVenues(data.items || []);
        // The hero badge reports the catalogue's real size rather than a hardcoded claim.
        setVenueCount(typeof data.totalItems === 'number' ? data.totalItems : null);
      })
      .catch((err) => {
        if (active) setVenueError(err instanceof Error ? err.message : 'Failed to load venues');
      })
      .finally(() => {
        if (active) setLoadingVenues(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    // Every figure in the row is measured. The three probes settle independently so that one
    // failing drops its own fact rather than blanking the row or, worse, showing a zero.
    Promise.allSettled([
      slotApi.available({ slotDate: todayInput(), page: 0, size: 1 }),
      futsalApi.list({ page: 0, size: 1, sort: 'price-low' }),
      futsalApi.list({ page: 0, size: 1, sort: 'price-high' })
    ]).then(([today, cheapest, dearest]) => {
      if (!active) return;
      if (today.status === 'fulfilled' && typeof today.value.totalItems === 'number') {
        setSlotsToday(today.value.totalItems);
      }
      const low = cheapest.status === 'fulfilled' ? cheapest.value.items?.[0]?.hourlyPrice : undefined;
      const high = dearest.status === 'fulfilled' ? dearest.value.items?.[0]?.hourlyPrice : undefined;
      if (typeof low === 'number' && typeof high === 'number') setPriceRange({ low, high });
    });
    return () => { active = false; };
  }, []);

  const facts = [
    venueCount !== null && venueCount > 0
      ? { value: String(venueCount), label: venueCount === 1 ? 'venue listed' : 'venues listed', icon: MapPin }
      : null,
    slotsToday !== null
      ? { value: String(slotsToday), label: slotsToday === 1 ? 'slot free today' : 'slots free today', icon: Calendar }
      : null,
    priceRange
      ? {
          value: priceRange.low === priceRange.high
            ? money(priceRange.low)
            : `${money(priceRange.low)}\u2013${priceRange.high.toLocaleString('en-NP')}`,
          label: 'per hour',
          icon: Wallet
        }
      : null
  ].filter((fact): fact is { value: string; label: string; icon: typeof MapPin } => fact !== null);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'var(--futsal-navy)' }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(/venue-placeholder.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(13,27,42,0.97) 0%, rgba(13,27,42,0.75) 60%, rgba(22,163,74,0.25) 100%)' }} />
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.5) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.5) 61px)' }}
        />

        <div className="container-page relative pb-14 pt-14">
          <div className="max-w-3xl">
            <h1
              className="mb-5 uppercase leading-none tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)', fontWeight: 800, letterSpacing: '-0.01em' }}
            >
              Book Your <span className="text-green-400">Futsal</span>
              <br />
              Court Instantly
            </h1>

            <p className="mb-7 max-w-xl text-lg leading-relaxed text-slate-300">
              Every listed court&rsquo;s live schedule in one place. Pick a slot, then pay with eSewa
              or cash at the venue.
            </p>

            {/* Search */}
            <form
              onSubmit={(event) => { event.preventDefault(); handleSearch(); }}
              className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-md sm:flex-row"
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
              <button type="submit" className="btn-primary min-h-12 shrink-0 sm:min-w-36">
                <Search size={16} />
                Search Courts
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSearch(city)}
                  className="min-h-8 rounded-full border border-white/15 bg-white/10 px-3 text-xs font-semibold text-slate-200 transition hover:border-green-400/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400/60"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', height: 60 }} aria-hidden="true">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20V60Z" fill="var(--background)" />
          </svg>
        </div>
      </section>

      {/* Measured, or absent */}
      {facts.length > 0 && (
        <section className="container-page -mt-4 mb-16">
          <div className="panel flex flex-wrap items-center gap-x-8 gap-y-4 px-6 py-5">
            {facts.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon size={16} className="shrink-0 text-green-600" aria-hidden="true" />
                <p className="text-sm text-slate-500">
                  <span className="text-base font-bold text-slate-950">{value}</span> {label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured venues */}
      <section className="container-page mb-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Recommended</p>
            <h2 className="mt-2 uppercase text-slate-950" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700 }}>
              Featured Venues
            </h2>
          </div>
          <Link to="/venues" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-green-700 transition hover:text-green-800 focus:outline-none focus:ring-4 focus:ring-green-100">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loadingVenues ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="panel h-96 animate-pulse" />)}
          </div>
        ) : venueError ? (
          <div className="panel border-red-100 bg-red-50 p-8 text-sm font-bold text-red-700">{venueError}</div>
        ) : featuredVenues.length === 0 ? (
          <div className="panel p-8">
            <h3 className="font-bold text-slate-950">No venues added yet</h3>
            <p className="mt-1 text-sm text-slate-500">Venues added from the admin panel appear here automatically.</p>
          </div>
        ) : (
          <div className="motion-stagger grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredVenues.map((venue) => <VenueCard key={venue.futsalId} futsal={venue} />)}
          </div>
        )}
      </section>

      {/* How it works — one line, not a section */}
      <section id="how-it-works" className="container-page scroll-mt-24 pb-20">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-slate-500">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step} className="flex items-center gap-3">
              {index > 0 && <ChevronRight size={14} className="text-slate-300" aria-hidden="true" />}
              <span className={index === HOW_IT_WORKS.length - 1 ? 'text-green-700' : undefined}>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

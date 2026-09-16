import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, ChevronRight, MapPin, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { futsalApi } from '../../api/modules';
import { VenueCard } from '../../components/VenueCard';
import { POPULAR_CITIES } from '../../constants/brand';
import type { Futsal } from '../../types/api';
import { todayInput } from '../../utils/format';

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
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'var(--futsal-navy)' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--futsal-navy) 0%, var(--futsal-navy-mid) 62%, rgba(22,163,74,0.28) 100%)' }} />

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
      </section>

      {/* Featured venues. Carries its own top margin: the measured-stats row that used to sit
          between it and the hero was providing that gap. */}
      <section className="container-page mt-14 mb-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-950">Recommended venues</h2>
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

import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Clock, MapPin, Search, Shield, Trophy, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { futsalApi } from '../../api/modules';
import { VenueCard } from '../../components/VenueCard';
import { BRAND_NAME, BRAND_TAGLINE, POPULAR_CITIES } from '../../constants/brand';
import type { Futsal } from '../../types/api';
import { todayInput } from '../../utils/format';

const HIGHLIGHTS = [
  { label: 'Live venue listings', value: 'Updated', icon: MapPin },
  { label: 'Slot availability', value: 'Real-time', icon: Calendar },
  { label: 'Secure booking', value: 'Instant', icon: Users },
  { label: 'Cities across Nepal', value: 'Growing', icon: Trophy }
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Find a Venue', desc: 'Search by location, date, and time. Filter by court type, price, and amenities.', icon: Search },
  { step: '02', title: 'Pick a Slot', desc: 'Choose from real-time available time slots that suit your schedule.', icon: Clock },
  { step: '03', title: 'Book & Pay', desc: 'Secure checkout with eSewa, Khalti, or cash at the venue.', icon: Shield },
  { step: '04', title: 'Play!', desc: 'Show up and play. Manage or cancel bookings anytime from your dashboard.', icon: Trophy }
];

export function Home() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [featuredVenues, setFeaturedVenues] = useState<Futsal[]>([]);
  const [venueCount, setVenueCount] = useState<number | null>(null);
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
    futsalApi.list({ page: 0, size: 3, sort: 'recommended' })
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

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'var(--futsal-navy)' }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1520470082789-e347ad8b1944?w=1400&h=700&fit=crop&auto=format)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(13,27,42,0.97) 0%, rgba(13,27,42,0.75) 60%, rgba(22,163,74,0.25) 100%)' }} />
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.5) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.5) 61px)' }}
        />

        <div className="container-page relative pb-28 pt-20">
          <div className="max-w-3xl">
            {venueCount !== null && venueCount > 0 && (
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                {venueCount} {venueCount === 1 ? 'venue' : 'venues'} available now
              </p>
            )}

            <h1
              className="mb-6 uppercase leading-none tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.75rem, 7vw, 5.5rem)', fontWeight: 800, letterSpacing: '-0.01em' }}
            >
              Book Your <span className="text-green-400">Futsal</span>
              <br />
              Court Instantly
            </h1>

            <p className="mb-10 max-w-xl text-lg leading-relaxed text-slate-300">
              Find and book the best futsal courts near you. Real-time availability, instant
              confirmation, and hassle-free payments.
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

      {/* Highlights */}
      <section className="container-page -mt-4 mb-16">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="panel p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--secondary)' }}>
                <Icon size={18} className="text-green-600" aria-hidden="true" />
              </div>
              <p className="mb-1 text-2xl font-bold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured venues */}
      <section className="container-page mb-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Top rated</p>
            <h2 className="mt-2 uppercase text-slate-950" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700 }}>
              Featured Venues
            </h2>
          </div>
          <Link to="/venues" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-green-700 transition hover:text-green-800 focus:outline-none focus:ring-4 focus:ring-green-100">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loadingVenues ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="panel h-96 animate-pulse" />)}
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

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-20" style={{ background: 'var(--futsal-navy)' }}>
        <div className="container-page">
          <div className="mb-14 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-green-400">Simple process</p>
            <h2 className="uppercase text-white" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700 }}>
              Book in 4 Easy Steps
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, index) => (
              <div key={step} className="relative">
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute left-full top-8 hidden h-px w-full bg-green-500/30 lg:block" aria-hidden="true" />
                )}
                <div className="relative z-10">
                  <p className="mb-4 text-5xl font-black leading-none text-green-500/25" style={{ fontFamily: 'var(--font-display)' }}>{step}</p>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/30 bg-green-500/15">
                    <Icon size={22} className="text-green-400" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-bold text-white">{title}</h3>
                  {/* slate-400 on navy is 6.8:1; the previous #64748B was 3.7:1. */}
                  <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container-page py-20">
        <div
          className="relative overflow-hidden rounded-3xl p-10 md:p-14"
          style={{ background: 'linear-gradient(135deg, var(--futsal-green-dark) 0%, var(--futsal-green) 100%)' }}
        >
          <div className="absolute bottom-0 right-0 top-0 opacity-10" aria-hidden="true">
            <svg viewBox="0 0 200 200" fill="none" className="h-full w-auto">
              <circle cx="150" cy="50" r="120" stroke="white" strokeWidth="60" />
            </svg>
          </div>
          <div className="relative max-w-2xl">
            <h2 className="mb-4 uppercase text-white" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900 }}>
              Ready to Play?
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-white/90">
              {BRAND_TAGLINE} Create a free {BRAND_NAME} account to book courts, track your
              reservations, and pay however suits you.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/venues" className="btn-navy">
                Find a venue <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

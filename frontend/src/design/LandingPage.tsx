import { useEffect, useState } from "react";
import { Search, MapPin, Clock, Star, ChevronRight, Shield, Zap, Users, Trophy, ArrowRight, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { futsalApi } from "../api/modules";
import type { Futsal } from "../types/api";
import { imageForVenue, money, todayInput } from "../utils/format";

type View = "landing" | "venues" | "venue-detail" | "booking" | "confirmation" | "user-dashboard" | "admin-dashboard";

interface LandingPageProps {
  onNavigate: (view: View) => void;
}

const STATS = [
  { label: "Active Venues", value: "200+", icon: MapPin },
  { label: "Bookings Made", value: "50K+", icon: Calendar },
  { label: "Happy Players", value: "25K+", icon: Users },
  { label: "Cities Covered", value: "15", icon: Trophy },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Find a Venue", desc: "Search by location, date, and time. Filter by court type, price, and amenities.", icon: Search },
  { step: "02", title: "Pick a Slot", desc: "Choose from real-time available time slots that suit your schedule.", icon: Clock },
  { step: "03", title: "Book & Pay", desc: "Secure checkout in seconds. Receive instant confirmation via email.", icon: Shield },
  { step: "04", title: "Play!", desc: "Show up and play. Manage or reschedule bookings anytime from your dashboard.", icon: Trophy },
];

export function LandingPage({ onNavigate }: LandingPageProps) {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [featuredVenues, setFeaturedVenues] = useState<Futsal[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venueError, setVenueError] = useState("");

  const handleSearch = (location = searchLocation) => {
    const params = new URLSearchParams();
    const query = location.trim();
    if (query) params.set("q", query);
    if (searchDate) params.set("date", searchDate);
    navigate(`/venues${params.toString() ? `?${params.toString()}` : ""}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let active = true;
    setLoadingVenues(true);
    setVenueError("");
    futsalApi.list({ page: 0, size: 3, sort: "recommended" })
      .then((data) => {
        if (active) setFeaturedVenues(data.items || []);
      })
      .catch((err) => {
        if (active) setVenueError(err instanceof Error ? err.message : "Failed to load venues");
      })
      .finally(() => {
        if (active) setLoadingVenues(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: "var(--futsal-navy)" }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1520470082789-e347ad8b1944?w=1400&h=700&fit=crop&auto=format)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,27,42,0.97) 0%, rgba(13,27,42,0.75) 60%, rgba(22,163,74,0.25) 100%)" }} />

        {/* Decorative grid lines */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.5) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.5) 61px)"
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "rgba(22,163,74,0.2)", color: "var(--futsal-green-light)", border: "1px solid rgba(22,163,74,0.3)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--futsal-green-light)" }} />
              200+ Venues Available Now
            </div>

            <h1
              className="mb-6 leading-none tracking-tight uppercase"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                fontWeight: 800,
                color: "white",
                letterSpacing: "-0.01em",
              }}
            >
              Book Your{" "}
              <span style={{ color: "var(--futsal-green-light)" }}>Futsal</span>
              <br />
              Court Instantly
            </h1>

            <p className="text-lg mb-10 max-w-xl leading-relaxed" style={{ color: "#94A3B8" }}>
              Find and book the best futsal courts near you. Real-time availability, instant confirmation, and hassle-free payments.
            </p>

            {/* Search Box */}
            <div className="rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                <MapPin size={18} style={{ color: "var(--futsal-green-light)" }} />
                <input
                  type="text"
                  placeholder="City, area or venue name..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-500 text-white"
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                <Calendar size={18} style={{ color: "var(--futsal-green-light)" }} />
                <input
                  type="date"
                  min={todayInput()}
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none text-slate-400"
                />
              </div>
              <button
                onClick={() => handleSearch()}
                className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                style={{ minWidth: 140 }}
              >
                <Search size={16} />
                Search Courts
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              {["Kuala Lumpur", "Petaling Jaya", "Shah Alam", "Subang Jaya", "Johor Bahru"].map((city) => (
                <button
                  key={city}
                  onClick={() => handleSearch(city)}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: "block", height: 60 }}>
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20V60Z" fill="var(--background)" />
          </svg>
        </div>
      </section>

      {/* Stats Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl p-5 text-center shadow-sm border" style={{ background: "white", borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--secondary)" }}>
                  <Icon size={18} style={{ color: "var(--futsal-green)" }} />
                </div>
                <div className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--futsal-navy)" }}>{stat.value}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Venues */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--futsal-green)" }}>Top Rated</p>
            <h2 className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "var(--futsal-navy)", textTransform: "uppercase" }}>
              Featured Venues
            </h2>
          </div>
          <button
            onClick={() => onNavigate("venues")}
            className="hidden sm:flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--futsal-green)" }}
          >
            View All <ArrowRight size={16} />
          </button>
        </div>

        {loadingVenues ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-2xl border bg-white" style={{ borderColor: "var(--border)" }} />
            ))}
          </div>
        ) : venueError ? (
          <div className="rounded-2xl border bg-white p-8 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--destructive)" }}>
            {venueError}
          </div>
        ) : featuredVenues.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>No venues added yet</h3>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Add venues from the admin panel and they will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {featuredVenues.map((venue) => (
              <VenueCard key={venue.futsalId} venue={venue} />
            ))}
          </div>
        )}
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="scroll-mt-20 py-20" style={{ background: "var(--futsal-navy)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--futsal-green-light)" }}>Simple Process</p>
            <h2 className="font-bold uppercase" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "white" }}>
              Book in 4 Easy Steps
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-px" style={{ background: "rgba(22,163,74,0.3)", zIndex: 0 }} />
                  )}
                  <div className="relative z-10">
                    <div className="text-5xl font-black mb-4 leading-none" style={{ fontFamily: "var(--font-display)", color: "rgba(22,163,74,0.15)" }}>{step.step}</div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)" }}>
                      <Icon size={22} style={{ color: "var(--futsal-green-light)" }} />
                    </div>
                    <h3 className="font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-3xl p-10 md:p-14 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--futsal-green-dark) 0%, var(--futsal-green) 100%)" }}
        >
          <div className="absolute right-0 top-0 bottom-0 opacity-10">
            <svg viewBox="0 0 200 200" fill="none" className="h-full w-auto">
              <circle cx="150" cy="50" r="120" stroke="white" strokeWidth="60" />
            </svg>
          </div>
          <div className="relative max-w-2xl">
            <h2 className="font-black text-white uppercase mb-4" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Own a Futsal Venue?
            </h2>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
              List your courts on FutsalGo and reach thousands of players. Manage bookings, track revenue, and grow your business — all from one dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="btn-navy flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm">
                List Your Venue <ChevronRight size={16} />
              </button>
              <button className="btn-soft flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm" style={{ color: "white", background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.3)" }}>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ background: "var(--futsal-navy)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--futsal-green)" }}>
                  <Zap size={14} color="white" />
                </div>
                <span className="text-white font-bold" style={{ fontFamily: "var(--font-display)" }}>FUTSALGO</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>Malaysia's #1 futsal court booking platform. Find and book courts instantly.</p>
            </div>
            {[
              { title: "Product", links: ["Find Venues", "How it Works", "Pricing", "Mobile App"] },
              { title: "For Owners", links: ["List Your Venue", "Owner Dashboard", "Analytics", "Support"] },
              { title: "Company", links: ["About Us", "Blog", "Careers", "Contact"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold mb-4 text-white">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm transition-colors hover:text-white" style={{ color: "#475569" }}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-xs" style={{ color: "#334155" }}>© 2026 FutsalGo. All rights reserved.</p>
            <div className="flex gap-4">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <a key={item} href="#" className="text-xs transition-colors hover:text-white" style={{ color: "#334155" }}>{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function VenueCard({ venue }: { venue: Futsal }) {
  const rating = Number(venue.rating || 0);
  const reviews = Number(venue.reviewCount || 0);
  const amenities = [venue.courtType, venue.verified ? "Verified" : "Listed", venue.description].filter(Boolean).slice(0, 3);
  const tag = venue.verified ? "Verified" : "Live";
  const tagColor = venue.verified ? "#16A34A" : "#2563EB";

  return (
    <Link
      to={`/venues/${venue.futsalId}`}
      className="block rounded-2xl overflow-hidden shadow-sm border group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{ background: "white", borderColor: "var(--border)" }}
    >
      <div className="relative overflow-hidden h-48 bg-slate-100">
        <img
          src={imageForVenue(venue.imageUrl || venue.imageUrls?.[0])}
          alt={venue.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white shadow-sm" style={{ background: tagColor }}>
            {tag}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold leading-snug pr-2" style={{ color: "var(--futsal-navy)" }}>{venue.name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={13} fill="#F59E0B" stroke="none" />
            <span className="text-sm font-semibold" style={{ color: "var(--futsal-navy)" }}>{rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mb-3">
          <MapPin size={12} style={{ color: "var(--muted-foreground)" }} />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{venue.address}, {venue.city}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {amenities.map((item) => (
            <span key={item} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--futsal-green-dark)" }}>
              {item}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>From </span>
            <span className="font-bold" style={{ color: "var(--futsal-navy)" }}>{money(venue.hourlyPrice)}</span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/hour</span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <Users size={12} />
            {reviews} reviews
          </div>
        </div>
      </div>
    </Link>
  );
}

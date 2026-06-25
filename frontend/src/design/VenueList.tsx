import { useState } from "react";
import { Search, MapPin, Star, Users, Filter, SlidersHorizontal, Grid3X3, List, ChevronDown, X, Clock } from "lucide-react";

type View = "landing" | "venues" | "venue-detail" | "booking" | "confirmation" | "user-dashboard" | "admin-dashboard";

interface VenueListProps {
  onNavigate: (view: View) => void;
}

const ALL_VENUES = [
  { id: 1, name: "GreenZone Futsal Arena", location: "Kuala Lumpur City Centre", rating: 4.9, reviews: 312, price: 80, courts: 4, image: "https://images.unsplash.com/photo-1771909720886-a90afd1b37f5?w=600&h=400&fit=crop&auto=format", tag: "Most Popular", tagColor: "#16A34A", amenities: ["Changing Room", "Parking", "Cafeteria"], available: true, nextSlot: "2:00 PM" },
  { id: 2, name: "Urban Kick Sports Hub", location: "Petaling Jaya, Selangor", rating: 4.7, reviews: 198, price: 65, courts: 3, image: "https://images.unsplash.com/photo-1771909715670-083a55b7f354?w=600&h=400&fit=crop&auto=format", tag: "Best Value", tagColor: "#2563EB", amenities: ["Parking", "Spectator Stand", "WiFi"], available: true, nextSlot: "3:00 PM" },
  { id: 3, name: "ProField Elite Center", location: "Shah Alam, Selangor", rating: 4.8, reviews: 241, price: 95, courts: 6, image: "https://images.unsplash.com/photo-1771909718960-7fab338a09d3?w=600&h=400&fit=crop&auto=format", tag: "Premium", tagColor: "#B45309", amenities: ["Changing Room", "Parking", "Cafeteria", "WiFi"], available: false, nextSlot: "Tomorrow" },
  { id: 4, name: "Metro Futsal Complex", location: "Subang Jaya, Selangor", rating: 4.5, reviews: 156, price: 55, courts: 2, image: "https://images.unsplash.com/photo-1771909716747-346cb2b09329?w=600&h=400&fit=crop&auto=format", tag: "Near You", tagColor: "#7C3AED", amenities: ["Parking", "Cafeteria"], available: true, nextSlot: "1:00 PM" },
  { id: 5, name: "Champion Futsal Court", location: "Cheras, Kuala Lumpur", rating: 4.6, reviews: 189, price: 70, courts: 3, image: "https://images.unsplash.com/photo-1714213450890-3f465d40ed46?w=600&h=400&fit=crop&auto=format", tag: "New", tagColor: "#0891B2", amenities: ["Changing Room", "Parking", "WiFi"], available: true, nextSlot: "4:00 PM" },
  { id: 6, name: "Nexus Sports Arena", location: "Bangsar, Kuala Lumpur", rating: 4.4, reviews: 112, price: 85, courts: 5, image: "https://images.unsplash.com/photo-1712325485668-6b6830ba814e?w=600&h=400&fit=crop&auto=format", tag: "Indoor AC", tagColor: "#059669", amenities: ["Air Cond", "Changing Room", "Parking", "Cafeteria"], available: true, nextSlot: "5:00 PM" },
];

export function VenueList({ onNavigate }: VenueListProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("rating");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);

  const allAmenities = ["Parking", "Cafeteria", "WiFi", "Changing Room", "Air Cond", "Spectator Stand"];

  const filtered = ALL_VENUES.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.location.toLowerCase().includes(search.toLowerCase());
    const matchPrice = v.price >= priceRange[0] && v.price <= priceRange[1];
    const matchAmenities = selectedAmenities.length === 0 || selectedAmenities.every((a) => v.amenities.includes(a));
    const matchAvail = !availableOnly || v.available;
    return matchSearch && matchPrice && matchAmenities && matchAvail;
  }).sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    return b.reviews - a.reviews;
  });

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Top search bar */}
      <div className="border-b shadow-sm" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border" style={{ background: "var(--input-background)", borderColor: "var(--border)" }}>
              <Search size={16} style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                placeholder="Search venues or locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: "var(--foreground)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ color: "var(--muted-foreground)" }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ background: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="rating">Top Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="reviews">Most Reviewed</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{
                  background: showFilters ? "var(--futsal-green)" : "var(--input-background)",
                  borderColor: showFilters ? "var(--futsal-green)" : "var(--border)",
                  color: showFilters ? "white" : "var(--foreground)",
                }}
              >
                <SlidersHorizontal size={15} />
                Filters
                {selectedAmenities.length > 0 && (
                  <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold" style={{ background: showFilters ? "rgba(255,255,255,0.3)" : "var(--futsal-green)", color: "white" }}>
                    {selectedAmenities.length}
                  </span>
                )}
              </button>

              <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                <button onClick={() => setViewMode("grid")} className="p-2.5 transition-colors" style={{ background: viewMode === "grid" ? "var(--futsal-navy)" : "var(--input-background)", color: viewMode === "grid" ? "white" : "var(--muted-foreground)" }}>
                  <Grid3X3 size={15} />
                </button>
                <button onClick={() => setViewMode("list")} className="p-2.5 transition-colors" style={{ background: viewMode === "list" ? "var(--futsal-navy)" : "var(--input-background)", color: viewMode === "list" ? "white" : "var(--muted-foreground)" }}>
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid sm:grid-cols-3 gap-6" style={{ borderColor: "var(--border)" }}>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--muted-foreground)" }}>Availability</label>
                <button
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--foreground)" }}
                >
                  <div className={`w-10 h-5 rounded-full transition-colors relative`} style={{ background: availableOnly ? "var(--futsal-green)" : "var(--muted)" }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: availableOnly ? "1.375rem" : "0.125rem" }} />
                  </div>
                  Available Now Only
                </button>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                  Price Range: RM {priceRange[0]} – RM {priceRange[1]}/hr
                </label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full accent-green-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--muted-foreground)" }}>Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {allAmenities.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className="text-xs px-2.5 py-1 rounded-full transition-colors font-medium"
                      style={{
                        background: selectedAmenities.includes(a) ? "var(--futsal-green)" : "var(--input-background)",
                        color: selectedAmenities.includes(a) ? "white" : "var(--foreground)",
                        border: `1px solid ${selectedAmenities.includes(a) ? "var(--futsal-green)" : "var(--border)"}`,
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>{filtered.length}</span> venues found
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--futsal-green)" }} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Real-time availability</span>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((venue) => (
              <GridCard key={venue.id} venue={venue} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((venue) => (
              <ListCard key={venue.id} venue={venue} onNavigate={onNavigate} />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--muted)" }}>
              <Search size={24} style={{ color: "var(--muted-foreground)" }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>No venues found</h3>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GridCard({ venue, onNavigate }: { venue: typeof ALL_VENUES[0]; onNavigate: (v: View) => void }) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm border group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{ background: "white", borderColor: "var(--border)" }}
      onClick={() => onNavigate("venue-detail")}
    >
      <div className="relative overflow-hidden h-48 bg-slate-100">
        <img src={venue.image} alt={venue.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white shadow-sm" style={{ background: venue.tagColor }}>{venue.tag}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{
              background: venue.available ? "rgba(22,163,74,0.9)" : "rgba(220,38,38,0.9)",
              color: "white",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {venue.available ? "Available" : "Full"}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-sm leading-snug pr-2" style={{ color: "var(--futsal-navy)" }}>{venue.name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={12} fill="#F59E0B" stroke="none" />
            <span className="text-sm font-bold" style={{ color: "var(--futsal-navy)" }}>{venue.rating}</span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>({venue.reviews})</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mb-3">
          <MapPin size={11} style={{ color: "var(--muted-foreground)" }} />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{venue.location}</span>
        </div>
        {venue.available && (
          <div className="flex items-center gap-1 mb-3 text-xs" style={{ color: "var(--futsal-green)" }}>
            <Clock size={11} />
            Next available: {venue.nextSlot}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {venue.amenities.slice(0, 3).map((a) => (
            <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--futsal-green-dark)" }}>{a}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>From </span>
            <span className="font-bold" style={{ color: "var(--futsal-navy)" }}>RM {venue.price}</span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/hr</span>
          </div>
          <button
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: venue.available ? "var(--futsal-green)" : "var(--muted)", color: venue.available ? "white" : "var(--muted-foreground)" }}
          >
            {venue.available ? "Book Now" : "View"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ListCard({ venue, onNavigate }: { venue: typeof ALL_VENUES[0]; onNavigate: (v: View) => void }) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm border flex cursor-pointer transition-all hover:shadow-md"
      style={{ background: "white", borderColor: "var(--border)" }}
      onClick={() => onNavigate("venue-detail")}
    >
      <div className="relative w-48 shrink-0 bg-slate-100">
        <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: venue.tagColor }}>{venue.tag}</span>
        </div>
      </div>
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold" style={{ color: "var(--futsal-navy)" }}>{venue.name}</h3>
            <div className="flex items-center gap-1">
              <Star size={13} fill="#F59E0B" stroke="none" />
              <span className="font-bold text-sm" style={{ color: "var(--futsal-navy)" }}>{venue.rating}</span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>({venue.reviews})</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <MapPin size={12} style={{ color: "var(--muted-foreground)" }} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{venue.location}</span>
            <span className="mx-1" style={{ color: "var(--border)" }}>·</span>
            <Users size={12} style={{ color: "var(--muted-foreground)" }} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{venue.courts} courts</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {venue.amenities.map((a) => (
              <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--futsal-green-dark)" }}>{a}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>From </span>
              <span className="font-bold text-lg" style={{ color: "var(--futsal-navy)" }}>RM {venue.price}</span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/hr</span>
            </span>
            {venue.available && (
              <span className="text-xs flex items-center gap-1" style={{ color: "var(--futsal-green)" }}>
                <Clock size={11} />
                Next: {venue.nextSlot}
              </span>
            )}
          </div>
          <button
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            style={{ background: venue.available ? "var(--futsal-green)" : "var(--muted)", color: venue.available ? "white" : "var(--muted-foreground)" }}
          >
            {venue.available ? "Book Now" : "View Details"}
          </button>
        </div>
      </div>
    </div>
  );
}

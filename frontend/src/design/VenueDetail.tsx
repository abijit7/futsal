import { useState } from "react";
import { MapPin, Star, Users, Clock, ChevronLeft, Phone, Globe, Share2, Heart, CheckCircle2, ChevronRight, Calendar, Shield } from "lucide-react";

type View = "landing" | "venues" | "venue-detail" | "booking" | "confirmation" | "user-dashboard" | "admin-dashboard";

interface VenueDetailProps {
  onNavigate: (view: View) => void;
  userRole: "guest" | "user" | "admin";
  onRoleChange: (role: "guest" | "user" | "admin") => void;
}

const IMAGES = [
  "https://images.unsplash.com/photo-1771909720886-a90afd1b37f5?w=800&h=500&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1771909715670-083a55b7f354?w=400&h=250&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1771909718960-7fab338a09d3?w=400&h=250&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1771909716747-346cb2b09329?w=400&h=250&fit=crop&auto=format",
];

const TIME_SLOTS = [
  { time: "07:00 AM", status: "booked" },
  { time: "08:00 AM", status: "booked" },
  { time: "09:00 AM", status: "available" },
  { time: "10:00 AM", status: "available" },
  { time: "11:00 AM", status: "booked" },
  { time: "12:00 PM", status: "available" },
  { time: "01:00 PM", status: "available" },
  { time: "02:00 PM", status: "available" },
  { time: "03:00 PM", status: "booked" },
  { time: "04:00 PM", status: "available" },
  { time: "05:00 PM", status: "available" },
  { time: "06:00 PM", status: "booked" },
  { time: "07:00 PM", status: "available" },
  { time: "08:00 PM", status: "available" },
  { time: "09:00 PM", status: "booked" },
  { time: "10:00 PM", status: "booked" },
];

const REVIEWS = [
  { name: "Ahmad Rizal", date: "May 28, 2026", rating: 5, comment: "Excellent court! Very well maintained with good lighting. The staff were helpful and the changing rooms were clean. Will definitely come back.", avatar: "AR" },
  { name: "Sarah Lim", date: "May 24, 2026", rating: 5, comment: "Best futsal venue in KL! Smooth booking process and the facilities are top-notch. Parking was easy to find too.", avatar: "SL" },
  { name: "Raj Kumar", date: "May 20, 2026", rating: 4, comment: "Great experience overall. Court surface was in perfect condition. The only downside was the cafeteria was closed early.", avatar: "RK" },
];

export function VenueDetail({ onNavigate, userRole, onRoleChange }: VenueDetailProps) {
  const [selectedDate, setSelectedDate] = useState("2026-06-10");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState(1);
  const [duration, setDuration] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "reviews">("schedule");

  const PRICE_PER_HOUR = 80;
  const totalPrice = PRICE_PER_HOUR * duration;

  const handleBook = () => {
    if (userRole === "guest") {
      onRoleChange("user");
      return;
    }
    onNavigate("booking");
  };

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Back + Actions bar */}
      <div className="border-b" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button onClick={() => onNavigate("venues")} className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70" style={{ color: "var(--foreground)" }}>
            <ChevronLeft size={16} /> Back to Venues
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
              <Share2 size={16} style={{ color: "var(--muted-foreground)" }} />
            </button>
            <button
              onClick={() => setWishlist(!wishlist)}
              className="p-2 rounded-xl border transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)" }}
            >
              <Heart size={16} fill={wishlist ? "#EF4444" : "none"} stroke={wishlist ? "#EF4444" : "currentColor"} style={{ color: "var(--muted-foreground)" }} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Photo Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-3 rounded-2xl overflow-hidden h-72 sm:h-96 mb-6">
          <div className="col-span-2 row-span-2 relative bg-slate-200">
            <img src={IMAGES[0]} alt="Main court" className="w-full h-full object-cover" />
          </div>
          {IMAGES.slice(1).map((img, i) => (
            <div key={i} className="relative bg-slate-200 overflow-hidden">
              <img src={img} alt={`Court view ${i + 2}`} className="w-full h-full object-cover" />
              {i === 2 && (
                <button className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold" style={{ background: "rgba(0,0,0,0.5)" }}>
                  +8 Photos
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white mb-2 inline-block" style={{ background: "#16A34A" }}>Most Popular</span>
                  <h1 className="font-bold leading-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--futsal-navy)", textTransform: "uppercase" }}>
                    GreenZone Futsal Arena
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
                <div className="flex items-center gap-1">
                  <MapPin size={14} style={{ color: "var(--futsal-green)" }} />
                  Kuala Lumpur City Centre
                </div>
                <div className="flex items-center gap-1.5">
                  <Star size={14} fill="#F59E0B" stroke="none" />
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>4.9</span>
                  <span>(312 reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  4 courts available
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--muted)" }}>
              {(["overview", "schedule", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                  style={{
                    background: activeTab === tab ? "white" : "transparent",
                    color: activeTab === tab ? "var(--futsal-navy)" : "var(--muted-foreground)",
                    boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {tab === "schedule" ? "Book a Slot" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-5">
                <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                  <h3 className="font-semibold mb-3" style={{ color: "var(--futsal-navy)" }}>About this Venue</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    GreenZone Futsal Arena is a premier indoor futsal facility in the heart of Kuala Lumpur. Our 4 professionally maintained courts feature world-class synthetic turf, optimal lighting, and a climate-controlled environment ensuring the best playing experience year-round.
                  </p>
                  <p className="text-sm leading-relaxed mt-2" style={{ color: "var(--muted-foreground)" }}>
                    We accommodate casual players, corporate events, tournaments, and professional training sessions. Our experienced staff ensures a smooth experience from booking to play.
                  </p>
                </div>
                <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                  <h3 className="font-semibold mb-4" style={{ color: "var(--futsal-navy)" }}>Amenities & Facilities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      "Parking (50 spots)", "Changing Rooms (M/F)", "Cafeteria & Drinks",
                      "Ball Rental", "High-Speed WiFi", "CCTV Security",
                      "First Aid Station", "Spectator Seating", "AC Lobby",
                    ].map((a) => (
                      <div key={a} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={15} style={{ color: "var(--futsal-green)" }} />
                        <span style={{ color: "var(--foreground)" }}>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                  <h3 className="font-semibold mb-3" style={{ color: "var(--futsal-navy)" }}>Operating Hours</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { day: "Monday – Friday", hours: "7:00 AM – 11:00 PM" },
                      { day: "Saturday", hours: "6:00 AM – 12:00 AM" },
                      { day: "Sunday", hours: "7:00 AM – 10:00 PM" },
                      { day: "Public Holiday", hours: "8:00 AM – 10:00 PM" },
                    ].map((r) => (
                      <div key={r.day} className="rounded-xl p-3" style={{ background: "var(--input-background)" }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>{r.day}</p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{r.hours}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-5">
                {/* Court selector */}
                <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--futsal-navy)" }}>
                    <Users size={16} style={{ color: "var(--futsal-green)" }} />
                    Select Court
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCourt(c)}
                        className="py-3 rounded-xl text-sm font-semibold transition-all border"
                        style={{
                          background: selectedCourt === c ? "var(--futsal-navy)" : "var(--input-background)",
                          color: selectedCourt === c ? "white" : "var(--foreground)",
                          borderColor: selectedCourt === c ? "var(--futsal-navy)" : "var(--border)",
                        }}
                      >
                        Court {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date picker */}
                <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--futsal-navy)" }}>
                    <Calendar size={16} style={{ color: "var(--futsal-green)" }} />
                    Select Date
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {dates.map((d, i) => {
                      const iso = d.toISOString().split("T")[0];
                      const isSelected = selectedDate === iso;
                      return (
                        <button
                          key={iso}
                          onClick={() => setSelectedDate(iso)}
                          className="shrink-0 flex flex-col items-center py-3 px-4 rounded-xl transition-all border min-w-[64px]"
                          style={{
                            background: isSelected ? "var(--futsal-navy)" : "var(--input-background)",
                            color: isSelected ? "white" : "var(--foreground)",
                            borderColor: isSelected ? "var(--futsal-navy)" : "var(--border)",
                          }}
                        >
                          <span className="text-xs mb-1" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "var(--muted-foreground)" }}>
                            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}
                          </span>
                          <span className="font-bold text-base">{d.getDate()}</span>
                          <span className="text-xs" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "var(--muted-foreground)" }}>
                            {d.toLocaleString("default", { month: "short" })}
                          </span>
                          {i === 0 && <span className="text-xs mt-0.5" style={{ color: isSelected ? "var(--futsal-green-light)" : "var(--futsal-green)" }}>Today</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--futsal-navy)" }}>
                    <Clock size={16} style={{ color: "var(--futsal-green)" }} />
                    Available Time Slots
                  </h3>
                  <div className="flex items-center gap-4 mb-4 text-xs">
                    {[
                      { color: "var(--futsal-green)", label: "Available" },
                      { color: "var(--muted)", label: "Booked" },
                      { color: "var(--futsal-navy)", label: "Selected" },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ background: l.color }} />
                        <span style={{ color: "var(--muted-foreground)" }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = selectedSlot === slot.time;
                      const isBooked = slot.status === "booked";
                      return (
                        <button
                          key={slot.time}
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(isSelected ? null : slot.time)}
                          className="py-2.5 rounded-xl text-xs font-medium transition-all"
                          style={{
                            background: isBooked ? "var(--muted)" : isSelected ? "var(--futsal-navy)" : "var(--secondary)",
                            color: isBooked ? "var(--muted-foreground)" : isSelected ? "white" : "var(--futsal-green-dark)",
                            cursor: isBooked ? "not-allowed" : "pointer",
                            border: isSelected ? "2px solid var(--futsal-green)" : "2px solid transparent",
                          }}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-5xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--futsal-navy)" }}>4.9</div>
                      <div className="flex items-center gap-0.5 justify-center mt-1">
                        {[1,2,3,4,5].map((s) => <Star key={s} size={14} fill="#F59E0B" stroke="none" />)}
                      </div>
                      <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>312 reviews</div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5,4,3,2,1].map((rating) => {
                        const pct = [72, 20, 5, 2, 1][5 - rating];
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-xs w-3 text-right" style={{ color: "var(--muted-foreground)" }}>{rating}</span>
                            <Star size={10} fill="#F59E0B" stroke="none" />
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#F59E0B" }} />
                            </div>
                            <span className="text-xs w-8" style={{ color: "var(--muted-foreground)" }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {REVIEWS.map((review) => (
                      <div key={review.name} className="pb-4 border-b last:border-0 last:pb-0" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "var(--futsal-navy)" }}>
                            {review.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{review.name}</span>
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{review.date}</span>
                            </div>
                            <div className="flex gap-0.5 mt-0.5">
                              {Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={11} fill="#F59E0B" stroke="none" />)}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-2xl border shadow-lg overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="p-5 border-b" style={{ borderColor: "var(--border)", background: "var(--futsal-navy)" }}>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>RM {PRICE_PER_HOUR}</span>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>/hour</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={13} fill="#F59E0B" stroke="none" />
                  <span className="text-sm font-semibold text-white">4.9</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>(312 reviews)</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Selected Slot</label>
                  <div className="px-3 py-2.5 rounded-xl text-sm border flex items-center gap-2" style={{ background: "var(--input-background)", borderColor: "var(--border)" }}>
                    <Clock size={14} style={{ color: selectedSlot ? "var(--futsal-green)" : "var(--muted-foreground)" }} />
                    <span style={{ color: selectedSlot ? "var(--foreground)" : "var(--muted-foreground)" }}>
                      {selectedSlot ? `Court ${selectedCourt} · ${selectedSlot}` : "Select a time slot →"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Duration</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setDuration(Math.max(1, duration - 1))} className="w-9 h-9 rounded-xl flex items-center justify-center font-bold border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>−</button>
                    <span className="flex-1 text-center font-semibold text-sm" style={{ color: "var(--foreground)" }}>{duration} hour{duration > 1 ? "s" : ""}</span>
                    <button onClick={() => setDuration(Math.min(4, duration + 1))} className="w-9 h-9 rounded-xl flex items-center justify-center font-bold border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>+</button>
                  </div>
                </div>

                <div className="rounded-xl p-3 space-y-2 text-sm" style={{ background: "var(--input-background)" }}>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>RM {PRICE_PER_HOUR} × {duration}hr</span>
                    <span style={{ color: "var(--foreground)" }}>RM {totalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>Service fee</span>
                    <span style={{ color: "var(--foreground)" }}>RM 5</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold" style={{ borderColor: "var(--border)" }}>
                    <span style={{ color: "var(--foreground)" }}>Total</span>
                    <span style={{ color: "var(--futsal-navy)" }}>RM {totalPrice + 5}</span>
                  </div>
                </div>

                <button
                  onClick={handleBook}
                  disabled={!selectedSlot}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  style={{
                    background: selectedSlot ? "var(--futsal-green)" : "var(--muted)",
                    color: selectedSlot ? "white" : "var(--muted-foreground)",
                    cursor: selectedSlot ? "pointer" : "not-allowed",
                  }}
                >
                  {userRole === "guest" ? "Sign in to Book" : "Confirm Booking"}
                  <ChevronRight size={16} />
                </button>

                <div className="flex items-center gap-2 text-xs justify-center" style={{ color: "var(--muted-foreground)" }}>
                  <Shield size={13} style={{ color: "var(--futsal-green)" }} />
                  Free cancellation up to 2 hours before
                </div>
              </div>
            </div>

            {/* Contact card */}
            <div className="mt-4 rounded-2xl p-4 border" style={{ background: "white", borderColor: "var(--border)" }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--futsal-navy)" }}>Contact Venue</h4>
              <div className="space-y-2">
                <a href="tel:+60123456789" className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  <Phone size={14} style={{ color: "var(--futsal-green)" }} />
                  +60 12-345 6789
                </a>
                <a href="#" className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  <Globe size={14} style={{ color: "var(--futsal-green)" }} />
                  www.greenzonefc.com.my
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

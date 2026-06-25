import { useState } from "react";
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, ChevronRight, Download, Star, RotateCcw, User, Settings, Bell, Shield, Trophy } from "lucide-react";

type View = "landing" | "venues" | "venue-detail" | "booking" | "confirmation" | "user-dashboard" | "admin-dashboard";

interface UserDashboardProps {
  onNavigate: (view: View) => void;
}

const BOOKINGS = [
  { id: "FG-2026-08421", venue: "GreenZone Futsal Arena", location: "Kuala Lumpur", date: "10 Jun 2026", time: "2:00 PM – 3:00 PM", court: "Court 1", status: "upcoming", amount: 75, image: "https://images.unsplash.com/photo-1771909720886-a90afd1b37f5?w=200&h=120&fit=crop&auto=format" },
  { id: "FG-2026-07853", venue: "Urban Kick Sports Hub", location: "Petaling Jaya", date: "2 Jun 2026", time: "6:00 PM – 7:00 PM", court: "Court 2", status: "completed", amount: 65, image: "https://images.unsplash.com/photo-1771909715670-083a55b7f354?w=200&h=120&fit=crop&auto=format" },
  { id: "FG-2026-07102", venue: "Metro Futsal Complex", location: "Subang Jaya", date: "28 May 2026", time: "8:00 AM – 9:00 AM", court: "Court 1", status: "completed", amount: 55, image: "https://images.unsplash.com/photo-1771909716747-346cb2b09329?w=200&h=120&fit=crop&auto=format" },
  { id: "FG-2026-06541", venue: "ProField Elite Center", location: "Shah Alam", date: "20 May 2026", time: "4:00 PM – 6:00 PM", court: "Court 3", status: "cancelled", amount: 190, image: "https://images.unsplash.com/photo-1771909718960-7fab338a09d3?w=200&h=120&fit=crop&auto=format" },
];

const SIDEBAR_ITEMS = [
  { id: "bookings", label: "My Bookings", icon: Calendar },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
];

const STATUS_CONFIG = {
  upcoming: { label: "Upcoming", color: "#2563EB", bg: "#EFF6FF", icon: AlertCircle },
  completed: { label: "Completed", color: "#16A34A", bg: "#F0FDF4", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2", icon: XCircle },
};

export function UserDashboard({ onNavigate }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  const [activeSection, setActiveSection] = useState("bookings");
  const [reviewModal, setReviewModal] = useState<string | null>(null);
  const [rating, setRating] = useState(0);

  const filtered = activeTab === "all" ? BOOKINGS : BOOKINGS.filter((b) => b.status === activeTab);
  const totalSpent = BOOKINGS.filter((b) => b.status === "completed").reduce((s, b) => s + b.amount, 0);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg" style={{ background: "var(--futsal-navy)" }}>
              JD
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--futsal-navy)" }}>John Doe</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>john@example.com</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--input-background)" }}>
              <p className="font-bold text-lg" style={{ color: "var(--futsal-navy)", fontFamily: "var(--font-display)" }}>{BOOKINGS.filter(b => b.status !== "cancelled").length}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Bookings</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "var(--input-background)" }}>
              <p className="font-bold text-lg" style={{ color: "var(--futsal-navy)", fontFamily: "var(--font-display)" }}>RM {totalSpent}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Spent</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeSection === id ? "var(--secondary)" : "transparent",
                color: activeSection === id ? "var(--futsal-green-dark)" : "var(--muted-foreground)",
              }}
            >
              <Icon size={16} style={{ color: activeSection === id ? "var(--futsal-green)" : undefined }} />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="rounded-xl p-3" style={{ background: "var(--secondary)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={14} style={{ color: "var(--futsal-green)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--futsal-green-dark)" }}>Loyalty Points</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--futsal-navy)" }}>1,250</span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>pts</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
              <div className="h-full rounded-full" style={{ width: "62%", background: "var(--futsal-green)" }} />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>750 pts to Silver tier</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-bold uppercase" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--futsal-navy)" }}>My Dashboard</h1>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Welcome back, John! Ready to play?</p>
            </div>
            <button
              onClick={() => onNavigate("venues")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: "var(--futsal-green)", color: "white" }}
            >
              Book a Court <ChevronRight size={15} />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Bookings", value: BOOKINGS.length, sub: "All time" },
              { label: "This Month", value: 2, sub: "Jun 2026" },
              { label: "Hours Played", value: "8h", sub: "All time" },
              { label: "Fav Venue", value: "GreenZone", sub: "2 visits" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-4 border" style={{ background: "white", borderColor: "var(--border)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{stat.label}</p>
                <p className="font-bold text-xl leading-none mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--futsal-navy)" }}>{stat.value}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Bookings tabs */}
          <div className="flex gap-1 rounded-xl p-1 mb-5" style={{ background: "var(--muted)" }}>
            {(["all", "upcoming", "completed", "cancelled"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: activeTab === tab ? "white" : "transparent",
                  color: activeTab === tab ? "var(--futsal-navy)" : "var(--muted-foreground)",
                  boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {tab} {tab !== "all" && `(${BOOKINGS.filter(b => b.status === tab).length})`}
              </button>
            ))}
          </div>

          {/* Booking list */}
          <div className="space-y-4">
            {filtered.map((booking) => {
              const status = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = status.icon;
              return (
                <div key={booking.id} className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
                  <div className="flex gap-4 p-4">
                    <img src={booking.image} alt={booking.venue} className="w-20 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate" style={{ color: "var(--futsal-navy)" }}>{booking.venue}</h3>
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: status.bg, color: status.color }}>
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <span className="flex items-center gap-1"><MapPin size={10} />{booking.location}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} />{booking.date}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{booking.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{booking.court} · Ref: {booking.id}</span>
                        <span className="font-bold text-sm" style={{ color: "var(--futsal-navy)" }}>RM {booking.amount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-t" style={{ borderColor: "var(--border)" }}>
                    {booking.status === "upcoming" && (
                      <>
                        <button className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors hover:bg-gray-50 border-r" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                          <RotateCcw size={13} />
                          Reschedule
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors hover:bg-red-50 border-r" style={{ borderColor: "var(--border)", color: "#DC2626" }}>
                          <XCircle size={13} />
                          Cancel
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors hover:bg-gray-50" style={{ color: "var(--futsal-navy)" }}>
                          <Download size={13} />
                          Receipt
                        </button>
                      </>
                    )}
                    {booking.status === "completed" && (
                      <>
                        <button
                          onClick={() => setReviewModal(booking.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors hover:bg-gray-50 border-r"
                          style={{ borderColor: "var(--border)", color: "var(--futsal-green)" }}
                        >
                          <Star size={13} />
                          Leave Review
                        </button>
                        <button
                          onClick={() => onNavigate("venues")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors hover:bg-gray-50"
                          style={{ color: "var(--futsal-navy)" }}
                        >
                          <RotateCcw size={13} />
                          Book Again
                        </button>
                      </>
                    )}
                    {booking.status === "cancelled" && (
                      <button
                        onClick={() => onNavigate("venues")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors hover:bg-gray-50"
                        style={{ color: "var(--futsal-navy)" }}
                      >
                        <RotateCcw size={13} />
                        Book Again
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-xl p-6" style={{ background: "white" }}>
            <h3 className="font-bold mb-1" style={{ color: "var(--futsal-navy)", fontFamily: "var(--font-display)", textTransform: "uppercase" }}>Rate Your Experience</h3>
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>Urban Kick Sports Hub · 2 Jun 2026</p>
            <div className="flex items-center gap-2 mb-4 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star size={32} fill={s <= rating ? "#F59E0B" : "none"} stroke={s <= rating ? "#F59E0B" : "#CBD5E1"} />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Share your experience with other players..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none resize-none mb-4"
              style={{ background: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-3 rounded-xl font-semibold text-sm border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancel</button>
              <button onClick={() => setReviewModal(null)} className="flex-1 py-3 rounded-xl font-semibold text-sm" style={{ background: "var(--futsal-green)", color: "white" }}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

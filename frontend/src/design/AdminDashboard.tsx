import { useState } from "react";
import type { CSSProperties } from "react";
import { LayoutDashboard, MapPin, Calendar, Users, BarChart2, Settings, ChevronRight, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, AlertCircle, Plus, Search, MoreVertical, Edit, Trash2, Eye, Download } from "lucide-react";

type View = "landing" | "venues" | "venue-detail" | "booking" | "confirmation" | "user-dashboard" | "admin-dashboard";

interface AdminDashboardProps {
  onNavigate: (view: View) => void;
  initialSection?: string;
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "venues", label: "Venues", icon: MapPin },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "users", label: "Users", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
];

const MONTHLY_REVENUE = [
  { month: "Jan", revenue: 12400, bookings: 156 },
  { month: "Feb", revenue: 14200, bookings: 178 },
  { month: "Mar", revenue: 11800, bookings: 148 },
  { month: "Apr", revenue: 16500, bookings: 207 },
  { month: "May", revenue: 18900, bookings: 236 },
  { month: "Jun", revenue: 14200, bookings: 178 },
];

const COURT_UTILIZATION = [
  { name: "Court 1", value: 85, color: "#16A34A" },
  { name: "Court 2", value: 72, color: "#2563EB" },
  { name: "Court 3", value: 64, color: "#F59E0B" },
  { name: "Court 4", value: 91, color: "#7C3AED" },
];

const RECENT_BOOKINGS = [
  { id: "FG-2026-08435", user: "Ahmad Rizal", venue: "GreenZone · Court 2", date: "10 Jun, 4:00 PM", amount: 80, status: "confirmed" },
  { id: "FG-2026-08434", user: "Sarah Lim", venue: "GreenZone · Court 1", date: "10 Jun, 2:00 PM", amount: 75, status: "confirmed" },
  { id: "FG-2026-08433", user: "Raj Kumar", venue: "GreenZone · Court 3", date: "10 Jun, 12:00 PM", amount: 160, status: "pending" },
  { id: "FG-2026-08432", user: "Ali Hassan", venue: "GreenZone · Court 4", date: "9 Jun, 8:00 PM", amount: 80, status: "cancelled" },
  { id: "FG-2026-08431", user: "Mei Ling", venue: "GreenZone · Court 1", date: "9 Jun, 6:00 PM", amount: 75, status: "completed" },
];

const VENUES_DATA = [
  { id: 1, name: "GreenZone Futsal Arena", location: "KLCC, KL", courts: 4, status: "active", todayBookings: 12, revenue: 18900, rating: 4.9 },
  { id: 2, name: "Urban Kick Sports Hub", location: "PJ, Selangor", courts: 3, status: "active", todayBookings: 8, revenue: 14200, rating: 4.7 },
  { id: 3, name: "ProField Elite Center", location: "Shah Alam", courts: 6, status: "active", todayBookings: 15, revenue: 22100, rating: 4.8 },
  { id: 4, name: "Metro Futsal Complex", location: "Subang Jaya", courts: 2, status: "maintenance", todayBookings: 0, revenue: 8400, rating: 4.5 },
];

const USERS_DATA = [
  { id: 1, name: "Ahmad Rizal", email: "ahmad@email.com", bookings: 14, spent: 1120, status: "active", joined: "Jan 2026" },
  { id: 2, name: "Sarah Lim", email: "sarah@email.com", bookings: 9, spent: 675, status: "active", joined: "Feb 2026" },
  { id: 3, name: "Raj Kumar", email: "raj@email.com", bookings: 22, spent: 1760, status: "active", joined: "Nov 2025" },
  { id: 4, name: "Ali Hassan", email: "ali@email.com", bookings: 5, spent: 325, status: "suspended", joined: "Mar 2026" },
  { id: 5, name: "Mei Ling", email: "mei@email.com", bookings: 31, spent: 2480, status: "active", joined: "Oct 2025" },
];

const STATUS_CHIP = {
  confirmed: { label: "Confirmed", color: "#2563EB", bg: "#EFF6FF" },
  pending: { label: "Pending", color: "#D97706", bg: "#FFFBEB" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
  completed: { label: "Completed", color: "#16A34A", bg: "#F0FDF4" },
  active: { label: "Active", color: "#16A34A", bg: "#F0FDF4" },
  maintenance: { label: "Maintenance", color: "#D97706", bg: "#FFFBEB" },
  suspended: { label: "Suspended", color: "#DC2626", bg: "#FEF2F2" },
};

export function AdminDashboard({ onNavigate, initialSection = "overview" }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [bookingSearch, setBookingSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r" style={{ background: "var(--futsal-navy)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--futsal-green)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/><polygon points="12,7 14.5,9.5 13.5,12.5 10.5,12.5 9.5,9.5" fill="white"/></svg>
            </div>
            <span className="text-white font-bold" style={{ fontFamily: "var(--font-display)" }}>FUTSALGO</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--futsal-navy-mid)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: "var(--futsal-green)" }}>AD</div>
            <div>
              <p className="text-white text-xs font-semibold">Admin User</p>
              <p className="text-xs" style={{ color: "#475569" }}>Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeSection === id ? "var(--futsal-green)" : "transparent",
                color: activeSection === id ? "white" : "#64748B",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => onNavigate("landing")}
            className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: "#475569" }}
          >
            ← Back to Site
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="border-b px-6 py-4 flex items-center justify-between" style={{ background: "white", borderColor: "var(--border)" }}>
          <div>
            <h1 className="font-bold capitalize" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--futsal-navy)", textTransform: "uppercase" }}>
              {activeSection}
            </h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Tuesday, 3 June 2026</p>
          </div>
          <div className="flex items-center gap-2">
            {activeSection === "venues" && (
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--futsal-green)", color: "white" }}>
                <Plus size={15} /> Add Venue
              </button>
            )}
            <button className="p-2.5 rounded-xl border" style={{ borderColor: "var(--border)" }}>
              <Download size={16} style={{ color: "var(--muted-foreground)" }} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 73px)" }}>
          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Revenue", value: "RM 88,300", change: "+14%", up: true, sub: "This month vs last" },
                  { label: "Total Bookings", value: "1,103", change: "+8%", up: true, sub: "June 2026" },
                  { label: "Active Users", value: "3,842", change: "+22%", up: true, sub: "Registered players" },
                  { label: "Cancellation Rate", value: "4.2%", change: "-1.1%", up: false, sub: "vs 5.3% last month" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                    <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{kpi.label}</p>
                    <p className="font-black text-xl mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--futsal-navy)" }}>{kpi.value}</p>
                    <div className="flex items-center gap-1">
                      {kpi.up ? <TrendingUp size={12} style={{ color: "#16A34A" }} /> : <TrendingDown size={12} style={{ color: "#DC2626" }} />}
                      <span className="text-xs font-semibold" style={{ color: kpi.up ? "#16A34A" : "#DC2626" }}>{kpi.change}</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {kpi.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue chart */}
                <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold" style={{ color: "var(--futsal-navy)" }}>Revenue & Bookings</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "var(--secondary)", color: "var(--futsal-green-dark)" }}>Last 6 Months</span>
                  </div>
                  <RevenueBars />
                </div>

                {/* Court utilization */}
                <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                  <h3 className="font-semibold mb-5" style={{ color: "var(--futsal-navy)" }}>Court Utilization</h3>
                  <div className="space-y-3">
                    {COURT_UTILIZATION.map((c) => (
                      <div key={c.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{c.name}</span>
                          <span className="text-xs font-bold" style={{ color: c.color }}>{c.value}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${c.value}%`, background: c.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t text-center" style={{ borderColor: "var(--border)" }}>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Average utilization</p>
                    <p className="font-black text-2xl" style={{ fontFamily: "var(--font-display)", color: "var(--futsal-navy)" }}>78%</p>
                  </div>
                </div>
              </div>

              {/* Recent bookings */}
              <div className="rounded-2xl border" style={{ background: "white", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                  <h3 className="font-semibold" style={{ color: "var(--futsal-navy)" }}>Recent Bookings</h3>
                  <button onClick={() => setActiveSection("bookings")} className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--futsal-green)" }}>
                    View All <ChevronRight size={13} />
                  </button>
                </div>
                <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as CSSProperties}>
                  {RECENT_BOOKINGS.map((booking) => {
                    const st = STATUS_CHIP[booking.status as keyof typeof STATUS_CHIP];
                    return (
                      <div key={booking.id} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "var(--futsal-navy)" }}>
                          {booking.user.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{booking.user}</p>
                          <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{booking.venue} · {booking.date}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold" style={{ color: "var(--futsal-navy)" }}>RM {booking.amount}</p>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VENUES */}
          {activeSection === "venues" && (
            <div className="space-y-4">
              {VENUES_DATA.map((venue) => {
                const st = STATUS_CHIP[venue.status as keyof typeof STATUS_CHIP];
                return (
                  <div key={venue.id} className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: "white", borderColor: "var(--border)" }}>
                    <div className="w-full sm:w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                      <img src={`https://images.unsplash.com/photo-1771909720886-a90afd1b37f5?w=100&h=100&fit=crop&auto=format`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold" style={{ color: "var(--futsal-navy)" }}>{venue.name}</h3>
                          <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                            <MapPin size={10} />{venue.location} · {venue.courts} courts
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span style={{ color: "var(--muted-foreground)" }}>Today: <strong style={{ color: "var(--foreground)" }}>{venue.todayBookings} bookings</strong></span>
                        <span style={{ color: "var(--muted-foreground)" }}>Revenue: <strong style={{ color: "var(--foreground)" }}>RM {venue.revenue.toLocaleString()}</strong></span>
                        <span style={{ color: "var(--muted-foreground)" }}>Rating: <strong style={{ color: "var(--foreground)" }}>⭐ {venue.rating}</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-xl border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                        <Edit size={14} style={{ color: "var(--muted-foreground)" }} />
                      </button>
                      <button className="p-2 rounded-xl border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                        <Eye size={14} style={{ color: "var(--muted-foreground)" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BOOKINGS */}
          {activeSection === "bookings" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ background: "white", borderColor: "var(--border)" }}>
                  <Search size={15} style={{ color: "var(--muted-foreground)" }} />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or venue..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                    style={{ color: "var(--foreground)" }}
                  />
                </div>
                <select className="px-3 py-2.5 rounded-xl text-sm border focus:outline-none" style={{ background: "white", borderColor: "var(--border)", color: "var(--foreground)" }}>
                  <option>All Status</option>
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Cancelled</option>
                  <option>Completed</option>
                </select>
              </div>

              <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--input-background)" }}>
                      {["Booking ID", "Customer", "Venue & Court", "Date & Time", "Amount", "Status", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {RECENT_BOOKINGS.filter(b =>
                      b.user.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                      b.id.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                      b.venue.toLowerCase().includes(bookingSearch.toLowerCase())
                    ).map((booking) => {
                      const st = STATUS_CHIP[booking.status as keyof typeof STATUS_CHIP];
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{booking.id}</td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{booking.user}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{booking.venue}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{booking.date}</td>
                          <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--futsal-navy)" }}>RM {booking.amount}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                              <MoreVertical size={14} style={{ color: "var(--muted-foreground)" }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeSection === "users" && (
            <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--input-background)" }}>
                    {["User", "Email", "Bookings", "Total Spent", "Status", "Joined", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {USERS_DATA.map((user) => {
                    const st = STATUS_CHIP[user.status as keyof typeof STATUS_CHIP];
                    return (
                      <tr key={user.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--border)" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--futsal-navy)" }}>
                              {user.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{user.email}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: "var(--foreground)" }}>{user.bookings}</td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--futsal-navy)" }}>RM {user.spent}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{user.joined}</td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100"><MoreVertical size={14} style={{ color: "var(--muted-foreground)" }} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORTS */}
          {activeSection === "reports" && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "June Revenue", value: "RM 14,200", sub: "178 bookings" },
                  { label: "Avg Booking Value", value: "RM 79.78", sub: "Per transaction" },
                  { label: "Peak Hour", value: "6–9 PM", sub: "Weekdays" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-5 border text-center" style={{ background: "white", borderColor: "var(--border)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{s.label}</p>
                    <p className="font-black text-2xl" style={{ fontFamily: "var(--font-display)", color: "var(--futsal-navy)" }}>{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
                <h3 className="font-semibold mb-4" style={{ color: "var(--futsal-navy)" }}>Monthly Revenue Trend</h3>
                <RevenueTrend />
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="max-w-lg rounded-2xl border p-6" style={{ background: "white", borderColor: "var(--border)" }}>
              <h2 className="font-bold mb-5" style={{ color: "var(--futsal-navy)", fontFamily: "var(--font-display)", textTransform: "uppercase" }}>Platform Settings</h2>
              <div className="space-y-5">
                {[
                  { label: "Platform Name", value: "FutsalGo" },
                  { label: "Support Email", value: "support@futsalgo.com" },
                  { label: "Default Currency", value: "MYR (RM)" },
                  { label: "Service Fee (%)", value: "5%" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
                    <input
                      defaultValue={value}
                      className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                      style={{ background: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                ))}
                <button className="w-full py-3 rounded-xl font-semibold text-sm" style={{ background: "var(--futsal-green)", color: "white" }}>Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RevenueBars() {
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map((item) => item.revenue));
  const maxBookings = Math.max(...MONTHLY_REVENUE.map((item) => item.bookings));

  return (
    <div className="flex h-[200px] items-end gap-4 rounded-xl px-2 pb-2 pt-4">
      {MONTHLY_REVENUE.map((item) => (
        <div key={item.month} className="flex flex-1 flex-col items-center justify-end gap-2">
          <div className="flex h-36 w-full items-end justify-center gap-1.5">
            <div
              className="w-5 rounded-t-md"
              style={{ height: `${(item.revenue / maxRevenue) * 100}%`, background: "var(--futsal-navy)" }}
              title={`RM ${item.revenue.toLocaleString()}`}
            />
            <div
              className="w-5 rounded-t-md"
              style={{ height: `${(item.bookings / maxBookings) * 100}%`, background: "var(--futsal-green)" }}
              title={`${item.bookings} bookings`}
            />
          </div>
          <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{item.month}</span>
        </div>
      ))}
    </div>
  );
}

function RevenueTrend() {
  const points = MONTHLY_REVENUE.map((item, index) => {
    const maxRevenue = Math.max(...MONTHLY_REVENUE.map((entry) => entry.revenue));
    const minRevenue = Math.min(...MONTHLY_REVENUE.map((entry) => entry.revenue));
    const x = (index / (MONTHLY_REVENUE.length - 1)) * 100;
    const y = 100 - ((item.revenue - minRevenue) / (maxRevenue - minRevenue)) * 78 - 10;
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="h-[220px] rounded-xl p-2">
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" preserveAspectRatio="none">
        {[20, 40, 60, 80].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--border)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={path} fill="none" stroke="var(--futsal-green)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {points.map((point) => (
          <circle key={point.month} cx={point.x} cy={point.y} r="2" fill="var(--futsal-green)" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="-mt-2 grid grid-cols-6 text-center text-[11px]" style={{ color: "var(--muted-foreground)" }}>
        {MONTHLY_REVENUE.map((item) => <span key={item.month}>{item.month}</span>)}
      </div>
    </div>
  );
}

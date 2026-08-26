import { CheckCircle2, Calendar, Clock, MapPin, Download, Share2, ChevronRight, Copy } from "lucide-react";

type View = "landing" | "venues" | "venue-detail" | "booking" | "confirmation" | "user-dashboard" | "admin-dashboard";

interface ConfirmationProps {
  onNavigate: (view: View) => void;
}

export function Confirmation({ onNavigate }: ConfirmationProps) {
  const bookingRef = "FG-2026-08421";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-lg">
        {/* Success animation */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: "var(--futsal-green)" }}
          >
            <CheckCircle2 size={40} color="white" />
          </div>
          <h1 className="font-black uppercase mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--futsal-navy)" }}>
            Booking Confirmed!
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Your court is reserved. See you on the pitch!
          </p>
        </div>

        {/* Ticket card */}
        <div className="rounded-3xl overflow-hidden shadow-xl border" style={{ background: "white", borderColor: "var(--border)" }}>
          {/* Top portion */}
          <div className="p-6 relative" style={{ background: "var(--futsal-navy)" }}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <svg viewBox="0 0 100 100" fill="none">
                <circle cx="80" cy="20" r="70" stroke="white" strokeWidth="30" />
              </svg>
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Booking Reference</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>{bookingRef}</span>
                    <button className="p-1 rounded" style={{ color: "rgba(255,255,255,0.5)" }}>
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: "var(--futsal-green)" }}>
                  CONFIRMED
                </div>
              </div>
              <h2 className="font-bold text-white text-lg">GreenZone Futsal Arena</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Court 1 · Indoor Synthetic Turf</p>
            </div>
          </div>

          {/* Dashed separator */}
          <div className="flex items-center" style={{ background: "var(--background)" }}>
            <div className="w-6 h-6 rounded-full -ml-3" style={{ background: "var(--background)" }} />
            <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: "var(--border)" }} />
            <div className="w-6 h-6 rounded-full -mr-3" style={{ background: "var(--background)" }} />
          </div>

          {/* Bottom portion */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { icon: Calendar, label: "Date", value: "Tuesday, 10 Jun 2026" },
                { icon: Clock, label: "Time", value: "2:00 PM – 3:00 PM" },
                { icon: MapPin, label: "Location", value: "KLCC, Kuala Lumpur" },
                { icon: CheckCircle2, label: "Duration", value: "1 Hour" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} style={{ color: "var(--futsal-green)" }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--futsal-navy)" }}>{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-4 mb-5 flex items-center justify-between" style={{ background: "var(--input-background)" }}>
              <div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Amount Paid</p>
                <p className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--futsal-navy)" }}>RM 75</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Paid via</p>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Credit Card</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>**** 3456</p>
              </div>
            </div>

            {/* QR Code placeholder */}
            <div className="flex items-center justify-center mb-5">
              <div className="border-2 rounded-2xl p-3 flex flex-col items-center gap-2" style={{ borderColor: "var(--border)" }}>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: 49 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{
                        background: [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48].includes(i % 49) || Math.random() > 0.6
                          ? "var(--futsal-navy)"
                          : "transparent",
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Scan at venue entrance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                <Download size={15} />
                Download
              </button>
              <button className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                <Share2 size={15} />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="mt-6 rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--border)" }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--futsal-navy)" }}>What's Next?</h3>
          <ul className="space-y-2.5">
            {[
              "Confirmation email sent to john@example.com",
              "Add to your calendar so you don't forget",
              "Arrive 10 minutes early with your reference code",
              "Enjoy your game! 🏆",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: "var(--secondary)", color: "var(--futsal-green-dark)" }}>
                  {i + 1}
                </div>
                <span style={{ color: "var(--muted-foreground)" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onNavigate("user-dashboard")}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm border transition-colors hover:bg-gray-50"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            View My Bookings
          </button>
          <button
            onClick={() => onNavigate("venues")}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: "var(--futsal-green)", color: "white" }}
          >
            Book Another <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ChevronLeft, CreditCard, Smartphone, Building2, CheckCircle2, Lock, ChevronRight, Calendar, Clock, MapPin, Users, Tag } from "lucide-react";

type View = "landing" | "venues" | "venue-detail" | "booking" | "confirmation" | "user-dashboard" | "admin-dashboard";

interface BookingFlowProps {
  onNavigate: (view: View) => void;
}

const STEPS = ["Summary", "Player Info", "Payment", "Confirm"];

export function BookingFlow({ onNavigate }: BookingFlowProps) {
  const [step, setStep] = useState(0);
  const [payMethod, setPayMethod] = useState<"card" | "ewallet" | "transfer">("card");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [form, setForm] = useState({ name: "John Doe", email: "john@example.com", phone: "+60 12-345 6789", team: "", notes: "" });

  const basePrice = 80;
  const duration = 1;
  const serviceFee = 5;
  const discount = promoApplied ? 10 : 0;
  const total = basePrice * duration + serviceFee - discount;

  const handlePromo = () => {
    if (promoCode.toLowerCase() === "futsal10") setPromoApplied(true);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onNavigate("confirmation");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="border-b" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => step === 0 ? onNavigate("venue-detail") : setStep(step - 1)} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              <ChevronLeft size={16} /> Back
            </button>
            <h1 className="font-bold text-sm" style={{ color: "var(--futsal-navy)" }}>Complete Booking</h1>
            <div className="w-16" />
          </div>
          {/* Stepper */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: i < step ? "var(--futsal-green)" : i === step ? "var(--futsal-navy)" : "var(--muted)",
                      color: i <= step ? "white" : "var(--muted-foreground)",
                    }}
                  >
                    {i < step ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block" style={{ color: i === step ? "var(--futsal-navy)" : "var(--muted-foreground)", fontWeight: i === step ? 600 : 400 }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-4 sm:mb-0" style={{ background: i < step ? "var(--futsal-green)" : "var(--muted)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            {step === 0 && (
              <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: "var(--border)" }}>
                <h2 className="font-bold mb-5" style={{ color: "var(--futsal-navy)", fontFamily: "var(--font-display)", textTransform: "uppercase" }}>
                  Booking Summary
                </h2>
                <div className="flex gap-4 p-4 rounded-xl mb-5" style={{ background: "var(--input-background)" }}>
                  <img
                    src="https://images.unsplash.com/photo-1771909720886-a90afd1b37f5?w=200&h=120&fit=crop&auto=format"
                    alt="Venue"
                    className="w-24 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--futsal-navy)" }}>GreenZone Futsal Arena</h3>
                    <div className="space-y-1">
                      {[
                        { icon: MapPin, text: "Kuala Lumpur City Centre" },
                        { icon: Calendar, text: "Tuesday, 10 June 2026" },
                        { icon: Clock, text: "2:00 PM – 3:00 PM (1 hour)" },
                        { icon: Users, text: "Court 1 · Up to 10 players" },
                      ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <Icon size={11} style={{ color: "var(--futsal-green)" }} />
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <h4 className="font-semibold text-sm mb-3" style={{ color: "var(--futsal-navy)" }}>Booking Rules</h4>
                  <ul className="space-y-2">
                    {[
                      "Free cancellation up to 2 hours before the session",
                      "Please arrive 10 minutes early",
                      "Futsal shoes required (no outdoor shoes on the court)",
                      "Maximum 10 players per court at any time",
                    ].map((rule) => (
                      <li key={rule} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "var(--futsal-green)" }} />
                        <span style={{ color: "var(--muted-foreground)" }}>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: "var(--muted-foreground)" }}>
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ background: "var(--input-background)", borderColor: promoApplied ? "var(--futsal-green)" : "var(--border)" }}>
                      <Tag size={14} style={{ color: promoApplied ? "var(--futsal-green)" : "var(--muted-foreground)" }} />
                      <input
                        type="text"
                        placeholder="e.g. FUTSAL10"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={promoApplied}
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                        style={{ color: "var(--foreground)" }}
                      />
                      {promoApplied && <CheckCircle2 size={14} style={{ color: "var(--futsal-green)" }} />}
                    </div>
                    <button
                      onClick={handlePromo}
                      disabled={promoApplied}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      style={{ background: promoApplied ? "var(--secondary)" : "var(--futsal-navy)", color: promoApplied ? "var(--futsal-green)" : "white" }}
                    >
                      {promoApplied ? "Applied!" : "Apply"}
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--futsal-green)" }}>🎉 RM10 discount applied successfully!</p>
                  )}
                  {!promoApplied && <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Try: FUTSAL10</p>}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: "var(--border)" }}>
                <h2 className="font-bold mb-5" style={{ color: "var(--futsal-navy)", fontFamily: "var(--font-display)", textTransform: "uppercase" }}>Player Information</h2>
                <div className="space-y-4">
                  {[
                    { key: "name", label: "Full Name", type: "text", placeholder: "Your full name" },
                    { key: "email", label: "Email Address", type: "email", placeholder: "your@email.com" },
                    { key: "phone", label: "Phone Number", type: "tel", placeholder: "+60 1X-XXX XXXX" },
                    { key: "team", label: "Team Name (optional)", type: "text", placeholder: "e.g. FC Warriors" },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 transition-all"
                        style={{
                          background: "var(--input-background)",
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                        }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Special Requests (optional)</label>
                    <textarea
                      placeholder="Any special requests for the venue..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none resize-none"
                      style={{ background: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: "var(--border)" }}>
                <h2 className="font-bold mb-5" style={{ color: "var(--futsal-navy)", fontFamily: "var(--font-display)", textTransform: "uppercase" }}>Payment Method</h2>
                <div className="space-y-3 mb-6">
                  {[
                    { id: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, AMEX" },
                    { id: "ewallet", label: "E-Wallet", icon: Smartphone, desc: "Touch 'n Go, GrabPay, Boost" },
                    { id: "transfer", label: "Bank Transfer (FPX)", icon: Building2, desc: "All Malaysian banks" },
                  ].map(({ id, label, icon: Icon, desc }) => (
                    <button
                      key={id}
                      onClick={() => setPayMethod(id as typeof payMethod)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all"
                      style={{
                        borderColor: payMethod === id ? "var(--futsal-green)" : "var(--border)",
                        background: payMethod === id ? "var(--secondary)" : "var(--input-background)",
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: payMethod === id ? "var(--futsal-green)" : "var(--muted)" }}>
                        <Icon size={18} style={{ color: payMethod === id ? "white" : "var(--muted-foreground)" }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{label}</p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: payMethod === id ? "var(--futsal-green)" : "var(--border)" }}>
                        {payMethod === id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--futsal-green)" }} />}
                      </div>
                    </button>
                  ))}
                </div>

                {payMethod === "card" && (
                  <div className="space-y-4 p-4 rounded-xl" style={{ background: "var(--input-background)" }}>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Card Number</label>
                      <input type="text" placeholder="1234 5678 9012 3456" className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none" style={{ background: "white", borderColor: "var(--border)", color: "var(--foreground)" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Expiry</label>
                        <input type="text" placeholder="MM / YY" className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none" style={{ background: "white", borderColor: "var(--border)", color: "var(--foreground)" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted-foreground)" }}>CVV</label>
                        <input type="text" placeholder="123" className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none" style={{ background: "white", borderColor: "var(--border)", color: "var(--foreground)" }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Cardholder Name</label>
                      <input type="text" placeholder="As on card" className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none" style={{ background: "white", borderColor: "var(--border)", color: "var(--foreground)" }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <Lock size={12} style={{ color: "var(--futsal-green)" }} />
                  Your payment is secured with 256-bit SSL encryption
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="rounded-2xl border p-6" style={{ background: "white", borderColor: "var(--border)" }}>
                <h2 className="font-bold mb-5" style={{ color: "var(--futsal-navy)", fontFamily: "var(--font-display)", textTransform: "uppercase" }}>Review & Confirm</h2>
                <div className="space-y-4">
                  {[
                    { title: "Venue & Slot", items: ["GreenZone Futsal Arena", "Court 1 · 2:00 PM – 3:00 PM", "Tuesday, 10 June 2026"] },
                    { title: "Player Details", items: [form.name, form.email, form.phone] },
                    { title: "Payment", items: [payMethod === "card" ? "Credit Card **** 3456" : payMethod === "ewallet" ? "E-Wallet" : "Bank Transfer (FPX)", `Total: RM ${total}`] },
                  ].map((section) => (
                    <div key={section.title} className="p-4 rounded-xl" style={{ background: "var(--input-background)" }}>
                      <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>{section.title}</h4>
                      {section.items.map((item) => (
                        <p key={item} className="text-sm" style={{ color: "var(--foreground)" }}>{item}</p>
                      ))}
                    </div>
                  ))}
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    By confirming, you agree to our <a href="#" style={{ color: "var(--futsal-green)" }}>Terms of Service</a> and <a href="#" style={{ color: "var(--futsal-green)" }}>Cancellation Policy</a>. A confirmation email will be sent to {form.email}.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-sm border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "var(--futsal-green)", color: "white" }}
              >
                {step === STEPS.length - 1 ? "Confirm & Pay" : "Continue"}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border sticky top-20" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
                <h3 className="font-semibold text-sm" style={{ color: "var(--futsal-navy)" }}>Order Summary</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>Court rental (1hr)</span>
                  <span style={{ color: "var(--foreground)" }}>RM {basePrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>Service fee</span>
                  <span style={{ color: "var(--foreground)" }}>RM {serviceFee}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--futsal-green)" }}>Promo (FUTSAL10)</span>
                    <span style={{ color: "var(--futsal-green)" }}>−RM {discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--foreground)" }}>Total</span>
                  <span style={{ color: "var(--futsal-navy)" }}>RM {total}</span>
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="rounded-xl p-3 text-xs" style={{ background: "var(--secondary)" }}>
                  <p className="font-semibold mb-1" style={{ color: "var(--futsal-green-dark)" }}>Free Cancellation</p>
                  <p style={{ color: "var(--muted-foreground)" }}>Cancel for free before 12:00 PM on 10 Jun 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

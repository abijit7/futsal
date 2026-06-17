import { ArrowRight, CalendarCheck, Clock, MapPin, Search, ShieldCheck, Star, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const steps = [
  ['Find a Venue', 'Search futsals by location and price.', Search],
  ['Pick a Slot', 'Choose real-time available slots.', Clock],
  ['Pay Securely', 'Confirm with eSewa, Khalti, or cash.', ShieldCheck],
  ['Play', 'Manage every booking from your account.', CalendarCheck]
] as const;

export function Home() {
  const navigate = useNavigate();
  return (
    <main>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1520470082789-e347ad8b1944?w=1600&h=900&fit=crop&auto=format')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-green-950/70" />
        <div className="container-page relative grid min-h-[760px] items-center gap-12 py-20 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-sm font-black uppercase tracking-[0.22em] text-green-300">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" /> Book instantly
            </div>
            <h1 className="max-w-4xl text-6xl font-black leading-[0.92] tracking-tight text-white sm:text-7xl lg:text-8xl">
              Play Hard. <span className="text-green-400">Book Easy.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-300">
              Discover top-rated futsal grounds, check live availability, and secure your pitch in seconds.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button className="btn-primary text-base" onClick={() => navigate('/venues')}>Find a Pitch <ArrowRight size={19} /></button>
              <Link className="btn-soft border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" to="/register">Create account</Link>
            </div>
            <div className="mt-16 grid max-w-xl grid-cols-3 gap-6">
              {[
                ['50+', 'Grounds'],
                ['10k+', 'Players'],
                ['4.9', 'Rating']
              ].map(([value, label]) => (
                <div key={label} className="border-l border-white/10 pl-5 first:border-l-0 first:pl-0">
                  <div className="text-4xl font-black text-white">{value}</div>
                  <div className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="rotate-2 overflow-hidden rounded-[3rem] border-[14px] border-white bg-white shadow-2xl shadow-green-950/30">
              <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=900&h=950&fit=crop&auto=format" alt="Football boot on ball" className="h-[590px] w-full object-cover" />
            </div>
            <div className="absolute -right-6 top-20 rounded-3xl bg-white p-5 shadow-2xl">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Status</div>
              <div className="text-xl font-black text-slate-950">Want to register?</div>
            </div>
            <div className="absolute -bottom-8 left-0 rounded-3xl bg-white p-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <Users className="text-green-600" />
                <div><div className="font-black text-slate-950">200+ Bookings</div><div className="text-sm text-slate-500">This week</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="eyebrow">Your booking, our priority</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Premium futsal booking flow</h2>
          <p className="mt-5 text-lg text-slate-500">A real product interface for players, venue owners, and admins.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {steps.map(([title, text, Icon]) => (
            <div className="panel p-6" key={title}>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600"><Icon /></div>
              <h3 className="text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="panel overflow-hidden bg-slate-950 p-8 text-white md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-3 flex items-center gap-2 text-green-300"><Star fill="currentColor" /> Real-time availability</div>
              <h2 className="text-4xl font-black tracking-tight">Ready to book your next game?</h2>
              <p className="mt-3 max-w-2xl text-slate-300">Browse nearby futsal venues and confirm your slot through the payment flow.</p>
            </div>
            <Link to="/venues" className="btn-primary">Browse futsals <MapPin size={18} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

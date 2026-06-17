import { ArrowRight, CalendarCheck, CalendarDays, Check, ChevronDown, Clock, MapPin, Search, ShieldCheck, Star } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const steps = [
  ['Find a Venue', 'Search futsals by location and price.', Search],
  ['Pick a Slot', 'Choose real-time available slots.', Clock],
  ['Pay Securely', 'Confirm with eSewa, Khalti, or cash.', ShieldCheck],
  ['Play', 'Manage every booking from your account.', CalendarCheck]
] as const;

const locationOptions = ['Kathmandu', 'Putalisadak', 'Lalitpur', 'Bhaktapur'];
const timeOptions = ['Evening', 'Morning', 'Afternoon', 'Night'];
type DropdownKey = 'location' | 'time';

export function Home() {
  const navigate = useNavigate();
  const [location, setLocation] = useState(locationOptions[0]);
  const [time, setTime] = useState(timeOptions[0]);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate('/venues');
  };

  return (
    <main>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1800&h=1100&fit=crop&auto=format')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.95)_0%,rgba(2,6,23,0.82)_48%,rgba(2,6,23,0.4)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-50 to-transparent" />

        <div className="container-page relative flex min-h-[720px] flex-col justify-center py-12 sm:py-20">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-green-400/25 bg-green-400/10 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-green-300 sm:mb-7">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" /> Live futsal availability
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
              Find your pitch. <span className="text-green-400">Book the best slot.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300 sm:mt-7 sm:text-xl">
              Search available futsal grounds by area, date, and preferred game time before you browse.
            </p>
          </div>

          <form
            className="mt-8 grid gap-3 rounded-[2rem] border border-white/15 bg-white p-3 shadow-2xl shadow-slate-950/35 sm:mt-10 lg:grid-cols-[1.1fr_0.9fr_0.9fr_auto]"
            onSubmit={submitSearch}
          >
            <div className="relative flex min-h-20 items-center gap-4 rounded-3xl bg-slate-50 px-5">
              <MapPin className="shrink-0 text-green-600" size={24} />
              <HeroDropdown
                label="Location"
                name="location"
                value={location}
                options={locationOptions}
                open={openDropdown === 'location'}
                onToggle={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
                onSelect={(value) => {
                  setLocation(value);
                  setOpenDropdown(null);
                }}
              />
            </div>

            <label className="flex min-h-20 items-center gap-4 rounded-3xl bg-slate-50 px-5">
              <CalendarDays className="shrink-0 text-green-600" size={24} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-black uppercase tracking-[0.14em] text-slate-400">Date</span>
                <input className="mt-1 w-full bg-transparent text-lg font-black text-slate-950 outline-none" type="date" />
              </span>
            </label>

            <div className="relative flex min-h-20 items-center gap-4 rounded-3xl bg-slate-50 px-5">
              <Clock className="shrink-0 text-green-600" size={24} />
              <HeroDropdown
                label="Time"
                name="time"
                value={time}
                options={timeOptions}
                open={openDropdown === 'time'}
                onToggle={() => setOpenDropdown(openDropdown === 'time' ? null : 'time')}
                onSelect={(value) => {
                  setTime(value);
                  setOpenDropdown(null);
                }}
              />
            </div>

            <button className="btn-primary min-h-20 rounded-3xl px-8 text-base" type="submit">
              Search slots <Search size={19} />
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <Link className="btn-soft border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" to="/venues">
              Browse all futsals <ArrowRight size={18} />
            </Link>
            <Link className="btn-soft border-white/20 bg-white text-slate-950 hover:bg-green-50 hover:text-green-700" to="/register">
              Create account
            </Link>
          </div>

          <div className="absolute bottom-12 right-8 hidden max-w-xs rounded-3xl border border-white/15 bg-white/95 p-5 shadow-2xl lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <Star fill="currentColor" size={22} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-950">12 venues open now</div>
                <div className="mt-1 text-sm font-bold text-slate-500">Next prime slot starts at 6:00 PM</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="container-page scroll-mt-28 py-20">
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

function HeroDropdown({
  label,
  name,
  value,
  options,
  open,
  onToggle,
  onSelect
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <input type="hidden" name={name} value={value} />
      <span className="block text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <button
        aria-expanded={open}
        className="mt-1 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white/0 py-1 text-left text-lg font-black text-slate-950 outline-none transition focus-visible:ring-4 focus-visible:ring-green-100"
        onClick={onToggle}
        type="button"
      >
        <span className="truncate">{value}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition ${open ? 'rotate-180 text-green-600' : ''}`}>
          <ChevronDown size={18} />
        </span>
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/20">
          {options.map((option) => {
            const selected = option === value;
            return (
              <button
                className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition ${selected ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'}`}
                key={option}
                onClick={() => onSelect(option)}
                type="button"
              >
                <span>{option}</span>
                {selected && <Check size={17} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

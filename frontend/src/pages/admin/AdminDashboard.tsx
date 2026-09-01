import { Activity, Calendar, CheckCircle2, Clock3, MapPin, Plus, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../../components/UI';

const cards = [
  {
    title: 'Venues',
    text: 'Create, edit, upload images, and delete venues when the backend allows it.',
    href: '/admin/futsals',
    icon: MapPin
  },
  {
    title: 'Slots',
    text: 'Add individual slots or bulk-generate schedules from venue hours.',
    href: '/admin/slots',
    icon: Calendar
  },
  {
    title: 'Users',
    text: 'Review registered users and remove accounts through admin APIs.',
    href: '/admin/users',
    icon: Users
  }
];

export function AdminDashboard() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Operational focus" value="Today" hint="Review bookings first" icon={<Activity size={21} />} tone="green" />
        <MetricCard label="Booking queue" value="Live" hint="Approve or reject pending requests" icon={<Clock3 size={21} />} tone="amber" />
        <MetricCard label="Venue catalog" value="Managed" hint="Keep images and prices fresh" icon={<MapPin size={21} />} tone="slate" />
        <MetricCard label="Account security" value="Active" hint="Monitor users and roles" icon={<ShieldCheck size={21} />} tone="navy" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <p className="eyebrow">Quick actions</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Run daily operations</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">The most common admin workflows are grouped here for fast scanning.</p>
          </div>
          <div className="motion-stagger grid gap-4 p-5 md:grid-cols-3">
            {cards.map(({ title, text, href, icon: Icon }) => (
              <Link key={href} to={href} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <p className="eyebrow">Status overview</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">What to check</h2>
          </div>
          <div className="grid gap-3 p-5">
            <AdminStep icon={<Clock3 size={18} />} title="Pending bookings" text="Approve, reject, or cancel bookings before customers arrive." />
            <AdminStep icon={<Calendar size={18} />} title="Slot coverage" text="Generate upcoming slots and fill gaps in venue schedules." />
            <AdminStep icon={<CheckCircle2 size={18} />} title="Venue quality" text="Confirm every venue has clear images, pricing, hours, and contact details." />
            <Link to="/admin/futsals" className="btn-primary mt-2 w-full">
              <Plus size={18} />
              Add or edit venues
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

function AdminStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-3xl bg-slate-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-green-600 ring-1 ring-slate-200">{icon}</div>
      <div>
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

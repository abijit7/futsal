import { Calendar, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <section className="motion-stagger grid gap-5 lg:grid-cols-3">
      {cards.map(({ title, text, href, icon: Icon }) => (
        <Link key={href} to={href} className="panel p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
            <Icon size={22} />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
        </Link>
      ))}
    </section>
  );
}

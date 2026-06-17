import { CalendarCheck, Clock, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { bookingApi, futsalApi, userApi } from '../../api/modules';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/State';
import type { Booking } from '../../types/api';
import { formatDate, timeRange } from '../../utils/format';

const statCards = [
  { label: 'Futsals', key: 'futsals', icon: MapPin },
  { label: 'Users', key: 'users', icon: Users },
  { label: 'Bookings', key: 'bookings', icon: CalendarCheck },
  { label: 'Pending', key: 'pending', icon: Clock }
] as const;

export function AdminDashboard() {
  const [stats, setStats] = useState({ futsals: 0, users: 0, bookings: 0, pending: 0 });
  const [recent, setRecent] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      futsalApi.list({ page: 0, size: 1 }),
      userApi.list(0, 1),
      bookingApi.all({ page: 0, size: 6, status: 'ALL' }),
      bookingApi.all({ page: 0, size: 1, status: 'PENDING' })
    ]).then(([futsals, users, bookings, pending]) => {
      setStats({ futsals: futsals.totalItems || 0, users: users.totalItems || 0, bookings: bookings.totalItems || 0, pending: pending.totalItems || 0 });
      setRecent(bookings.items || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading admin metrics" />;

  return (
    <section>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {statCards.map(({ label, key, icon: Icon }) => <div key={label} className="panel p-5"><Icon className="mb-4 text-green-600" /><div className="text-3xl font-black text-slate-950">{stats[key]}</div><div className="text-sm font-bold text-slate-500">{label}</div></div>)}
      </div>
      <div className="table-wrap">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500"><tr><th className="p-4">Booking</th><th className="p-4">Date</th><th className="p-4">Time</th><th className="p-4">Status</th></tr></thead>
          <tbody>{recent.map((item) => <tr key={item.bookingId} className="border-t border-slate-100"><td className="p-4 font-bold">{item.user?.name || 'User'} · {item.timeSlot?.futsal?.name || 'Venue'}</td><td className="p-4">{formatDate(item.timeSlot?.slotDate)}</td><td className="p-4">{timeRange(item.timeSlot?.startTime, item.timeSlot?.endTime)}</td><td className="p-4"><StatusBadge status={item.status} /></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

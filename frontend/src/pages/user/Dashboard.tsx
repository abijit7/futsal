import { CalendarDays, Clock, Plus, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../../api/modules';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState, LoadingState } from '../../components/State';
import { useAuth } from '../../context/AuthContext';
import type { Booking } from '../../types/api';
import { formatDate, timeRange } from '../../utils/format';

const summaryCards = [
  { label: 'Pending', key: 'pending', icon: Clock },
  { label: 'Approved', key: 'approved', icon: CalendarDays },
  { label: 'Cancelled', key: 'cancelled', icon: UserRound }
] as const;

export function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    bookingApi.byUser(user.userId, 0, 8).then((data) => setBookings(data.items || [])).finally(() => setLoading(false));
  }, [user]);

  const counts = useMemo(() => ({
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    approved: bookings.filter((b) => b.status === 'APPROVED').length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length
  }), [bookings]);

  return (
    <main className="container-page py-10">
      <section className="mb-8 rounded-[2rem] bg-slate-950 p-8 text-white">
        <p className="eyebrow text-green-300">Player dashboard</p>
        <h1 className="mt-3 text-4xl font-black">Welcome back, {user?.name}</h1>
        <p className="mt-3 text-slate-300">Manage bookings and reserve your next game.</p>
        <Link className="btn-primary mt-6" to="/booking"><Plus size={18} /> Quick book</Link>
      </section>
      <div className="mb-8 grid gap-5 md:grid-cols-3">
        {summaryCards.map(({ label, key, icon: Icon }) => (
          <div key={label} className="panel p-6"><Icon className="mb-4 text-green-600" /><div className="text-3xl font-black text-slate-950">{counts[key]}</div><div className="text-sm font-bold text-slate-500">{label} bookings</div></div>
        ))}
      </div>
      {loading ? <LoadingState /> : bookings.length === 0 ? <EmptyState title="No bookings yet" description="Book your first futsal slot to see it here." action={<Link className="btn-primary" to="/booking">Book now</Link>} /> : (
        <div className="table-wrap">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500"><tr><th className="p-4">Venue</th><th className="p-4">Date</th><th className="p-4">Time</th><th className="p-4">Status</th></tr></thead>
            <tbody>{bookings.map((booking) => <tr key={booking.bookingId} className="border-t border-slate-100"><td className="p-4 font-bold">{booking.timeSlot?.futsal?.name || 'Venue'}</td><td className="p-4">{formatDate(booking.timeSlot?.slotDate)}</td><td className="p-4">{timeRange(booking.timeSlot?.startTime, booking.timeSlot?.endTime)}</td><td className="p-4"><StatusBadge status={booking.status} /></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </main>
  );
}

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { bookingApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState, LoadingState } from '../../components/State';
import { useAuth } from '../../context/AuthContext';
import type { Booking, BookingStatus } from '../../types/api';
import { formatDate, timeRange } from '../../utils/format';

export function MyBookings() {
  const { user } = useAuth();
  const location = useLocation();
  const success = (location.state as { success?: string } | null)?.success;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    bookingApi.byUser(user.userId, page, 10).then((data) => {
      setBookings(data.items || []);
      setTotalPages(data.totalPages || 0);
    }).finally(() => setLoading(false));
  }, [user, page]);

  const visible = filter === 'ALL' ? bookings : bookings.filter((item) => item.status === filter);

  return (
    <main className="container-page py-10">
      <div className="mb-6">
        <p className="eyebrow">My bookings</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Booking management</h1>
      </div>
      {success && <div className="mb-6 rounded-2xl bg-green-50 p-4 font-bold text-green-700">{success}</div>}
      <div className="mb-5 flex flex-wrap gap-2">{(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((item) => <button key={item} className={filter === item ? 'btn-navy px-4 py-2' : 'btn-soft px-4 py-2'} onClick={() => setFilter(item)}>{item}</button>)}</div>
      {loading ? <LoadingState /> : visible.length === 0 ? <EmptyState title="No bookings found" /> : (
        <div className="grid gap-4">
          {visible.map((booking) => <div key={booking.bookingId} className="panel flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div><div className="text-lg font-black text-slate-950">{booking.timeSlot?.futsal?.name || 'Futsal venue'}</div><div className="mt-1 text-sm font-bold text-slate-500">{formatDate(booking.timeSlot?.slotDate)} · {timeRange(booking.timeSlot?.startTime, booking.timeSlot?.endTime)}</div><div className="mt-1 text-xs text-slate-400">{booking.paymentMethod} {booking.paymentRef ? `· ${booking.paymentRef}` : ''}</div></div><StatusBadge status={booking.status} /></div>)}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </main>
  );
}

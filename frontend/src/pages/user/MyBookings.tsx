import { useEffect, useState } from 'react';
import { bookingApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, LoadingState } from '../../components/State';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import type { Booking, BookingStatus } from '../../types/api';
import { formatDate, timeRangeWithDuration } from '../../utils/format';

export function MyBookings() {
  const { user } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);
  const [status, setStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await bookingApi.byUser(user.userId, page, 10, status);
      setItems(data.items || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.userId, page, status]);

  const cancel = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    setError('');
    try {
      await bookingApi.updateStatus(id, 'CANCELLED');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel booking');
    }
  };

  return (
    <main className="container-page py-10">
      <section className="mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">Customer dashboard</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">My bookings</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Live booking records from the backend.</p>
      </section>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((item) => (
          <button key={item} className={status === item ? 'btn-navy px-4 py-2' : 'btn-soft px-4 py-2'} onClick={() => { setStatus(item); setPage(0); }}>{item}</button>
        ))}
      </div>

      {error && <p className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="No bookings found" /> : (
        <div className="grid gap-4">
          {items.map((booking) => (
            <article key={booking.bookingId} className="panel p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-black text-slate-950">{booking.timeSlot?.futsal?.name || 'Venue'}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">{formatDate(booking.timeSlot?.slotDate)} · {timeRangeWithDuration(booking.timeSlot?.startTime, booking.timeSlot?.endTime)}</p>
                  <p className="mt-1 text-xs text-slate-400">{booking.paymentMethod} {booking.paymentRef}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              {canCancel(booking.status) && (
                <button className="btn-soft mt-4 px-4 py-2" onClick={() => cancel(booking.bookingId)}>Cancel booking</button>
              )}
            </article>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </main>
  );
}

function canCancel(status: BookingStatus) {
  return status === 'PENDING' || status === 'APPROVED';
}

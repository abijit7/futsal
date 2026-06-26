import { useEffect, useState } from 'react';
import { bookingApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState, LoadingState } from '../../components/State';
import type { Booking, BookingStatus } from '../../types/api';
import { formatDate, timeRangeWithDuration } from '../../utils/format';

export function AdminBookings() {
  const [items, setItems] = useState<Booking[]>([]);
  const [status, setStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await bookingApi.all({ page, size: 10, status });
    setItems(data.items || []);
    setTotalPages(data.totalPages || 0);
    setLoading(false);
  };
  useEffect(() => { load(); }, [page, status]);

  const update = async (id: number, next: BookingStatus) => {
    await bookingApi.updateStatus(id, next);
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this booking?')) return;
    await bookingApi.delete(id);
    await load();
  };

  return (
    <section>
      <div className="mb-5 flex flex-wrap gap-2">{(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((item) => <button key={item} className={status === item ? 'btn-navy px-4 py-2' : 'btn-soft px-4 py-2'} onClick={() => { setStatus(item); setPage(0); }}>{item}</button>)}</div>
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="No bookings found" /> : <div className="grid gap-4">{items.map((booking) => <div key={booking.bookingId} className="panel p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h3 className="font-black text-slate-950">{booking.user?.name || 'User'} · {booking.timeSlot?.futsal?.name || 'Venue'}</h3><p className="mt-1 text-sm font-bold text-slate-500">{formatDate(booking.timeSlot?.slotDate)} · {timeRangeWithDuration(booking.timeSlot?.startTime, booking.timeSlot?.endTime)}</p><p className="mt-1 text-xs text-slate-400">{booking.paymentMethod} {booking.paymentRef}</p></div><StatusBadge status={booking.status} /></div><div className="mt-4 flex flex-wrap gap-2">{nextAdminStatuses(booking.status).map((next) => <button key={next} className="btn-soft px-4 py-2" onClick={() => update(booking.bookingId, next)}>{labelFor(next)}</button>)}<button className="btn-navy px-4 py-2" onClick={() => remove(booking.bookingId)}>Delete</button></div></div>)}</div>}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </section>
  );
}

function nextAdminStatuses(status: BookingStatus): BookingStatus[] {
  if (status === 'PENDING') return ['APPROVED', 'REJECTED', 'CANCELLED'];
  if (status === 'APPROVED') return ['CANCELLED'];
  return [];
}

function labelFor(status: BookingStatus) {
  if (status === 'APPROVED') return 'Approve';
  if (status === 'REJECTED') return 'Reject';
  if (status === 'CANCELLED') return 'Cancel';
  return status;
}

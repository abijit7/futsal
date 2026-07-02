import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, CreditCard, Search, XCircle } from 'lucide-react';
import { bookingApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { StatusBadge } from '../../components/StatusBadge';
import { Button, Chip, Field, FilterBar, MetricCard, PageHero, SelectField } from '../../components/UI';
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
  const [search, setSearch] = useState('');

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

  const filteredItems = items.filter((booking) => {
    const haystack = `${booking.timeSlot?.futsal?.name || ''} ${booking.paymentMethod || ''} ${booking.paymentRef || ''}`.toLowerCase();
    return !search.trim() || haystack.includes(search.trim().toLowerCase());
  });

  const counts = {
    total: items.length,
    pending: items.filter((item) => item.status === 'PENDING').length,
    approved: items.filter((item) => item.status === 'APPROVED').length
  };

  return (
    <main className="container-page py-10">
      <PageHero eyebrow="Customer dashboard" title="My bookings" description="Track upcoming reservations, payment references, and booking status from your account." icon={<CalendarDays size={34} />} />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Loaded bookings" value={counts.total} icon={<CalendarDays size={20} />} tone="slate" />
        <MetricCard label="Pending" value={counts.pending} icon={<Clock3 size={20} />} tone="amber" />
        <MetricCard label="Approved" value={counts.approved} icon={<CalendarDays size={20} />} tone="green" />
      </div>

      <FilterBar className="mb-5 md:grid-cols-[1fr_220px_auto] md:items-end">
        <Field label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Venue or payment reference" prefix={<Search size={18} />} />
        <SelectField label="Status" value={status} onChange={(event) => { setStatus(event.target.value as BookingStatus | 'ALL'); setPage(0); }}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : item}</option>)}
        </SelectField>
        <Button type="button" variant="outline" onClick={() => { setSearch(''); setStatus('ALL'); setPage(0); }}>Clear filters</Button>
      </FilterBar>

      {(search || status !== 'ALL') && (
        <div className="mb-5 flex flex-wrap gap-2">
          {search && <Chip onRemove={() => setSearch('')}>Search: {search}</Chip>}
          {status !== 'ALL' && <Chip tone="green" onRemove={() => setStatus('ALL')}>Status: {status}</Chip>}
        </div>
      )}

      {error && <div className="mb-5"><ErrorState message={error} retry={load} /></div>}
      {loading ? <LoadingState /> : filteredItems.length === 0 ? <EmptyState title="No bookings found" description="No booking matches the selected filters." /> : (
        <div className="motion-stagger grid gap-4">
          {filteredItems.map((booking) => (
            <article key={booking.bookingId} className="panel overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Booking #{booking.bookingId}</span>
                  <StatusBadge status={booking.status} />
                </div>
              </div>
              <div className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black text-slate-950">{booking.timeSlot?.futsal?.name || 'Venue'}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500"><Clock3 size={16} className="text-green-600" /> {formatDate(booking.timeSlot?.slotDate)} · {timeRangeWithDuration(booking.timeSlot?.startTime, booking.timeSlot?.endTime)}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-400"><CreditCard size={15} /> {booking.paymentMethod || 'Payment'} {booking.paymentRef || ''}</p>
                </div>
                {canCancel(booking.status) && (
                  <Button type="button" variant="outline" size="sm" onClick={() => cancel(booking.bookingId)}>
                    <XCircle size={16} /> Cancel booking
                  </Button>
                )}
              </div>
              </div>
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

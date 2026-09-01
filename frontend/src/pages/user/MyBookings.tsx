import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, CreditCard, MapPin, Search, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { StatusBadge } from '../../components/StatusBadge';
import { Button, Chip, Field, FilterBar, MetricCard, ModalShell, PageHero, SelectField } from '../../components/UI';
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
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

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

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setError('');
    try {
      await bookingApi.updateStatus(cancelTarget.bookingId, 'CANCELLED');
      setCancelTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel booking');
      setCancelTarget(null);
    } finally {
      setCancelling(false);
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

  const hasFilters = Boolean(search || status !== 'ALL');

  return (
    <main className="container-page py-10">
      <PageHero
        eyebrow="Customer dashboard"
        title="My bookings"
        description="Track upcoming reservations, payment references, and booking status from your account."
        icon={<CalendarDays size={34} />}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Loaded bookings" value={counts.total} icon={<CalendarDays size={20} />} tone="slate" />
        <MetricCard label="Pending" value={counts.pending} icon={<Clock3 size={20} />} tone="amber" />
        <MetricCard label="Approved" value={counts.approved} icon={<CalendarDays size={20} />} tone="green" />
      </div>

      <FilterBar className="mb-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
        <Field label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Venue or payment reference" prefix={<Search size={18} />} />
        <SelectField label="Status" value={status} onChange={(event) => { setStatus(event.target.value as BookingStatus | 'ALL'); setPage(0); }}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((item) => (
            <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : item}</option>
          ))}
        </SelectField>
        <Button type="button" variant="outline" disabled={!hasFilters} onClick={() => { setSearch(''); setStatus('ALL'); setPage(0); }}>Clear filters</Button>
      </FilterBar>

      {hasFilters && (
        <div className="mb-5 flex flex-wrap gap-2">
          {search && <Chip onRemove={() => setSearch('')}>Search: {search}</Chip>}
          {status !== 'ALL' && <Chip tone="green" onRemove={() => setStatus('ALL')}>Status: {status}</Chip>}
        </div>
      )}

      {error && <div className="mb-5"><ErrorState message={error} retry={load} /></div>}

      {loading ? (
        <LoadingState label="Loading your bookings" />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No bookings match those filters' : 'No bookings yet'}
          description={hasFilters
            ? 'Try clearing the filters to see your full booking history.'
            : 'Once you book a court it will appear here with its status and payment reference.'}
          action={hasFilters
            ? <Button type="button" variant="outline" onClick={() => { setSearch(''); setStatus('ALL'); setPage(0); }}>Clear filters</Button>
            : <Link to="/venues" className="btn-primary">Browse venues</Link>}
        />
      ) : (
        <div className="motion-stagger grid gap-4">
          {filteredItems.map((booking) => (
            <article key={booking.bookingId} className="panel overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Booking #{booking.bookingId}</span>
                <StatusBadge status={booking.status} />
              </div>
              <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black text-slate-950">{booking.timeSlot?.futsal?.name || 'Venue'}</h2>
                  {booking.timeSlot?.futsal?.city && (
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <MapPin size={15} className="shrink-0 text-green-600" aria-hidden="true" />
                      {booking.timeSlot.futsal.city}
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-600">
                    <Clock3 size={16} className="shrink-0 text-green-600" aria-hidden="true" />
                    {formatDate(booking.timeSlot?.slotDate)} · {timeRangeWithDuration(booking.timeSlot?.startTime, booking.timeSlot?.endTime)}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                    <CreditCard size={15} className="shrink-0" aria-hidden="true" />
                    {booking.paymentMethod || 'Payment'} {booking.paymentRef || ''}
                  </p>
                </div>
                {canCancel(booking.status) && (
                  <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setCancelTarget(booking)}>
                    <XCircle size={16} /> Cancel booking
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {cancelTarget && (
        <ModalShell
          title={`Cancel booking #${cancelTarget.bookingId}?`}
          eyebrow="Confirm cancellation"
          description={cancelTarget.timeSlot?.futsal?.name || 'This booking'}
          onClose={() => setCancelTarget(null)}
          footer={(
            <>
              <Button type="button" variant="outline" disabled={cancelling} onClick={() => setCancelTarget(null)}>Keep booking</Button>
              <Button type="button" variant="destructive" loading={cancelling} onClick={confirmCancel}>Cancel booking</Button>
            </>
          )}
        >
          <p className="text-sm font-semibold leading-6 text-slate-600">
            {formatDate(cancelTarget.timeSlot?.slotDate)} · {timeRangeWithDuration(cancelTarget.timeSlot?.startTime, cancelTarget.timeSlot?.endTime)}
          </p>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
            The slot is released back to other players. This cannot be undone.
          </p>
        </ModalShell>
      )}
    </main>
  );
}

function canCancel(status: BookingStatus) {
  return status === 'PENDING' || status === 'APPROVED';
}

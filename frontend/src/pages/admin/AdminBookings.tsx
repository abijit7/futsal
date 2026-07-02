import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarDays, CreditCard, Eye, Mail, Phone, Search, Trash2, UserRound } from 'lucide-react';
import { bookingApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { AdminPageHeader, Button, Chip, Field, FilterBar, MetricCard, ModalShell, SelectField } from '../../components/UI';
import type { Booking, BookingStatus } from '../../types/api';
import { formatDate, timeRangeWithDuration } from '../../utils/format';

export function AdminBookings() {
  const [items, setItems] = useState<Booking[]>([]);
  const [status, setStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; text: string; action: () => Promise<void>; variant?: 'destructive' | 'primary' } | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bookingApi.all({ page, size: 10, status });
      setItems(data.items || []);
      setTotalPages(data.totalPages || 0);
    } catch {
      setItems([]);
      setTotalPages(0);
      setError('Unable to load bookings. Check the backend connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [page, status]);

  const update = async (id: number, next: BookingStatus) => {
    setError('');
    try {
      await bookingApi.updateStatus(id, next);
      await load();
    } catch {
      setError('Booking status could not be updated.');
    }
  };

  const remove = async (id: number) => {
    setError('');
    try {
      await bookingApi.delete(id);
      await load();
    } catch {
      setError('Booking could not be deleted.');
    }
  };

  const filteredItems = items.filter((booking) => {
    const haystack = [
      booking.user?.name,
      booking.user?.email,
      booking.user?.phone,
      booking.timeSlot?.futsal?.name,
      booking.paymentMethod,
      booking.paymentRef
    ].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
    const matchesDate = !dateFilter || booking.timeSlot?.slotDate === dateFilter;
    return matchesSearch && matchesDate;
  });

  const counts = {
    total: items.length,
    pending: items.filter((item) => item.status === 'PENDING').length,
    approved: items.filter((item) => item.status === 'APPROVED').length,
    cancelled: items.filter((item) => item.status === 'CANCELLED').length
  };

  return (
    <section className="space-y-5">
      <AdminPageHeader
        eyebrow="Booking operations"
        title="Bookings"
        description="Review requests, approve slots, and keep booking history controlled."
        meta={<Chip tone="green">{filteredItems.length} visible</Chip>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Loaded bookings" value={counts.total} icon={<CalendarDays size={20} />} tone="slate" />
        <MetricCard label="Pending" value={counts.pending} icon={<CalendarDays size={20} />} tone="amber" />
        <MetricCard label="Approved" value={counts.approved} icon={<CalendarDays size={20} />} tone="green" />
        <MetricCard label="Cancelled" value={counts.cancelled} icon={<CalendarDays size={20} />} tone="red" />
      </div>

      <FilterBar className="lg:grid-cols-[1fr_180px_220px_auto] lg:items-end">
        <Field label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Customer, venue, phone, payment" prefix={<Search size={18} />} />
        <Field label="Date" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
        <SelectField label="Status" value={status} onChange={(event) => { setStatus(event.target.value as BookingStatus | 'ALL'); setPage(0); }}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((item) => <option key={item} value={item}>{labelForFilter(item)}</option>)}
        </SelectField>
        <Button variant="outline" type="button" onClick={() => { setSearch(''); setDateFilter(''); setStatus('ALL'); setPage(0); }}>Clear filters</Button>
      </FilterBar>

      {(search || dateFilter || status !== 'ALL') && (
        <div className="flex flex-wrap gap-2">
          {search && <Chip onRemove={() => setSearch('')}>Search: {search}</Chip>}
          {dateFilter && <Chip onRemove={() => setDateFilter('')}>Date: {formatDate(dateFilter)}</Chip>}
          {status !== 'ALL' && <Chip tone="green" onRemove={() => setStatus('ALL')}>Status: {labelFor(status)}</Chip>}
        </div>
      )}

      {error && !loading && <ErrorState message={error} retry={load} />}
      {loading ? <LoadingState /> : !error && filteredItems.length === 0 ? <EmptyState title="No bookings found" description="No booking matches the current filters." /> : (
        <div className="motion-stagger grid gap-4">
          {filteredItems.map((booking) => (
            <article key={booking.bookingId} className="panel overflow-hidden">
              <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Booking #{booking.bookingId}</p>
                      <h3 className="mt-1 truncate text-xl font-black text-slate-950">{booking.timeSlot?.futsal?.name || 'Venue unavailable'}</h3>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                    <InfoItem icon={<UserRound size={16} />} label="Customer" value={booking.user?.name || 'Unknown user'} />
                    <InfoItem icon={<Phone size={16} />} label="Phone" value={booking.user?.phone || 'Not provided'} />
                    <InfoItem icon={<CalendarDays size={16} />} label="Slot" value={`${formatDate(booking.timeSlot?.slotDate)} · ${timeRangeWithDuration(booking.timeSlot?.startTime, booking.timeSlot?.endTime)}`} />
                    <InfoItem icon={<CreditCard size={16} />} label="Payment" value={paymentLabel(booking)} />
                  </div>
                  {booking.user?.email && (
                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <Mail size={15} className="text-green-600" />
                      <span className="truncate">{booking.user.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row xl:w-56 xl:flex-col">
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setSelected(booking)}>
                    <Eye size={16} /> Details
                  </Button>
                  {nextAdminStatuses(booking.status).map((next) => (
                    <Button key={next} type="button" variant={next === 'APPROVED' ? 'primary' : 'outline'} size="sm" className="w-full" onClick={() => setConfirm({ title: `${labelFor(next)} booking?`, text: `This will change booking #${booking.bookingId} to ${labelFor(next).toLowerCase()}.`, action: () => update(booking.bookingId, next), variant: next === 'CANCELLED' || next === 'REJECTED' ? 'destructive' : 'primary' })}>
                      {labelFor(next)}
                    </Button>
                  ))}
                  <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => setConfirm({ title: 'Delete booking?', text: `Booking #${booking.bookingId} will be permanently removed if the backend allows it.`, action: () => remove(booking.bookingId), variant: 'destructive' })}>
                    <Trash2 size={16} /> Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {selected && (
        <ModalShell title={`Booking #${selected.bookingId}`} eyebrow="Booking details" description={selected.timeSlot?.futsal?.name || 'Venue unavailable'} onClose={() => setSelected(null)}>
          <div className="grid gap-3 text-sm font-semibold text-slate-600">
            <InfoItem icon={<UserRound size={16} />} label="Customer" value={selected.user?.name || 'Unknown user'} />
            <InfoItem icon={<Mail size={16} />} label="Email" value={selected.user?.email || 'Not provided'} />
            <InfoItem icon={<Phone size={16} />} label="Phone" value={selected.user?.phone || 'Not provided'} />
            <InfoItem icon={<CalendarDays size={16} />} label="Slot" value={`${formatDate(selected.timeSlot?.slotDate)} · ${timeRangeWithDuration(selected.timeSlot?.startTime, selected.timeSlot?.endTime)}`} />
            <InfoItem icon={<CreditCard size={16} />} label="Payment" value={paymentLabel(selected)} />
          </div>
        </ModalShell>
      )}

      {confirm && (
        <ModalShell
          title={confirm.title}
          eyebrow="Confirm action"
          description={confirm.text}
          onClose={() => setConfirm(null)}
          footer={(
            <>
              <Button type="button" variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button type="button" variant={confirm.variant === 'destructive' ? 'destructive' : 'primary'} onClick={async () => { const action = confirm.action; setConfirm(null); await action(); }}>Confirm</Button>
            </>
          )}
        >
          <p className="text-sm font-semibold leading-6 text-slate-500">This keeps high-impact booking changes intentional and reversible only when the backend supports it.</p>
        </ModalShell>
      )}
    </section>
  );
}

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-green-600">{icon}<span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</span></div>
      <p className="mt-1 truncate text-slate-800">{value}</p>
    </div>
  );
}

function paymentLabel(booking: Booking) {
  const method = booking.paymentMethod || 'Payment';
  return booking.paymentRef ? `${method} · ${booking.paymentRef}` : method;
}

function labelForFilter(status: BookingStatus | 'ALL') {
  if (status === 'ALL') return 'All';
  return labelFor(status);
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

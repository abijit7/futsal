import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Ban, CalendarDays, CheckCircle2, Clock3, CreditCard, Eye, Mail, Phone, Search, Trash2, UserRound, XCircle } from 'lucide-react';
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
  const [statusAction, setStatusAction] = useState<{ booking: Booking; next: BookingStatus } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [mutatingId, setMutatingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bookingApi.all({ page, size: 10, status, q: search.trim() || undefined, slotDate: dateFilter || undefined });
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
  // The search box and date picker feed the backend query, so they have to be dependencies -
  // previously only [page, status] were, and typing in the search box did nothing at all.
  // The text input is debounced so each keystroke does not issue a request.
  useEffect(() => {
    const timer = window.setTimeout(load, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [page, status, search, dateFilter]);

  const update = async (id: number, next: BookingStatus) => {
    setError('');
    setMutatingId(id);
    try {
      await bookingApi.updateStatus(id, next);
      await load();
    } catch {
      setError('Booking status could not be updated.');
    } finally {
      setMutatingId(null);
    }
  };

  const remove = async (id: number) => {
    setError('');
    setMutatingId(id);
    try {
      await bookingApi.delete(id);
      await load();
    } catch {
      setError('Booking could not be deleted.');
    } finally {
      setMutatingId(null);
    }
  };

  const filteredItems = items;

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
        <Field label="Search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Customer, venue, phone, payment" prefix={<Search size={18} />} />
        <Field label="Date" type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(0); }} />
        <SelectField label="Status" value={status} onChange={(event) => { setStatus(event.target.value as BookingStatus | 'ALL'); setPage(0); }}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map((item) => <option key={item} value={item}>{labelForFilter(item)}</option>)}
        </SelectField>
        <Button variant="outline" type="button" onClick={() => { setSearch(''); setDateFilter(''); setStatus('ALL'); setPage(0); }}>Clear filters</Button>
      </FilterBar>

      {(search || dateFilter || status !== 'ALL') && (
        <div className="flex flex-wrap gap-2">
          {search && <Chip onRemove={() => { setSearch(''); setPage(0); }}>Search: {search}</Chip>}
          {dateFilter && <Chip onRemove={() => { setDateFilter(''); setPage(0); }}>Date: {formatDate(dateFilter)}</Chip>}
          {status !== 'ALL' && <Chip tone="green" onRemove={() => { setStatus('ALL'); setPage(0); }}>Status: {labelFor(status)}</Chip>}
        </div>
      )}

      {error && !loading && <ErrorState message={error} retry={load} />}
      {loading ? <LoadingState /> : !error && filteredItems.length === 0 ? <EmptyState title="No bookings found" description="No booking matches the current filters." /> : (
        <div className="motion-stagger grid gap-4" aria-live="polite">
          {filteredItems.map((booking) => (
            <article key={booking.bookingId} className="panel overflow-hidden border-slate-200">
              <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_260px]">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Booking #{booking.bookingId}</p>
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
                  {booking.notes && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 text-slate-500">
                      <span className="font-black text-slate-700">Note:</span> {booking.notes}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3 px-1">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Admin action</p>
                      <p className="text-sm font-black text-slate-900">{actionSummary(booking.status)}</p>
                    </div>
                    <Clock3 size={18} className="text-green-600" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <Button type="button" variant="outline" size="sm" className="w-full bg-white" disabled={mutatingId === booking.bookingId} onClick={() => setSelected(booking)}>
                      <Eye size={16} /> Details
                    </Button>
                    {nextAdminStatuses(booking.status).map((next) => {
                      const config = actionConfig(next);
                      return (
                        <Button
                          key={next}
                          type="button"
                          variant={config.variant}
                          size="sm"
                          className="w-full"
                          disabled={mutatingId === booking.bookingId}
                          onClick={() => setStatusAction({ booking, next })}
                        >
                          {config.icon} {config.buttonLabel}
                        </Button>
                      );
                    })}
                    <Button type="button" variant="destructive" size="sm" className="w-full" loading={mutatingId === booking.bookingId} onClick={() => setDeleteTarget(booking)}>
                      <Trash2 size={16} /> Delete
                    </Button>
                  </div>
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

      {statusAction && (
        <ModalShell
          title={actionConfig(statusAction.next).modalTitle}
          eyebrow="Booking decision"
          description={actionConfig(statusAction.next).modalDescription}
          onClose={() => setStatusAction(null)}
          maxWidth="max-w-xl"
          footer={(
            <>
              <Button type="button" variant="outline" onClick={() => setStatusAction(null)}>Keep current status</Button>
              <Button
                type="button"
                variant={actionConfig(statusAction.next).variant}
                loading={mutatingId === statusAction.booking.bookingId}
                onClick={async () => {
                  const { booking, next } = statusAction;
                  setStatusAction(null);
                  await update(booking.bookingId, next);
                }}
              >
                {actionConfig(statusAction.next).icon} {actionConfig(statusAction.next).confirmLabel}
              </Button>
            </>
          )}
        >
          <DecisionPreview booking={statusAction.booking} next={statusAction.next} />
        </ModalShell>
      )}

      {deleteTarget && (
        <ModalShell
          title="Delete booking?"
          eyebrow="Permanent action"
          description={`Booking #${deleteTarget.bookingId} will be removed if the backend allows it.`}
          onClose={() => setDeleteTarget(null)}
          maxWidth="max-w-xl"
          footer={(
            <>
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                type="button"
                variant="destructive"
                loading={mutatingId === deleteTarget.bookingId}
                onClick={async () => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  await remove(target.bookingId);
                }}
              >
                <Trash2 size={16} /> Delete booking
              </Button>
            </>
          )}
        >
          <DecisionPreview booking={deleteTarget} next="CANCELLED" destructive />
        </ModalShell>
      )}
    </section>
  );
}

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-green-600">{icon}<span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span></div>
      <p className="mt-1 truncate text-slate-800">{value}</p>
    </div>
  );
}

function paymentLabel(booking: Booking) {
  const method = booking.paymentMethod || 'Payment';
  return booking.paymentRef ? `${method} · ${booking.paymentRef}` : method;
}

function DecisionPreview({ booking, next, destructive = false }: { booking: Booking; next: BookingStatus; destructive?: boolean }) {
  const config = actionConfig(next);
  return (
    <div className="space-y-4">
      <div className={`rounded-3xl border p-4 ${destructive ? 'border-red-100 bg-red-50' : config.noticeClass}`}>
        <div className="flex gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${destructive ? 'bg-red-600 text-white' : config.iconClass}`}>
            {destructive ? <AlertTriangle size={21} /> : config.icon}
          </div>
          <div>
            <p className={`text-sm font-black ${destructive ? 'text-red-900' : config.titleClass}`}>{destructive ? 'This cannot be undone from this screen.' : config.noticeTitle}</p>
            <p className={`mt-1 text-sm font-semibold leading-6 ${destructive ? 'text-red-700' : config.bodyClass}`}>{destructive ? 'Use delete only for invalid or duplicate records. Reject or cancel is safer when history should remain visible.' : config.noticeText}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoItem icon={<UserRound size={16} />} label="Customer" value={booking.user?.name || 'Unknown user'} />
        <InfoItem icon={<Phone size={16} />} label="Phone" value={booking.user?.phone || 'Not provided'} />
        <InfoItem icon={<CalendarDays size={16} />} label="Slot" value={`${formatDate(booking.timeSlot?.slotDate)} · ${timeRangeWithDuration(booking.timeSlot?.startTime, booking.timeSlot?.endTime)}`} />
        <InfoItem icon={<CreditCard size={16} />} label="Payment" value={paymentLabel(booking)} />
      </div>

      {destructive ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-red-100 bg-white p-3">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Record action</span>
          <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-700 ring-1 ring-red-200">Delete booking</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Status change</span>
          <StatusBadge status={booking.status} />
          <span className="text-sm font-black text-slate-500">to</span>
          <StatusBadge status={next} />
        </div>
      )}
    </div>
  );
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

function actionSummary(status: BookingStatus) {
  if (status === 'PENDING') return 'Needs review';
  if (status === 'APPROVED') return 'Approved slot';
  if (status === 'REJECTED') return 'Rejected request';
  if (status === 'CANCELLED') return 'Cancelled booking';
  return 'Review booking';
}

function actionConfig(status: BookingStatus) {
  if (status === 'APPROVED') {
    return {
      buttonLabel: 'Approve',
      confirmLabel: 'Approve booking',
      modalTitle: 'Approve this booking?',
      modalDescription: 'Confirm the customer, slot, and payment reference before approving.',
      noticeTitle: 'The slot will be confirmed for this customer.',
      noticeText: 'Approving marks this request as accepted and removes it from the pending review queue.',
      icon: <CheckCircle2 size={16} />,
      variant: 'primary' as const,
      noticeClass: 'border-green-100 bg-green-50',
      iconClass: 'bg-green-600 text-white',
      titleClass: 'text-green-900',
      bodyClass: 'text-green-700'
    };
  }
  if (status === 'REJECTED') {
    return {
      buttonLabel: 'Reject',
      confirmLabel: 'Reject booking',
      modalTitle: 'Reject this booking?',
      modalDescription: 'Reject only when the request cannot be accepted.',
      noticeTitle: 'The customer request will be rejected.',
      noticeText: 'Use this when payment, customer details, or slot availability cannot be validated.',
      icon: <XCircle size={16} />,
      variant: 'outline' as const,
      noticeClass: 'border-red-100 bg-red-50',
      iconClass: 'bg-red-600 text-white',
      titleClass: 'text-red-900',
      bodyClass: 'text-red-700'
    };
  }
  return {
    buttonLabel: 'Cancel',
    confirmLabel: 'Cancel booking',
    modalTitle: 'Cancel this booking?',
    modalDescription: 'Cancel keeps the booking record but removes it from active operations.',
    noticeTitle: 'This booking will no longer be active.',
    noticeText: 'Use cancel when the customer or venue cannot proceed after the booking was created.',
    icon: <Ban size={16} />,
    variant: 'outline' as const,
    noticeClass: 'border-amber-100 bg-amber-50',
    iconClass: 'bg-amber-500 text-white',
    titleClass: 'text-amber-900',
    bodyClass: 'text-amber-700'
  };
}

function labelFor(status: BookingStatus) {
  if (status === 'APPROVED') return 'Approve';
  if (status === 'REJECTED') return 'Reject';
  if (status === 'CANCELLED') return 'Cancel';
  return status;
}

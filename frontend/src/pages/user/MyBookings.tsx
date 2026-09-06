import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, CreditCard, MapPin, Search, Star, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingApi, reviewApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { StatusBadge } from '../../components/StatusBadge';
import { Button, Chip, Field, FilterBar, MetricCard, ModalShell, PageHero, SelectField, TextareaField } from '../../components/UI';
import { StarRatingInput } from '../../components/StarRating';
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
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [message, setMessage] = useState('');
  const [reviewedBookingIds, setReviewedBookingIds] = useState<number[]>([]);

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

  // Drives which rows offer a review prompt. A failure here is non-fatal: the worst case is that
  // the button is shown for an already-reviewed booking and the server rejects the submission.
  const loadReviewed = async () => {
    if (!user) return;
    try {
      setReviewedBookingIds(await reviewApi.reviewedBookings(user.userId));
    } catch {
      setReviewedBookingIds([]);
    }
  };

  useEffect(() => { loadReviewed(); }, [user?.userId]);

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

  const openReview = (booking: Booking) => {
    setReviewTarget(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
  };

  const submitReview = async () => {
    const futsalId = reviewTarget?.timeSlot?.futsal?.futsalId;
    if (!reviewTarget || !futsalId) return;
    setSavingReview(true);
    setReviewError('');
    try {
      await reviewApi.create(futsalId, {
        bookingId: reviewTarget.bookingId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined
      });
      setReviewTarget(null);
      setMessage('Thanks — your review is now on the venue page.');
      await loadReviewed();
    } catch (err) {
      // The server owns the eligibility rules, so show exactly what it said.
      setReviewError(err instanceof Error ? err.message : 'Review could not be saved.');
    } finally {
      setSavingReview(false);
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
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'] as const).map((item) => (
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
                <div className="flex shrink-0 flex-wrap gap-2">
                  {canReview(booking, reviewedBookingIds) && (
                    <Button type="button" variant="secondary" size="sm" onClick={() => openReview(booking)}>
                      <Star size={16} /> Leave a review
                    </Button>
                  )}
                  {canCancel(booking) && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setCancelTarget(booking)}>
                      <XCircle size={16} /> Cancel booking
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {message && (
        <p role="status" className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          {message}
        </p>
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
          {cancelTarget.paidAt && (
            <p className="mt-3 rounded-2xl bg-slate-100 p-3 text-sm font-semibold leading-6 text-slate-600">
              You paid for this booking, so a refund will be arranged and returned to your eSewa
              account. We will email you once it is complete.
            </p>
          )}
        </ModalShell>
      )}
      {reviewTarget && (
        <ModalShell
          title={`Review ${reviewTarget.timeSlot?.futsal?.name || 'this venue'}`}
          eyebrow="Share your experience"
          description={`${formatDate(reviewTarget.timeSlot?.slotDate)} · ${timeRangeWithDuration(reviewTarget.timeSlot?.startTime, reviewTarget.timeSlot?.endTime)}`}
          onClose={() => setReviewTarget(null)}
          footer={(
            <>
              <Button type="button" variant="outline" disabled={savingReview} onClick={() => setReviewTarget(null)}>Cancel</Button>
              <Button type="button" variant="primary" loading={savingReview} onClick={submitReview}>Post review</Button>
            </>
          )}
        >
          <div className="space-y-4">
            <div>
              <span className="label">Rating</span>
              <div className="mt-1">
                <StarRatingInput value={reviewRating} onChange={setReviewRating} disabled={savingReview} />
              </div>
            </div>
            <TextareaField
              label="Comment"
              helper="Optional, up to 500 characters."
              maxLength={500}
              value={reviewComment}
              disabled={savingReview}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="How were the surface, lighting and facilities?"
            />
            {reviewError && (
              <p role="alert" className="text-sm font-bold text-red-600">{reviewError}</p>
            )}
          </div>
        </ModalShell>
      )}
    </main>
  );
}

/** Hours before the slot after which a customer can no longer cancel online. Mirrors
 *  app.booking.cancellation-cutoff-hours on the server, which is the authority. */
const CANCELLATION_CUTOFF_HOURS = 24;

function canCancel(booking: Booking) {
  if (booking.status !== 'PENDING' && booking.status !== 'APPROVED') return false;
  const { slotDate, startTime } = booking.timeSlot ?? {};
  if (!slotDate || !startTime) return true;
  const startsAt = new Date(`${slotDate}T${startTime}`).getTime();
  return startsAt - Date.now() > CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
}

/**
 * Mirrors the server's eligibility rule so the prompt only appears where a review would be
 * accepted: an approved booking, at a known venue, that has already finished, and which the user
 * has not reviewed yet. The server re-checks all of this - this only avoids offering a dead end.
 */
function canReview(booking: Booking, reviewedBookingIds: number[]) {
  if (booking.status !== 'APPROVED') return false;
  if (!booking.timeSlot?.futsal?.futsalId) return false;
  if (reviewedBookingIds.includes(booking.bookingId)) return false;
  const { slotDate, endTime } = booking.timeSlot;
  if (!slotDate || !endTime) return false;
  return new Date(`${slotDate}T${endTime}`).getTime() <= Date.now();
}

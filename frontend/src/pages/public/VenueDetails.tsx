import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Phone, ShieldCheck, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { futsalApi, paymentApi, slotApi } from '../../api/modules';
import { Notice } from '../../components/UI';
import { VenueImage } from '../../components/VenueImage';
import { EmptyState, LoadingState } from '../../components/State';
import { useAuth } from '../../context/AuthContext';
import type { Futsal, PaymentMethod, TimeSlot } from '../../types/api';
import { formatTime, formatTimeCompact, imageForVenue, money, placeName, slotDuration, timeRange, todayInput } from '../../utils/format';
import { handOffToGateway } from '../../utils/gatewayCheckout';
import { usePageTitle } from '../../hooks/usePageTitle';
import { VenueReviews } from '../../components/VenueReviews';

export function VenueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const futsalId = Number(id);

  // The availability board links straight at one slot (`?date=…&slot=…`) so that booking from it
  // is two taps. Preselection happens once, and never fights a choice the user then makes.
  const requestedDate = searchParams.get('date');
  const requestedSlotId = Number(searchParams.get('slot'));
  const preselected = useRef(false);
  const [futsal, setFutsal] = useState<Futsal | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    () => (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : todayInput())
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_IN_HAND');
  const [notes, setNotes] = useState('');
  const [loadingVenue, setLoadingVenue] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Falls back to the site title while the venue is still loading.
  usePageTitle(futsal?.name);

  const images = useMemo(() => imageUrls(futsal), [futsal]);
  const dates = useMemo(() => nextDates(7), []);
  const selectedHours = selectedSlot ? slotHours(selectedSlot) : 1;
  const rated = typeof futsal?.rating === 'number' && futsal.rating > 0;
  const serviceFee = 0;
  const subtotal = Number(futsal?.hourlyPrice || 0) * selectedHours;
  const total = subtotal + serviceFee;

  // Extracted so the reviews section can re-fetch the venue after a review changes the
  // aggregate rating shown in the header.
  const loadVenue = useCallback(() => {
    if (!Number.isFinite(futsalId)) return;
    setLoadingVenue(true);
    setError('');
    futsalApi.get(futsalId)
      .then(setFutsal)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load venue'))
      .finally(() => setLoadingVenue(false));
  }, [futsalId]);

  useEffect(() => { loadVenue(); }, [loadVenue]);

  useEffect(() => {
    if (!Number.isFinite(futsalId)) return;
    setLoadingSlots(true);
    setError('');
    setSelectedSlot(null);
    slotApi.public({ futsalId, slotDate: selectedDate, page: 0, size: 80 })
      .then((data) => {
        const items = data.items || [];
        setSlots(items);
        if (!preselected.current && Number.isFinite(requestedSlotId)) {
          preselected.current = true;
          const match = items.find((slot) => slot.slotId === requestedSlotId && slot.available);
          if (match) setSelectedSlot(match);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load slots'))
      .finally(() => setLoadingSlots(false));
  }, [futsalId, selectedDate, requestedSlotId]);

  const submitBooking = async () => {
    if (!selectedSlot) return;
    if (!user?.authToken) {
      navigate('/login', { replace: false, state: { from: location } });
      return;
    }
    setBooking(true);
    setError('');
    setMessage('');
    try {
      // Cash is settled here and now. eSewa holds the slot, then hands the browser to
      // the gateway; the booking is only confirmed once /payments/verify says the money moved.
      const initiation = await paymentApi.initiate({
        userId: user.userId,
        slotId: selectedSlot.slotId,
        method: paymentMethod,
        notes
      });

      if (paymentMethod !== 'CASH_IN_HAND') {
        handOffToGateway(initiation);
        return; // the browser is navigating away
      }

      setMessage('Booking created successfully. Pay at the venue. You can track it from My Bookings.');
      setSelectedSlot(null);
      setNotes('');
      const data = await slotApi.public({ futsalId, slotDate: selectedDate, page: 0, size: 80 });
      setSlots(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loadingVenue) {
    return <main className="container-page py-10"><LoadingState /></main>;
  }

  if (!futsal) {
    return <main className="container-page py-10"><EmptyState title="Venue not found" /></main>;
  }

  return (
    <main className="container-page py-8">
      <div className="mb-5">
        <Link to="/venues" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-green-700"><ChevronLeft size={17} /> Back to venues</Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {images.length > 1 ? (
            <>
              <div className="grid gap-3 overflow-hidden rounded-3xl md:grid-cols-4 md:grid-rows-2">
                <VenueImage url={images[0]} seed={futsal.futsalId} alt={futsal.name} loading="eager" className="h-64 w-full object-cover sm:h-80 md:col-span-2 md:row-span-2 md:h-96" />
                {images.slice(1, 5).map((url, index) => (
                  <VenueImage key={`${url}-${index}`} url={url} seed={futsal.futsalId + index + 1} alt={`${futsal.name} photo ${index + 2}`} className="hidden h-full min-h-44 w-full object-cover md:block" />
                ))}
              </div>
              {/* The extra photos were desktop-only before, so phones saw the cover image alone. */}
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1 md:hidden">
                {images.slice(1).map((url, index) => (
                  <VenueImage key={`m-${url}-${index}`} url={url} seed={futsal.futsalId + index + 1} alt={`${futsal.name} photo ${index + 2}`} className="h-24 w-32 shrink-0 rounded-2xl object-cover" />
                ))}
              </div>
            </>
          ) : (
            <VenueImage url={images[0]} seed={futsal.futsalId} alt={futsal.name} loading="eager" className="h-64 w-full rounded-3xl object-cover sm:h-80 md:h-96" />
          )}

          <div className="mt-7">
            <div className="flex flex-wrap items-center gap-2">
              {futsal.verified && <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-100">Verified</span>}
              {futsal.courtType && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{futsal.courtType}</span>}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">{futsal.name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-2"><MapPin size={17} className="text-green-600" /> {futsal.address}, {placeName(futsal.city)}</span>
              <span className="flex items-center gap-2"><Phone size={17} className="text-green-600" /> {futsal.phone}</span>
              <span className="flex items-center gap-2"><Clock size={17} className="text-green-600" /> {formatTime(futsal.openingTime)} - {formatTime(futsal.closingTime)}</span>
              {rated
                ? <span className="flex items-center gap-2 tabular-nums"><Star size={17} className="text-amber-500" fill="currentColor" /> {futsal.rating!.toFixed(1)} ({futsal.reviewCount ?? 0})</span>
                : <span className="flex items-center gap-2">No reviews yet</span>}
            </div>
            {futsal.description && <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">{futsal.description}</p>}
          </div>

          <section className="panel mt-7 p-6">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold text-slate-950"><Calendar className="text-green-600" size={18} aria-hidden="true" /> Select a date</h2>
            <div className="motion-stagger mt-6 flex gap-3 overflow-x-auto pb-2">
              {dates.map((date) => (
                <button
                  key={date.value}
                  type="button"
                  aria-pressed={selectedDate === date.value}
                  className={`flex min-h-28 min-w-24 shrink-0 flex-col items-center justify-center rounded-2xl border px-5 py-4 text-center font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-100 active:translate-y-0 active:scale-[0.98] ${selectedDate === date.value ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-green-300'}`}
                  onClick={() => setSelectedDate(date.value)}
                >
                  <span className="text-xs uppercase tracking-wide">{date.weekday}</span>
                  <span className={`mt-1.5 text-2xl tabular-nums ${selectedDate === date.value ? 'text-white' : 'text-slate-950'}`}>{date.day}</span>
                  <span className="text-xs">{date.month}</span>
                  {date.isToday && <span className={`mt-1 text-xs ${selectedDate === date.value ? 'text-green-300' : 'text-green-700'}`}>Today</span>}
                </button>
              ))}
            </div>
          </section>

          <section id="slots" className="panel mt-5 scroll-mt-24 p-6">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold text-slate-950"><Clock className="text-green-600" size={18} aria-hidden="true" /> Time slots</h2>
            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-muted">
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-green-50 ring-1 ring-green-200" aria-hidden="true" /> Available</span>
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-slate-200" aria-hidden="true" /> <span className="line-through">Booked</span></span>
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-slate-950" aria-hidden="true" /> Selected</span>
            </div>
            <div className="mt-6">
              {loadingSlots ? <LoadingState /> : slots.length === 0 ? <EmptyState title="No slots for this date" description="Nothing has been published for this day yet. Try another date above." /> : (
                <div className="motion-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {slots.map((slot) => {
                    const active = selectedSlot?.slotId === slot.slotId;
                    return (
                      <button
                        key={slot.slotId}
                        disabled={!slot.available}
                        aria-pressed={active}
                        className={`min-h-14 rounded-2xl px-4 py-3 text-center text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-100 active:translate-y-0 active:scale-[0.98] disabled:hover:translate-y-0 disabled:active:scale-100 ${active ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15' : slot.available ? 'bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100' : 'cursor-not-allowed bg-slate-200 text-slate-600'}`}
                        onClick={() => setSelectedSlot(active ? null : slot)}
                      >
                        <span className={`block tabular-nums ${slot.available ? '' : 'line-through'}`}>{formatTimeCompact(slot.startTime)}</span>
                        {!slot.available && <span className="mt-0.5 block text-xs font-normal">Booked</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside id="booking-panel" className="panel h-max scroll-mt-24 overflow-hidden lg:sticky lg:top-24">
          <div className="bg-slate-950 p-6 text-white">
            <div className="text-3xl font-semibold tabular-nums">{money(futsal.hourlyPrice)}<span className="text-base font-normal text-slate-400">/hour</span></div>
            {rated
              ? <p className="mt-3 flex items-center gap-2 text-sm tabular-nums"><Star size={16} className="text-amber-500" fill="currentColor" aria-hidden="true" /> {futsal.rating!.toFixed(1)} <span className="text-slate-400">({futsal.reviewCount ?? 0} reviews)</span></p>
              : <p className="mt-3 text-sm text-slate-400">No reviews yet</p>}
          </div>
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected slot</p>
            <div className="mt-3 flex items-center gap-3 rounded-card border border-slate-200 bg-slate-100 px-4 py-4 text-base font-semibold tabular-nums text-slate-700">
              <Clock size={18} />
              <span>{selectedSlot ? timeRange(selectedSlot.startTime, selectedSlot.endTime) : 'Select a time slot'}</span>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-semibold text-slate-950">{selectedSlot ? slotDuration(selectedSlot.startTime, selectedSlot.endTime) || '1 hr' : 'Select a slot'}</span>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-100 p-5 text-slate-600">
              <div className="flex justify-between text-base font-normal">
                <span>Futsal fee</span>
                <span className="tabular-nums text-slate-800">{money(subtotal)}</span>
              </div>
              {/* A line that always reads "NPR 0" is noise; it returns if a fee is ever charged. */}
              {serviceFee > 0 && (
                <div className="mt-3 flex justify-between text-base font-normal">
                  <span>Service fee</span>
                  <span className="tabular-nums text-slate-800">{money(serviceFee)}</span>
                </div>
              )}
              <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-950">
                <span>Total</span>
                <span className="tabular-nums">{money(total)}</span>
              </div>
            </div>

            <div className="mt-5">
              <label className="label" htmlFor="payment-method">Payment method</label>
              <select id="payment-method" className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <option value="CASH_IN_HAND">Cash in hand</option>
                <option value="ESEWA">Esewa</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="booking-notes">Notes</label>
              <textarea id="booking-notes" className="input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional booking notes" />
            </div>
            {message && <Notice tone="green" className="mt-4">{message}</Notice>}
            {error && <Notice tone="red" className="mt-4">{error}</Notice>}
            <button className="btn-primary mt-5 w-full py-4" disabled={!selectedSlot || booking} onClick={submitBooking}>
              {booking
                ? 'Processing...'
                : !user?.authToken
                  ? <>Sign in to Book <ChevronRight size={18} /></>
                  : paymentMethod === 'CASH_IN_HAND'
                    ? 'Confirm booking'
                    : 'Pay with eSewa'}
            </button>
            <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted"><ShieldCheck size={16} className="text-green-600" aria-hidden="true" /> Free cancellation up to 2 hours before</p>
          </div>
        </aside>
      </section>

      {/* Reloads the venue after a review is removed so the header rating stays in step. */}
      <section className="container-page pb-12">
        <VenueReviews futsalId={futsal.futsalId} onChanged={loadVenue} />
      </section>

      <div className="sticky bottom-0 z-30 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tabular-nums text-slate-950">
              {money(futsal.hourlyPrice)}<span className="font-normal text-muted">/hour</span>
            </p>
            <p className="truncate text-xs tabular-nums text-muted">
              {selectedSlot ? timeRange(selectedSlot.startTime, selectedSlot.endTime) : 'No slot selected'}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary ml-auto shrink-0"
            onClick={() => document.getElementById(selectedSlot ? 'booking-panel' : 'slots')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            {selectedSlot ? 'Review and book' : 'Choose a slot'}
          </button>
        </div>
      </div>
    </main>
  );
}

function imageUrls(futsal: Futsal | null) {
  if (!futsal) return [];
  const fromImages = (futsal.images || []).map((image) => image.imageUrl || image.url || '').filter(Boolean);
  if (futsal.imageUrls?.length) return futsal.imageUrls;
  if (fromImages.length) return fromImages;
  return futsal.imageUrl ? [futsal.imageUrl] : [];
}

function nextDates(count: number) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    const value = date.toISOString().slice(0, 10);
    return {
      value,
      weekday: date.toLocaleDateString('en-NP', { weekday: 'short' }),
      day: String(date.getDate()),
      month: date.toLocaleDateString('en-NP', { month: 'short' }),
      isToday: index === 0
    };
  });
}

function slotHours(slot: TimeSlot) {
  const [startHourRaw, startMinuteRaw = '0'] = slot.startTime.split(':');
  const [endHourRaw, endMinuteRaw = '0'] = slot.endTime.split(':');
  const start = Number(startHourRaw) + Number(startMinuteRaw) / 60;
  const end = Number(endHourRaw) + Number(endMinuteRaw) / 60;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return end - start;
}

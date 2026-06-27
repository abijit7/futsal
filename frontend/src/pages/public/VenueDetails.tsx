import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Minus, Phone, Plus, ShieldCheck, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { futsalApi, paymentApi, slotApi } from '../../api/modules';
import { EmptyState, LoadingState } from '../../components/State';
import { useAuth } from '../../context/AuthContext';
import type { Futsal, PaymentMethod, TimeSlot } from '../../types/api';
import { formatTime, formatTimeCompact, imageForVenue, money, slotDuration, timeRange, todayInput } from '../../utils/format';

export function VenueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const futsalId = Number(id);
  const [futsal, setFutsal] = useState<Futsal | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayInput());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_IN_HAND');
  const [notes, setNotes] = useState('');
  const [loadingVenue, setLoadingVenue] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const images = useMemo(() => imageUrls(futsal), [futsal]);
  const dates = useMemo(() => nextDates(7), []);
  const selectedHours = selectedSlot ? slotHours(selectedSlot) : 1;
  const serviceFee = 0;
  const subtotal = Number(futsal?.hourlyPrice || 0) * selectedHours;
  const total = subtotal + serviceFee;

  useEffect(() => {
    if (!Number.isFinite(futsalId)) return;
    setLoadingVenue(true);
    setError('');
    futsalApi.get(futsalId)
      .then(setFutsal)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load venue'))
      .finally(() => setLoadingVenue(false));
  }, [futsalId]);

  useEffect(() => {
    if (!Number.isFinite(futsalId)) return;
    setLoadingSlots(true);
    setError('');
    setSelectedSlot(null);
    slotApi.public({ futsalId, slotDate: selectedDate, page: 0, size: 80 })
      .then((data) => setSlots(data.items || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load slots'))
      .finally(() => setLoadingSlots(false));
  }, [futsalId, selectedDate]);

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
      await paymentApi.confirm({
        userId: user.userId,
        slotId: selectedSlot.slotId,
        method: paymentMethod,
        notes
      });
      setMessage('Booking created successfully. You can track it from My Bookings.');
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
        <Link to="/venues" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-green-700"><ChevronLeft size={17} /> Back to venues</Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <div className="grid gap-3 overflow-hidden rounded-[2rem] md:grid-cols-4 md:grid-rows-2">
            <img src={imageForVenue(images[0])} alt={futsal.name} className="h-72 w-full object-cover md:col-span-2 md:row-span-2 md:h-96" />
            {(images.length > 1 ? images.slice(1, 4) : [images[0], images[0], images[0]]).map((url, index) => (
              <img key={`${url}-${index}`} src={imageForVenue(url)} alt="" className="hidden h-full min-h-44 w-full object-cover md:block" />
            ))}
          </div>

          <div className="mt-7">
            <div className="flex flex-wrap items-center gap-2">
              {futsal.verified && <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">Verified</span>}
              {futsal.courtType && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{futsal.courtType}</span>}
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">{futsal.name}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-slate-500">
              <span className="flex items-center gap-2"><MapPin size={17} className="text-green-600" /> {futsal.address}, {futsal.city}</span>
              <span className="flex items-center gap-2"><Phone size={17} className="text-green-600" /> {futsal.phone}</span>
              <span className="flex items-center gap-2"><Clock size={17} className="text-green-600" /> {formatTime(futsal.openingTime)} - {formatTime(futsal.closingTime)}</span>
              <span className="flex items-center gap-2"><Star size={17} className="text-amber-500" fill="currentColor" /> {(futsal.rating ?? 0).toFixed(1)} ({futsal.reviewCount ?? 0})</span>
            </div>
            {futsal.description && <p className="mt-5 max-w-3xl text-slate-600">{futsal.description}</p>}
          </div>

          <section className="panel mt-7 p-6">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-950"><Calendar className="text-green-600" size={24} /> Select Date</h2>
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
              {dates.map((date) => (
                <button
                  key={date.value}
                  className={`flex min-h-28 min-w-24 shrink-0 flex-col items-center justify-center rounded-2xl border px-5 py-4 text-center font-black transition ${selectedDate === date.value ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-green-300'}`}
                  onClick={() => setSelectedDate(date.value)}
                >
                  <span className="text-sm uppercase">{date.weekday}</span>
                  <span className={`mt-2 text-2xl ${selectedDate === date.value ? 'text-white' : 'text-slate-950'}`}>{date.day}</span>
                  <span className="text-sm">{date.month}</span>
                  {date.isToday && <span className={`mt-1 text-sm ${selectedDate === date.value ? 'text-green-300' : 'text-green-600'}`}>Today</span>}
                </button>
              ))}
            </div>
          </section>

          <section className="panel mt-5 p-6">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-950"><Clock className="text-green-600" size={24} /> Available Time Slots</h2>
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-bold text-slate-500">
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-green-600" /> Available</span>
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-slate-200" /> Booked</span>
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-slate-950" /> Selected</span>
            </div>
            <div className="mt-6">
              {loadingSlots ? <LoadingState /> : slots.length === 0 ? <EmptyState title="No slots for this date" /> : (
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {slots.map((slot) => {
                    const active = selectedSlot?.slotId === slot.slotId;
                    return (
                      <button
                        key={slot.slotId}
                        disabled={!slot.available}
                        className={`rounded-2xl px-4 py-4 text-center text-base font-black transition ${active ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15' : slot.available ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`}
                        onClick={() => setSelectedSlot(active ? null : slot)}
                      >
                        {formatTimeCompact(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="panel h-max overflow-hidden lg:sticky lg:top-24">
          <div className="bg-slate-950 p-6 text-white">
            <div className="text-4xl font-black">{money(futsal.hourlyPrice)}<span className="text-lg font-bold text-slate-400">/hour</span></div>
            <p className="mt-3 flex items-center gap-2 text-sm font-black"><Star size={16} className="text-amber-500" fill="currentColor" /> {(futsal.rating ?? 0).toFixed(1)} <span className="font-bold text-slate-400">({futsal.reviewCount ?? 0} reviews)</span></p>
          </div>
          <div className="p-6">
            <p className="text-xs font-black uppercase text-slate-500">Selected slot</p>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-4 text-base font-black text-slate-500">
              <Clock size={18} />
              <span>{selectedSlot ? timeRange(selectedSlot.startTime, selectedSlot.endTime) : 'Select a time slot ->'}</span>
            </div>

            <p className="mt-6 text-xs font-black uppercase text-slate-500">Duration</p>
            <div className="mt-3 flex items-center justify-between">
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 disabled:opacity-40" disabled><Minus size={18} /></button>
              <span className="font-black text-slate-950">{selectedSlot ? slotDuration(selectedSlot.startTime, selectedSlot.endTime) || '1 hr' : '1 hour'}</span>
              <button className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 disabled:opacity-40" disabled><Plus size={18} /></button>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-100 p-5 text-slate-600">
              <div className="flex justify-between text-base font-normal">
                <span>Futsal fee</span>
                <span className="text-slate-800">{money(subtotal)}</span>
              </div>
              <div className="mt-3 flex justify-between text-base font-normal">
                <span>Service fee</span>
                <span className="text-slate-800">{money(serviceFee)}</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-black text-slate-950">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>

            <div className="mt-5">
              <label className="label">Payment method</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <option value="CASH_IN_HAND">Cash in hand</option>
                <option value="ESEWA">Esewa</option>
                <option value="KHALTI">Khalti</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="label">Notes</label>
              <textarea className="input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional booking notes" />
            </div>
            {message && <p className="mt-4 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{message}</p>}
            {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            <button className="btn-primary mt-5 w-full py-4" disabled={!selectedSlot || booking} onClick={submitBooking}>{booking ? 'Booking...' : user?.authToken ? 'Confirm booking' : <>Sign in to Book <ChevronRight size={18} /></>}</button>
            <p className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-slate-500"><ShieldCheck size={16} className="text-green-600" /> Free cancellation up to 2 hours before</p>
          </div>
        </aside>
      </section>
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

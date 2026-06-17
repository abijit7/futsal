import { CheckCircle2, CreditCard, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { futsalApi, paymentApi, slotApi } from '../../api/modules';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { useAuth } from '../../context/AuthContext';
import type { Futsal, PaymentMethod, TimeSlot } from '../../types/api';
import { formatDate, imageForVenue, money, timeRange, todayInput } from '../../utils/format';

export function BookingPage() {
  const { futsalId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Futsal[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState(futsalId ? Number(futsalId) : 0);
  const [date, setDate] = useState(todayInput());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_IN_HAND');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadVenues = async () => {
      setLoading(true);
      try {
        const data = await futsalApi.list({ page: 0, size: 200 });
        const items = data.items || [];
        setVenues(items);
        if (!selectedVenueId && items[0]) setSelectedVenueId(items[0].futsalId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load futsals');
      } finally {
        setLoading(false);
      }
    };
    loadVenues();
  }, []);

  useEffect(() => {
    if (!selectedVenueId) return;
    const loadSlots = async () => {
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const data = await slotApi.available({ futsalId: selectedVenueId, slotDate: date, page: 0, size: 80 });
        setSlots(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load slots');
      } finally {
        setSlotsLoading(false);
      }
    };
    loadSlots();
  }, [selectedVenueId, date]);

  const venue = useMemo(() => venues.find((item) => item.futsalId === selectedVenueId), [venues, selectedVenueId]);

  const confirm = async () => {
    if (!user || !selectedSlot) return;
    setSubmitting(true);
    setError('');
    try {
      await paymentApi.confirm({ userId: user.userId, slotId: selectedSlot.slotId, method: paymentMethod, notes });
      navigate('/my-bookings', { replace: true, state: { success: 'Your futsal slot has been successfully booked.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="container-page py-10"><LoadingState label="Preparing booking flow" /></main>;
  if (error && venues.length === 0) return <main className="container-page py-10"><ErrorState message={error} /></main>;

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="eyebrow">Book a slot</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Choose your futsal, date, and time</h1>
      </div>
      {error && <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
        <section className="space-y-6">
          <div className="panel p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="label">Select futsal</label><select className="input" value={selectedVenueId} onChange={(e) => setSelectedVenueId(Number(e.target.value))}>{venues.map((item) => <option key={item.futsalId} value={item.futsalId}>{item.name} - {item.city}</option>)}</select></div>
              <div><label className="label">Select date</label><input className="input" type="date" min={todayInput()} value={date} onChange={(e) => setDate(e.target.value)} /></div>
            </div>
          </div>

          <div className="panel p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div><h2 className="text-2xl font-black text-slate-950">Available time slots</h2><p className="text-sm text-slate-500">{formatDate(date)}</p></div>
              <div className="flex gap-3 text-xs font-black text-slate-500"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-green-500" /> Available</span><span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-slate-950" /> Selected</span></div>
            </div>
            {slotsLoading ? <LoadingState label="Loading slots" /> : slots.length === 0 ? <EmptyState title="No slots available for this date" description="Pick another date above. The venue selector remains available so users can keep browsing." /> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {slots.map((slot) => {
                  const active = selectedSlot?.slotId === slot.slotId;
                  return (
                    <button key={slot.slotId} disabled={slot.available === false} onClick={() => setSelectedSlot(slot)} className={`rounded-2xl px-4 py-4 text-center font-black transition ${active ? 'bg-slate-950 text-white ring-4 ring-green-500' : slot.available === false ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                      {timeRange(slot.startTime, slot.endTime)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="panel h-max overflow-hidden">
          {venue && <img src={imageForVenue(venue.imageUrl || venue.imageUrls?.[0])} alt={venue.name} className="h-52 w-full object-cover" />}
          <div className="p-6">
            <h2 className="text-2xl font-black text-slate-950">Booking summary</h2>
            <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
              <p>{venue?.name || 'No venue selected'}</p>
              <p>{formatDate(date)}</p>
              <p>{selectedSlot ? timeRange(selectedSlot.startTime, selectedSlot.endTime) : 'Select a time slot'}</p>
              <p className="text-2xl font-black text-slate-950">{money(venue?.hourlyPrice)}<span className="text-sm text-slate-400"> / hour</span></p>
            </div>
            <div className="mt-6">
              <label className="label">Payment method</label>
              <div className="grid gap-2">
                {(['CASH_IN_HAND', 'ESEWA', 'KHALTI'] as PaymentMethod[]).map((method) => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`flex items-center justify-between rounded-2xl border px-4 py-3 font-black ${paymentMethod === method ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}>
                    <span className="flex items-center gap-2">{method === 'CASH_IN_HAND' ? <WalletCards size={18} /> : <CreditCard size={18} />} {method.replace(/_/g, ' ')}</span>
                    {paymentMethod === method && <CheckCircle2 size={18} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5"><label className="label">Notes</label><textarea className="input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note for venue owner" /></div>
            <button className="btn-primary mt-6 w-full" disabled={!selectedSlot || submitting} onClick={confirm}>{submitting ? 'Confirming...' : 'Confirm booking'}</button>
          </div>
        </aside>
      </div>
    </main>
  );
}

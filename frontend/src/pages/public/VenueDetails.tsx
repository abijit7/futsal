import { CalendarDays, Clock, MapPin, Phone, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { futsalApi } from '../../api/modules';
import { ErrorState, LoadingState } from '../../components/State';
import type { Futsal } from '../../types/api';
import { formatTime, imageForVenue, money } from '../../utils/format';

export function VenueDetails() {
  const { id } = useParams();
  const [venue, setVenue] = useState<Futsal | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      setVenue(await futsalApi.get(Number(id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venue');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <main className="container-page py-10"><LoadingState /></main>;
  if (error || !venue) return <main className="container-page py-10"><ErrorState message={error || 'Venue not found'} retry={load} /></main>;

  const images = [venue.imageUrl, ...(venue.imageUrls || [])].filter(Boolean) as string[];

  return (
    <main className="container-page py-10">
      <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <img src={imageForVenue(images[0])} alt={venue.name} className="h-[460px] w-full rounded-[2rem] object-cover shadow-sm" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {(images.slice(1, 3).length ? images.slice(1, 3) : [undefined, undefined]).map((img, index) => (
            <img key={`${img}-${index}`} src={imageForVenue(img)} alt="" className="h-[222px] w-full rounded-[2rem] object-cover shadow-sm" />
          ))}
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <span className="rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white">Most Popular</span>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-tight text-slate-950">{venue.name}</h1>
          <div className="mt-4 flex flex-wrap gap-5 text-sm font-bold text-slate-500">
            <span className="flex items-center gap-2"><MapPin className="text-green-600" size={18} /> {venue.address}, {venue.city}</span>
            <span className="flex items-center gap-2"><Phone className="text-green-600" size={18} /> {venue.phone}</span>
            <span className="flex items-center gap-2"><Star className="text-amber-400" fill="currentColor" size={18} /> 4.9 reviews</span>
          </div>
          <div className="mt-8 panel p-7">
            <h2 className="text-2xl font-black text-slate-950">Overview</h2>
            <p className="mt-3 leading-8 text-slate-600">{venue.description || 'A premium futsal venue with hourly booking, real-time slots, and simple payment confirmation.'}</p>
          </div>
        </section>
        <aside className="panel h-max overflow-hidden">
          <div className="bg-slate-950 p-7 text-white">
            <div className="text-4xl font-black">{money(venue.hourlyPrice)}<span className="text-base text-slate-400"> /hour</span></div>
            <div className="mt-3 flex items-center gap-2 text-slate-300"><Clock size={18} className="text-green-400" /> Opens {formatTime(venue.openingTime)}</div>
          </div>
          <div className="p-7">
            <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
              <CalendarDays className="mb-2 text-green-600" /> Select a time slot from the booking page.
            </div>
            <Link className="btn-primary w-full" to={`/booking/${venue.futsalId}`}>Book a Slot</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

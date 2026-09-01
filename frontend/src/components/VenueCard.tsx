import { ArrowRight, Clock, MapPin, Phone, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Futsal } from '../types/api';
import { formatTime, imageForVenue, money } from '../utils/format';

export function VenueCard({ futsal }: { futsal: Futsal }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={imageForVenue(futsal.imageUrl || futsal.imageUrls?.[0])} alt={futsal.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute left-4 top-4 rounded-full bg-green-600 px-3 py-1 text-xs font-black text-white">Available</div>
      </div>
      <div className="p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-xl font-black uppercase tracking-tight text-slate-950">{futsal.name}</h3>
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-sm font-black text-amber-600">
            <Star size={15} fill="currentColor" /> {(futsal.rating ?? 0).toFixed(1)}
          </div>
        </div>
        <div className="space-y-2 text-sm font-semibold text-slate-500">
          <p className="flex items-center gap-2"><MapPin size={16} className="text-green-600" /> {futsal.address}, {futsal.city}</p>
          <p className="flex items-center gap-2"><Phone size={16} className="text-green-600" /> {futsal.phone}</p>
          <p className="flex items-center gap-2"><Clock size={16} className="text-green-600" /> Opens {formatTime(futsal.openingTime)}</p>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase text-slate-500">From</div>
            <div className="text-xl font-black text-slate-950">{money(futsal.hourlyPrice)}<span className="text-sm text-slate-500">/hr</span></div>
          </div>
          <Link to={`/venues/${futsal.futsalId}`} className="btn-navy h-14 w-14 rounded-2xl p-0 flex items-center justify-center" aria-label={`View ${futsal.name}`}>
            <ArrowRight />
          </Link>
        </div>
      </div>
    </article>
  );
}

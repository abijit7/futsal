import { ArrowRight, Clock, MapPin, Phone, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Futsal } from '../types/api';
import { formatTime, imageForVenue, money, placeName } from '../utils/format';

/**
 * `available` is opt-in and means the caller has actually established availability — the Venues
 * page sets it only when its results were filtered against a date. It used to be an unconditional
 * badge on every card, which made a claim the card could not back.
 */
export function VenueCard({ futsal, available = false, nextFree }: { futsal: Futsal; available?: boolean; nextFree?: string }) {
  // A venue with no reviews has no rating. Rendering `0.0` beside a filled star read as a bad
  // score rather than an absent one, which on a fresh catalogue is most of the grid.
  const rated = typeof futsal.rating === 'number' && futsal.rating > 0;

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={imageForVenue(futsal.imageUrl || futsal.imageUrls?.[0], futsal.futsalId)} alt={futsal.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        {available && (
          <div className="absolute left-4 top-4 rounded-full bg-green-600 px-3 py-1 text-xs font-black text-white">Available</div>
        )}
      </div>
      <div className="p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-lg font-semibold text-slate-950">{futsal.name}</h3>
          {rated ? (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-sm font-bold text-amber-600">
              <Star size={15} fill="currentColor" /> {futsal.rating!.toFixed(1)}
              {/* A score means little without knowing how many people gave it. */}
              {(futsal.reviewCount ?? 0) > 0 && (
                <span className="font-bold text-amber-700/70">({futsal.reviewCount})</span>
              )}
            </div>
          ) : (
            <div className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">New</div>
          )}
        </div>
        <div className="space-y-2 text-sm font-semibold text-slate-500">
          <p className="flex items-center gap-2"><MapPin size={16} className="text-green-600" /> {futsal.address}, {placeName(futsal.city)}</p>
          <p className="flex items-center gap-2"><Phone size={16} className="text-green-600" /> {futsal.phone}</p>
          {/* Only set when the caller actually checked availability for a date, so it is never a guess. */}
          {nextFree
            ? <p className="flex items-center gap-2 text-green-700"><Clock size={16} className="text-green-600" /> Next free {formatTime(nextFree)}</p>
            : <p className="flex items-center gap-2"><Clock size={16} className="text-green-600" /> Opens {formatTime(futsal.openingTime)}</p>}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">From</div>
            <div className="text-xl font-bold text-slate-950">{money(futsal.hourlyPrice)}<span className="text-sm text-slate-500">/hr</span></div>
          </div>
          <Link to={`/venues/${futsal.futsalId}`} className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200" aria-label={`View ${futsal.name}`}>
            <ArrowRight />
          </Link>
        </div>
      </div>
    </article>
  );
}

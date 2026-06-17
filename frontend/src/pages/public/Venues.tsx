import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { futsalApi } from '../../api/modules';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { Pagination } from '../../components/Pagination';
import { VenueCard } from '../../components/VenueCard';
import type { Futsal } from '../../types/api';

export function Venues() {
  const [venues, setVenues] = useState<Futsal[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await futsalApi.list({ page, size: 12 });
      setVenues(data.items || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter((venue) => [venue.name, venue.city, venue.address].join(' ').toLowerCase().includes(q));
  }, [venues, search]);

  return (
    <main className="container-page py-10">
      <section className="mb-8 grid gap-6 rounded-[2rem] bg-slate-950 p-8 text-white md:grid-cols-[1fr_420px] md:p-12">
        <div>
          <p className="eyebrow text-green-300">Explore grounds</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight">Find futsals near you</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Compare venues, pricing, opening hours, and availability in one place.</p>
        </div>
        <div className="self-end">
          <label className="label text-slate-200">Search venue or city</label>
          <div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={18} /><input className="input pl-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kathmandu, Patan, venue name..." /></div>
        </div>
      </section>
      {loading ? <LoadingState label="Loading futsal venues" /> : error ? <ErrorState message={error} retry={load} /> : filtered.length === 0 ? <EmptyState title="No futsals found" description="Try another search or check back after an admin adds venues." /> : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{filtered.map((venue) => <VenueCard key={venue.futsalId} futsal={venue} />)}</div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </main>
  );
}

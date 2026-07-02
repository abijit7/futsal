import { Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { futsalApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, LoadingState } from '../../components/State';
import { VenueCard } from '../../components/VenueCard';
import type { Futsal } from '../../types/api';

type Sort = 'recommended' | 'price-low' | 'price-high';

export function Venues() {
  const [items, setItems] = useState<Futsal[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('recommended');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await futsalApi.list({ page, size: 12, q, sort });
      setItems(data.items || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, q, sort]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setPage(0);
    setQ(search.trim());
  };

  return (
    <main className="container-page py-10">
      <section className="mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">Book a court</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Venues</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Browse live venues from the backend catalog and book an available slot.</p>
      </section>

      <form className="panel mb-6 grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]" onSubmit={submit}>
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input className="input pl-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by venue, city, address, or court type" />
        </div>
        <select className="input" value={sort} onChange={(e) => { setSort(e.target.value as Sort); setPage(0); }}>
          <option value="recommended">Recommended</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
        <button className="btn-primary px-6">Search</button>
      </form>

      {error && <p className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="No venues found" /> : (
        <div className="motion-stagger grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <VenueCard key={item.futsalId} futsal={item} />)}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </main>
  );
}

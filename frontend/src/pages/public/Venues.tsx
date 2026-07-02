import { Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { futsalApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { Button, Chip, Field, PageHero, SelectField } from '../../components/UI';
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
      <PageHero eyebrow="Book a court" title="Venues" description="Browse live venues from the backend catalog and book an available slot." />

      <form className="panel mb-4 grid gap-3 p-4 md:grid-cols-[1fr_220px_auto] md:items-end" onSubmit={submit}>
        <Field label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by venue, city, address, or court type" prefix={<Search size={18} />} />
        <SelectField label="Sort by" value={sort} onChange={(event) => { setSort(event.target.value as Sort); setPage(0); }}>
          <option value="recommended">Recommended</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </SelectField>
        <Button className="w-full px-6">Search</Button>
      </form>

      {(q || sort !== 'recommended') && (
        <div className="mb-5 flex flex-wrap gap-2">
          {q && <Chip onRemove={() => { setQ(''); setSearch(''); }}>Search: {q}</Chip>}
          {sort !== 'recommended' && <Chip tone="green" onRemove={() => setSort('recommended')}>Sort: {sort === 'price-low' ? 'Price low to high' : 'Price high to low'}</Chip>}
        </div>
      )}

      {error && <div className="mb-5"><ErrorState message={error} retry={load} /></div>}
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="No venues found" /> : (
        <div className="motion-stagger grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <VenueCard key={item.futsalId} futsal={item} />)}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </main>
  );
}

import { Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { futsalApi, slotApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { Button, Chip, Field, PageHero, SelectField } from '../../components/UI';
import { VenueCard } from '../../components/VenueCard';
import type { Futsal } from '../../types/api';
import { formatDate, todayInput } from '../../utils/format';

type Sort = 'recommended' | 'price-low' | 'price-high';

export function Venues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Futsal[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [sort, setSort] = useState<Sort>((searchParams.get('sort') as Sort) || 'recommended');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (date) {
        const data = await futsalApi.list({ page: 0, size: 200, q, sort });
        const allItems = data.items || [];
        const availability = await Promise.all(
          allItems.map(async (venue) => {
            try {
              const slots = await slotApi.available({ futsalId: venue.futsalId, slotDate: date, page: 0, size: 1 });
              return slots.totalItems > 0;
            } catch {
              return false;
            }
          })
        );
        const availableVenues = allItems.filter((_, index) => availability[index]);
        const size = 12;
        setItems(availableVenues.slice(page * size, page * size + size));
        setTotalPages(Math.ceil(availableVenues.length / size));
      } else {
        const data = await futsalApi.list({ page, size: 12, q, sort });
        setItems(data.items || []);
        setTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const nextQ = searchParams.get('q') || '';
    const nextDate = searchParams.get('date') || '';
    const nextSort = (searchParams.get('sort') as Sort) || 'recommended';
    setQ(nextQ);
    setSearch(nextQ);
    setDate(nextDate);
    setSort(nextSort);
    setPage(0);
  }, [searchParams]);

  useEffect(() => { load(); }, [page, q, sort, date]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setPage(0);
    const nextQ = search.trim();
    setQ(nextQ);
    setSearchParams(queryParams(nextQ, date, sort));
  };

  return (
    <main className="container-page py-10">
      <PageHero eyebrow="Book a court" title="Venues" description="Browse live venues from the backend catalog and book an available slot." />

      <form className="panel mb-4 grid gap-3 p-4 md:grid-cols-[1fr_180px_220px_auto] md:items-end" onSubmit={submit}>
        <Field label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by venue, city, address, or court type" prefix={<Search size={18} />} />
        <Field label="Date" type="date" min={todayInput()} value={date} onChange={(event) => { const nextDate = event.target.value; setDate(nextDate); setPage(0); setSearchParams(queryParams(q, nextDate, sort)); }} />
        <SelectField label="Sort by" value={sort} onChange={(event) => { const nextSort = event.target.value as Sort; setSort(nextSort); setPage(0); setSearchParams(queryParams(q, date, nextSort)); }}>
          <option value="recommended">Recommended</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </SelectField>
        <Button className="w-full px-6" type="submit">Search</Button>
      </form>

      {(q || date || sort !== 'recommended') && (
        <div className="mb-5 flex flex-wrap gap-2">
          {q && <Chip onRemove={() => { setQ(''); setSearch(''); setSearchParams(queryParams('', date, sort)); }}>Search: {q}</Chip>}
          {date && <Chip tone="green" onRemove={() => { setDate(''); setSearchParams(queryParams(q, '', sort)); }}>Date: {formatDate(date)}</Chip>}
          {sort !== 'recommended' && <Chip tone="green" onRemove={() => { setSort('recommended'); setSearchParams(queryParams(q, date, 'recommended')); }}>Sort: {sort === 'price-low' ? 'Price low to high' : 'Price high to low'}</Chip>}
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

function queryParams(q: string, date: string, sort: Sort) {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  if (date) params.set('date', date);
  if (sort !== 'recommended') params.set('sort', sort);
  return params;
}

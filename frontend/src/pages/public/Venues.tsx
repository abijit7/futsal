import { Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { futsalApi, slotApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { Button, Chip, Field, PageHero, SelectField } from '../../components/UI';
import { VenueCard } from '../../components/VenueCard';
import type { Futsal } from '../../types/api';
import { formatDate, todayInput } from '../../utils/format';

type Sort = 'recommended' | 'price-low' | 'price-high';

const PAGE_SIZE = 12;

export function Venues() {
  const [searchParams, setSearchParams] = useSearchParams();
  // The URL is the single source of truth for the filters; only the search box keeps local
  // state, so that typing does not re-run the query on every keystroke.
  const q = searchParams.get('q') || '';
  const date = searchParams.get('date') || '';
  const sort = (searchParams.get('sort') as Sort) || 'recommended';

  const [search, setSearch] = useState(q);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Futsal[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => { setSearch(q); }, [q]);
  useEffect(() => { setPage(0); }, [q, date, sort]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        if (!date) {
          const data = await futsalApi.list({ page, size: PAGE_SIZE, q, sort });
          if (cancelled) return;
          setItems(data.items || []);
          setTotalPages(data.totalPages || 0);
          return;
        }

        const data = await futsalApi.list({ page: 0, size: 200, q, sort });
        if (cancelled) return;
        const available = await filterByAvailability(data.items || [], date, () => cancelled);
        if (cancelled) return;
        setItems(available.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE));
        setTotalPages(Math.ceil(available.length / PAGE_SIZE));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load venues');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Date filtering is expensive (one availability probe per venue), so it is debounced.
    // `cancelled` also stops a superseded run from overwriting fresher results.
    const timer = window.setTimeout(run, date ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [page, q, date, sort, retryKey]);

  const applyFilters = (next: { q?: string; date?: string; sort?: Sort }) => {
    setSearchParams(queryParams(next.q ?? q, next.date ?? date, next.sort ?? sort));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    applyFilters({ q: search.trim() });
  };

  const hasFilters = Boolean(q || date || sort !== 'recommended');
  const clearFilters = () => {
    setSearch('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <main className="container-page py-10">
      <PageHero eyebrow="Book a court" title="Venues" description="Browse live venues and book an available slot." />

      <form className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_200px_auto] lg:items-end" onSubmit={submit}>
        <Field
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Venue, city, address, or court type"
          prefix={<Search size={18} />}
        />
        <Field label="Date" type="date" min={todayInput()} value={date} onChange={(event) => applyFilters({ date: event.target.value })} />
        <SelectField label="Sort by" value={sort} onChange={(event) => applyFilters({ sort: event.target.value as Sort })}>
          <option value="recommended">Recommended</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </SelectField>
        <Button className="w-full px-6" type="submit">Search</Button>
      </form>

      {hasFilters && (
        <div className="mb-5 flex flex-wrap gap-2">
          {q && <Chip onRemove={() => applyFilters({ q: '' })}>Search: {q}</Chip>}
          {date && <Chip tone="green" onRemove={() => applyFilters({ date: '' })}>Date: {formatDate(date)}</Chip>}
          {sort !== 'recommended' && (
            <Chip tone="green" onRemove={() => applyFilters({ sort: 'recommended' })}>
              Sort: {sort === 'price-low' ? 'Price low to high' : 'Price high to low'}
            </Chip>
          )}
        </div>
      )}

      {error && <div className="mb-5"><ErrorState message={error} retry={() => setRetryKey((key) => key + 1)} /></div>}

      {loading ? (
        <LoadingState label={date ? 'Checking availability for this date' : 'Loading venues'} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No venues found"
          description={hasFilters ? 'No venue matches the current filters. Try a different date or search term.' : 'No venues have been published yet.'}
          action={hasFilters
            ? <Button type="button" variant="outline" onClick={clearFilters}>Clear filters</Button>
            : <Link to="/" className="btn-soft">Back to home</Link>}
        />
      ) : (
        <div className="motion-stagger grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <VenueCard key={item.futsalId} futsal={item} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </main>
  );
}

/**
 * Keeps only the venues with at least one free slot on the given date.
 *
 * <p>There is no bulk availability endpoint, so this is one request per venue. Firing all of them
 * at once produced a burst of hundreds of parallel requests; a small worker pool keeps that to a
 * handful in flight while still finishing quickly.
 */
async function filterByAvailability(venues: Futsal[], slotDate: string, isCancelled: () => boolean) {
  const CONCURRENCY = 6;
  const available: Futsal[] = [];
  let cursor = 0;

  const worker = async () => {
    while (cursor < venues.length && !isCancelled()) {
      const venue = venues[cursor++];
      try {
        const slots = await slotApi.available({ futsalId: venue.futsalId, slotDate, page: 0, size: 1 });
        if (slots.totalItems > 0) available.push(venue);
      } catch {
        // A venue whose slots cannot be read is treated as unavailable rather than failing the page.
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, venues.length) }, worker));

  // Workers complete out of order, so restore the ordering the chosen sort produced.
  const order = new Map(venues.map((venue, index) => [venue.futsalId, index]));
  return available.sort((a, b) => (order.get(a.futsalId) ?? 0) - (order.get(b.futsalId) ?? 0));
}

function queryParams(q: string, date: string, sort: Sort) {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  if (date) params.set('date', date);
  if (sort !== 'recommended') params.set('sort', sort);
  return params;
}

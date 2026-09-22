import { Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { futsalApi, slotApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, ErrorState, VenueGridSkeleton } from '../../components/State';
import { Button, Chip, Field, PageHero, SelectField } from '../../components/UI';
import { VenueCard } from '../../components/VenueCard';
import { TIME_WINDOWS, timeWindowLabel } from '../../constants/brand';
import type { Futsal } from '../../types/api';
import { formatDate, minutesFromTime, todayInput } from '../../utils/format';

type Sort = 'recommended' | 'price-low' | 'price-high';

const PAGE_SIZE = 12;

export function Venues() {
  const [searchParams, setSearchParams] = useSearchParams();
  // The URL is the single source of truth for the filters; only the search box keeps local
  // state, so that typing does not re-run the query on every keystroke.
  const q = searchParams.get('q') || '';
  const date = searchParams.get('date') || '';
  // Earliest start time a slot may have, as HH:mm. See TIME_WINDOWS.
  const from = searchParams.get('from') || '';
  const sort = (searchParams.get('sort') as Sort) || 'recommended';

  // Asking for "this evening" without naming a day means today, so a time on its own still
  // narrows the list instead of being silently ignored.
  const effectiveDate = date || (from ? todayInput() : '');

  const [search, setSearch] = useState(q);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Futsal[]>([]);
  // Earliest free start time per venue, only for the venues an availability probe actually checked.
  const [nextFree, setNextFree] = useState<Map<number, string>>(new Map());
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => { setSearch(q); }, [q]);
  useEffect(() => { setPage(0); }, [q, date, from, sort]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        if (!effectiveDate) {
          const data = await futsalApi.list({ page, size: PAGE_SIZE, q, sort });
          if (cancelled) return;
          setItems(data.items || []);
          setNextFree(new Map());
          setTotalItems(data.totalItems || 0);
          setTotalPages(data.totalPages || 0);
          return;
        }

        const data = await futsalApi.list({ page: 0, size: 200, q, sort });
        if (cancelled) return;
        const available = await filterByAvailability(data.items || [], effectiveDate, from, () => cancelled);
        if (cancelled) return;
        setItems(available.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map((entry) => entry.futsal));
        setNextFree(new Map(available.map((entry) => [entry.futsal.futsalId, entry.nextFree])));
        setTotalItems(available.length);
        setTotalPages(Math.ceil(available.length / PAGE_SIZE));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load venues');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Date filtering is expensive (one availability probe per venue), so it is debounced.
    // `cancelled` also stops a superseded run from overwriting fresher results.
    const timer = window.setTimeout(run, effectiveDate ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [page, q, effectiveDate, from, sort, retryKey]);

  const applyFilters = (next: { q?: string; date?: string; from?: string; sort?: Sort }) => {
    setSearchParams(queryParams(next.q ?? q, next.date ?? date, next.from ?? from, next.sort ?? sort));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    applyFilters({ q: search.trim() });
  };

  const hasFilters = Boolean(q || date || from || sort !== 'recommended');
  const clearFilters = () => {
    setSearch('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <main className="container-page py-10">
      <PageHero eyebrow="Book a court" title="Venues" description="Browse live venues and book an available slot." />

      <form className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[minmax(0,1fr)_165px_195px_185px_auto] lg:items-end" onSubmit={submit}>
        <Field
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Venue, city, address, or court type"
          prefix={<Search size={18} />}
          onClear={() => { setSearch(''); if (q) applyFilters({ q: '' }); }}
        />
        <Field label="Date" type="date" min={todayInput()} value={date} onChange={(event) => applyFilters({ date: event.target.value })} />
        <SelectField label="Start time" value={from} onChange={(event) => applyFilters({ from: event.target.value })}>
          {TIME_WINDOWS.map((window) => <option key={window.value || 'any'} value={window.value}>{window.label}</option>)}
        </SelectField>
        <SelectField label="Sort by" value={sort} onChange={(event) => applyFilters({ sort: event.target.value as Sort })}>
          <option value="recommended">Recommended</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </SelectField>
        <Button className="w-full px-6 sm:col-span-2 md:col-span-3 lg:col-span-1" type="submit">Search</Button>
      </form>

      {hasFilters && (
        <div className="mb-5 flex flex-wrap gap-2">
          {q && <Chip onRemove={() => applyFilters({ q: '' })}>Search: {q}</Chip>}
          {date && <Chip tone="green" onRemove={() => applyFilters({ date: '' })}>Date: {formatDate(date)}</Chip>}
          {from && <Chip tone="green" onRemove={() => applyFilters({ from: '' })}>From: {timeWindowLabel(from)}</Chip>}
          {sort !== 'recommended' && (
            <Chip tone="green" onRemove={() => applyFilters({ sort: 'recommended' })}>
              Sort: {sort === 'price-low' ? 'Price low to high' : 'Price high to low'}
            </Chip>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <p className="mb-4 text-sm text-muted">
          <span className="font-semibold tabular-nums text-slate-900">{totalItems}</span> {totalItems === 1 ? 'venue' : 'venues'} found
          {effectiveDate ? ' with free slots' : ''}
        </p>
      )}

      {error ? (
        <ErrorState message={error} retry={() => setRetryKey((key) => key + 1)} />
      ) : loading ? (
        <VenueGridSkeleton count={6} label={effectiveDate ? 'Checking availability for this date' : 'Loading venues'} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No venues found"
          description={hasFilters ? 'No venue matches the current filters. Try a different date, a wider time window, or another search term.' : 'No venues have been published yet.'}
          action={hasFilters
            ? <Button type="button" variant="outline" onClick={clearFilters}>Clear filters</Button>
            : <Link to="/" className="btn-soft">Back to home</Link>}
        />
      ) : (
        <div className="motion-stagger grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <VenueCard
              key={item.futsalId}
              futsal={item}
              available={Boolean(effectiveDate)}
              nextFree={nextFree.get(item.futsalId)}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </main>
  );
}

/**
 * Keeps only the venues with at least one free slot on the given date.
 *
 * <p>When `from` is set the slot must also start at or after that time, which is why the probe
 * asks for a page of slots rather than just one: the first free slot of the day is usually a
 * morning one, and it says nothing about whether the evening is open.
 *
 * <p>There is no bulk availability endpoint, so this is one request per venue. Firing all of them
 * at once produced a burst of hundreds of parallel requests; a small worker pool keeps that to a
 * handful in flight while still finishing quickly.
 */
async function filterByAvailability(venues: Futsal[], slotDate: string, from: string, isCancelled: () => boolean) {
  const CONCURRENCY = 6;
  const earliest = minutesFromTime(from);
  const available: { futsal: Futsal; nextFree: string }[] = [];
  let cursor = 0;

  const worker = async () => {
    while (cursor < venues.length && !isCancelled()) {
      const venue = venues[cursor++];
      try {
        const slots = await slotApi.available({
          futsalId: venue.futsalId,
          slotDate,
          page: 0,
          size: earliest === null ? 1 : 48
        });
        // The API returns slots time-ascending, so the first match is the earliest one - which is
        // the answer to "when could I actually play here?" that the card now shows.
        const items = slots.items || [];
        const match = earliest === null
          ? items[0]
          : items.find((slot) => (minutesFromTime(slot.startTime) ?? -1) >= earliest);
        if (match) available.push({ futsal: venue, nextFree: match.startTime });
      } catch {
        // A venue whose slots cannot be read is treated as unavailable rather than failing the page.
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, venues.length) }, worker));

  // Workers complete out of order, so restore the ordering the chosen sort produced.
  const order = new Map(venues.map((venue, index) => [venue.futsalId, index]));
  return available.sort((a, b) => (order.get(a.futsal.futsalId) ?? 0) - (order.get(b.futsal.futsalId) ?? 0));
}

function queryParams(q: string, date: string, from: string, sort: Sort) {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  if (date) params.set('date', date);
  if (from) params.set('from', from);
  if (sort !== 'recommended') params.set('sort', sort);
  return params;
}

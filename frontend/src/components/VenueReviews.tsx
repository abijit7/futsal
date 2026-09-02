import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { reviewApi } from '../api/modules';
import { useAuth } from '../context/AuthContext';
import type { Review } from '../types/api';
import { formatDate } from '../utils/format';
import { EmptyState, ErrorState, LoadingState } from './State';
import { Button } from './UI';
import { StarRating } from './StarRating';

const PAGE_SIZE = 5;

/**
 * The review list for one venue.
 *
 * Writing a review lives in "My bookings", not here: the server only accepts a review tied to an
 * approved booking that has already been played, so a form on a public page would mostly serve to
 * reject people. This explains that instead.
 */
export function VenueReviews({ futsalId, onChanged }: { futsalId: number; onChanged?: () => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Review[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reviewApi.forFutsal(futsalId, page, PAGE_SIZE);
      setItems(data.items || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalItems || 0);
    } catch {
      setItems([]);
      setError('Unable to load reviews right now.');
    } finally {
      setLoading(false);
    }
  }, [futsalId, page]);

  useEffect(() => { load(); }, [load]);

  const remove = async (reviewId: number) => {
    setDeletingId(reviewId);
    setError('');
    try {
      await reviewApi.delete(reviewId);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review could not be removed.');
    } finally {
      setDeletingId(null);
    }
  };

  const canRemove = (review: Review) =>
    Boolean(user?.authToken) && (user?.role === 'ADMIN' || user?.userId === review.authorId);

  return (
    <section className="panel p-6" aria-labelledby="reviews-heading">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="reviews-heading" className="text-xl font-black text-slate-950">
          Reviews{totalItems > 0 && <span className="ml-2 text-sm font-bold text-slate-500">({totalItems})</span>}
        </h2>
      </div>

      {loading && <LoadingState label="Loading reviews" />}
      {!loading && error && <ErrorState message={error} retry={load} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="No reviews yet"
          description="Reviews come from players who have actually finished a booking here, so the ratings you see are from real visits."
        />
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {items.map((review) => (
            <li key={review.reviewId} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRating value={review.rating} />
                    <span className="sr-only">{review.rating} out of 5</span>
                    <span className="text-sm font-bold text-slate-900">{review.authorName || 'A player'}</span>
                    <span className="text-xs font-semibold text-slate-400">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                  )}
                </div>
                {canRemove(review) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(review.reviewId)}
                    loading={deletingId === review.reviewId}
                    aria-label={`Delete review by ${review.authorName || 'a player'}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Previous
          </Button>
          <span className="text-xs font-bold text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FutsalAPI } from '../api/futsal.js';
import { FutsalStore } from '../utils/futsalStore.js';
import { formatTime } from '../utils/format.js';
import { resolveImageUrl } from '../utils/image.js';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { useToast } from '../components/ToastProvider.jsx';

const sortOptions = [
  { value: 'recommended', label: 'Recommended', hint: 'Best match first' },
  { value: 'price-low', label: 'Price: low to high', hint: 'Lowest hourly rate' },
  { value: 'price-high', label: 'Price: high to low', hint: 'Premium venues first' }
];

export default function Futsals() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [futsals, setFutsals] = useState([]);
  const [photoIndex, setPhotoIndex] = useState({});
  const [photoDir, setPhotoDir] = useState({});
  const touchStartRef = useRef({});
  const mouseStartRef = useRef({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [sortOpen, setSortOpen] = useState(false);
  const pageSize = 12;
  const selectedSort = sortOptions.find((option) => option.value === sortBy) || sortOptions[0];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await FutsalAPI.getAll({
          page,
          size: pageSize,
          q: search,
          sort: sortBy
        });
        const items = data?.items ?? data ?? [];
        setFutsals(items);
        setTotalPages(data?.totalPages ?? (items.length > 0 ? 1 : 0));
      } catch (err) {
        showToast(`Failed to load futsals: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, search, sortBy, showToast]);

  const selectFutsal = (futsal) => {
    FutsalStore.save({ futsalId: futsal.futsalId, name: futsal.name });
    navigate('/slots');
  };

  const getIndex = (futsalId) => photoIndex[futsalId] || 0;

  const stepPhoto = (futsalId, total, dir) => {
    setPhotoIndex((prev) => {
      const current = prev[futsalId] || 0;
      const next = (current + dir + total) % total;
      return { ...prev, [futsalId]: next };
    });
    setPhotoDir((prev) => ({ ...prev, [futsalId]: dir }));
  };

  const handleTouchStart = (futsalId, event) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current[futsalId] = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (futsalId, total, event) => {
    const start = touchStartRef.current[futsalId];
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    delete touchStartRef.current[futsalId];
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    stepPhoto(futsalId, total, dx < 0 ? 1 : -1);
  };

  const handleMouseDown = (futsalId, event) => {
    mouseStartRef.current[futsalId] = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = (futsalId, total, event) => {
    const start = mouseStartRef.current[futsalId];
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    delete mouseStartRef.current[futsalId];
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    stepPhoto(futsalId, total, dx < 0 ? 1 : -1);
  };

  const handleMouseLeave = (futsalId) => {
    delete mouseStartRef.current[futsalId];
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Find your <span>next court</span></h1>
          <p>Compare futsal venues, prices, opening hours, and available booking slots.</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="browse-toolbar mb-3">
          <div className="browse-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search futsal, city, or area"
              aria-label="Search futsals"
            />
          </div>
          <div
            className={`sort-control ${sortOpen ? 'open' : ''}`}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setSortOpen(false);
              }
            }}
          >
            <button
              type="button"
              className="sort-trigger"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((value) => !value)}
            >
              <span className="sort-label">Sort by</span>
              <span className="sort-value">{selectedSort.label}</span>
            </button>
            {sortOpen && (
              <div className="sort-menu" role="listbox" aria-label="Sort venues">
                {sortOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`sort-option ${sortBy === option.value ? 'selected' : ''}`}
                    role="option"
                    aria-selected={sortBy === option.value}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSortBy(option.value);
                      setPage(0);
                      setSortOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    <small>{option.hint}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="slots-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="slot-card skeleton-card" key={`futsal-skel-${index}`} aria-hidden="true">
                <div className="skeleton skeleton-media"></div>
                <div className="skeleton skeleton-line lg"></div>
                <div className="skeleton skeleton-line"></div>
                <div className="skeleton skeleton-line sm"></div>
                <div className="skeleton skeleton-line"></div>
                <div className="skeleton skeleton-button"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && futsals.length === 0 && !search.trim() && (
          <EmptyState icon="0" title="No futsals available" description="Please check back later." />
        )}

        {!loading && futsals.length === 0 && search.trim() && (
          <EmptyState icon="0" title="No futsals match your search" description="Try another city, area, or venue name." />
        )}

        {!loading && futsals.length > 0 && (
          <div className="venue-grid">
            {futsals.map((f) => {
              const images = (f.imageUrls && f.imageUrls.length > 0) ? f.imageUrls : (f.imageUrl ? [f.imageUrl] : []);
              const currentIndex = getIndex(f.futsalId);
              const currentImage = images[currentIndex] || images[0];
              const dir = photoDir[f.futsalId] || 1;
              const slideClass = dir === 1 ? 'slide-left' : 'slide-right';
              const ratingValue = f.rating !== null && f.rating !== undefined ? Number(f.rating).toFixed(1) : null;
              const reviewCount = Number(f.reviewCount || 0);
              return (
                <article className="venue-card" key={f.futsalId}>
                  <div className="venue-card-media">
                    {images.length > 0 ? (
                      <div
                        className="futsal-carousel"
                        onTouchStart={(event) => handleTouchStart(f.futsalId, event)}
                        onTouchEnd={(event) => handleTouchEnd(f.futsalId, images.length, event)}
                        onMouseDown={(event) => handleMouseDown(f.futsalId, event)}
                        onMouseUp={(event) => handleMouseUp(f.futsalId, images.length, event)}
                        onMouseLeave={() => handleMouseLeave(f.futsalId)}
                      >
                        <img
                          key={`${f.futsalId}-${currentIndex}-${dir}`}
                          className={`futsal-main ${slideClass}`}
                          src={resolveImageUrl(currentImage)}
                          alt={f.name}
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        {f.courtType && <span className="availability-chip">{f.courtType}</span>}
                        {f.verified && <span className="venue-rank">Verified</span>}
                        {images.length > 1 && (
                          <>
                            <button
                              type="button"
                              className="futsal-nav futsal-prev"
                              onClick={() => stepPhoto(f.futsalId, images.length, -1)}
                              aria-label="Previous photo"
                            >
                              &lt;
                            </button>
                            <button
                              type="button"
                              className="futsal-nav futsal-next"
                              onClick={() => stepPhoto(f.futsalId, images.length, 1)}
                              aria-label="Next photo"
                            >
                              &gt;
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                    <div className="venue-placeholder">
                      <span>{f.name?.charAt(0)?.toUpperCase() || 'F'}</span>
                    </div>
                    )}
                  </div>
                  <div className="venue-card-body">
                    {(f.verified || ratingValue) && (
                      <div className="venue-card-topline">
                        {f.verified && <span className="slot-date">Verified venue</span>}
                        {ratingValue && (
                          <span className="rating-pill">
                            {ratingValue}{reviewCount > 0 ? ` (${reviewCount})` : ''}
                          </span>
                        )}
                      </div>
                    )}
                    <h2 className="venue-title">{f.name}</h2>
                    <div className="venue-location">{f.address}, {f.city}</div>
                    <div className="text-muted text-sm mb-2">{f.phone}</div>
                    {f.description && <div className="venue-description">{f.description}</div>}
                    <div className="venue-meta">
                      <span>{f.openingTime ? formatTime(f.openingTime) : '-'} - {f.closingTime ? formatTime(f.closingTime) : '-'}</span>
                      {f.courtType && <span>{f.courtType}</span>}
                    </div>
                    <div className="venue-card-footer">
                      <div>
                        <span className="price-label">From</span>
                        <strong>NPR {f.hourlyPrice ?? '-'}</strong>
                        <span>/ hour</span>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => selectFutsal(f)}>
                        View Slots
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && futsals.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>
    </>
  );
}

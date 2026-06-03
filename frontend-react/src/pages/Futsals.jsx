import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FutsalAPI } from '../api/futsal.js';
import { FutsalStore } from '../utils/futsalStore.js';
import { formatTime } from '../utils/format.js';
import { resolveImageUrl } from '../utils/image.js';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { useToast } from '../components/ToastProvider.jsx';

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
  const pageSize = 12;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await FutsalAPI.getAll({ page, size: pageSize });
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
  }, [page, showToast]);

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

        {!loading && futsals.length === 0 && (
          <EmptyState icon="0" title="No futsals available" description="Please check back later." />
        )}

        {!loading && futsals.length > 0 && (
          <div className="slots-grid">
            {futsals.map((f) => {
              const images = (f.imageUrls && f.imageUrls.length > 0) ? f.imageUrls : (f.imageUrl ? [f.imageUrl] : []);
              const currentIndex = getIndex(f.futsalId);
              const currentImage = images[currentIndex] || images[0];
              const dir = photoDir[f.futsalId] || 1;
              const slideClass = dir === 1 ? 'slide-left' : 'slide-right';
              return (
                <article className="slot-card" key={f.futsalId}>
                  {images.length > 0 && (
                    <div className="futsal-gallery">
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
                    </div>
                  )}
                  {images.length === 0 && (
                    <div className="venue-placeholder">
                      <span>{f.name?.charAt(0)?.toUpperCase() || 'F'}</span>
                    </div>
                  )}
                  <div className="slot-date">Verified venue</div>
                  <h2 className="venue-title">{f.name}</h2>
                  <div className="text-muted text-sm mb-1">{f.address}, {f.city}</div>
                  <div className="text-muted text-sm mb-2">{f.phone}</div>
                  <div className="venue-meta">
                    <span>Opens {f.openingTime ? formatTime(f.openingTime) : '-'}</span>
                    <span>NPR {f.hourlyPrice ?? '-'} / hour</span>
                  </div>
                  {f.description && <div className="text-muted text-sm mb-2">{f.description}</div>}
                  <button className="btn btn-primary btn-full" onClick={() => selectFutsal(f)}>
                    View Available Slots
                  </button>
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

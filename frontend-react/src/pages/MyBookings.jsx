import { useEffect, useState } from 'react';
import { BookingAPI } from '../api/booking.js';
import { Auth } from '../utils/auth.js';
import { calculateDuration, compactTimeRange, formatDate, formatDateTime } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingWrap from '../components/LoadingWrap.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { useConfirm } from '../components/ConfirmProvider.jsx';

const filters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function MyBookings() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const user = Auth.get();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 6;

  const loadBookings = async (targetPage = page) => {
    try {
      const data = await BookingAPI.getByUser(user.userId, { page: targetPage, size: pageSize });
      const items = data?.items ?? data ?? [];
      setBookings(items);
      setTotalPages(data?.totalPages ?? (items.length > 0 ? 1 : 0));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(page);
  }, [page]);

  const filtered = filter === 'ALL' ? bookings : bookings.filter((b) => b.status === filter);

  const cancelBooking = async (bookingId) => {
    const ok = await confirm('Are you sure you want to cancel this booking?');
    if (!ok) return;
    try {
      await BookingAPI.updateStatus(bookingId, 'CANCELLED');
      showToast('Booking cancelled successfully', 'success');
      loadBookings(page);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Manage <span>bookings</span></h1>
          <p>Track upcoming sessions, payment references, notes, and booking status.</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="tabs-nav mb-3">
          {filters.map((f) => (
            <button
              key={f}
              className={`tab-btn ${filter === f ? 'active' : ''}`}
              onClick={() => {
                setFilter(f);
                setPage(0);
              }}
            >
              {f === 'ALL' ? 'All' : f}
            </button>
          ))}
        </div>

        {loading && <LoadingWrap message="Loading your bookings..." />}

        {!loading && filtered.length === 0 && (
          <EmptyState icon="0" title="No bookings found" description="Browse available slots to get started." />
        )}

        {!loading && filtered.length > 0 && (
          <div className="booking-card-grid">
            {filtered.map((b) => {
              const canCancel = b.status === 'PENDING' || b.status === 'APPROVED';
              const paymentInfo = b.paymentMethod ? `${b.paymentMethod} / ${b.paymentRef}` : '-';
              return (
                <article key={b.bookingId} className={`booking-detail-card status-border-${b.status.toLowerCase()}`}>
                  <div className="booking-detail-head">
                    <div>
                      <div className="slot-date">{formatDate(b.timeSlot.slotDate)}</div>
                      <h2>{b.timeSlot.futsal?.name || 'Futsal booking'}</h2>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="booking-detail-time">{compactTimeRange(b.timeSlot.startTime, b.timeSlot.endTime)}</div>
                  <div className="booking-detail-meta">
                    <span>{calculateDuration(b.timeSlot.startTime, b.timeSlot.endTime)} session</span>
                    <span>Payment: {paymentInfo}</span>
                    <span>Booked: {formatDateTime(b.bookedAt)}</span>
                  </div>
                  {b.notes && <div className="booking-notes">Notes: {b.notes}</div>}
                  <div className="booking-detail-footer">
                    <div className="slot-price">NPR {b.timeSlot.futsal?.hourlyPrice ?? '-'} <span>/ hour</span></div>
                  {canCancel && (
                    <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(b.bookingId)}>
                      Cancel Booking
                    </button>
                  )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>
    </>
  );
}

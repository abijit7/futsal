import { useEffect, useState } from 'react';
import { BookingAPI } from '../api/booking.js';
import { Auth } from '../utils/auth.js';
import { calculateDuration, formatDate, formatDateTime, formatTime } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingWrap from '../components/LoadingWrap.jsx';
import EmptyState from '../components/EmptyState.jsx';
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

  const loadBookings = async () => {
    try {
      const data = await BookingAPI.getByUser(user.userId);
      setBookings(data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filtered = filter === 'ALL' ? bookings : bookings.filter((b) => b.status === filter);

  const cancelBooking = async (bookingId) => {
    const ok = await confirm('Are you sure you want to cancel this booking?');
    if (!ok) return;
    try {
      await BookingAPI.updateStatus(bookingId, 'CANCELLED');
      showToast('Booking cancelled successfully', 'success');
      loadBookings();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>MY <span>BOOKINGS</span></h1>
          <p>Track and manage all your futsal bookings</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="tabs-nav mb-3">
          {filters.map((f) => (
            <button
              key={f}
              className={`tab-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : f}
            </button>
          ))}
        </div>

        {loading && <LoadingWrap message="Loading your bookings..." />}

        {!loading && filtered.length === 0 && (
          <EmptyState icon="📭" title="No bookings found" description="Browse available slots to get started." />
        )}

        {!loading && filtered.length > 0 && (
          <div className="slots-grid">
            {filtered.map((b) => {
              const canCancel = b.status === 'PENDING' || b.status === 'APPROVED';
              const statusColors = {
                PENDING: 'var(--warning)',
                APPROVED: 'var(--green)',
                REJECTED: 'var(--danger)',
                CANCELLED: 'var(--muted)'
              };
              const paymentInfo = b.paymentMethod ? `${b.paymentMethod} • ${b.paymentRef}` : '—';
              return (
                <div key={b.bookingId} className="slot-card" style={{ borderTop: `3px solid ${statusColors[b.status]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div className="slot-date">📅 {formatDate(b.timeSlot.slotDate)}</div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="text-muted text-sm mb-1">🏟️ {b.timeSlot.futsal?.name || '—'}</div>
                  <div className="slot-time">{formatTime(b.timeSlot.startTime)} – {formatTime(b.timeSlot.endTime)}</div>
                  <div className="slot-duration">⏱ {calculateDuration(b.timeSlot.startTime, b.timeSlot.endTime)}</div>
                  <div className="slot-price">NPR {b.timeSlot.futsal?.hourlyPrice ?? '—'} <span>/ hour</span></div>
                  <div className="text-muted text-sm mb-1">💳 {paymentInfo}</div>
                  {b.notes && <div className="text-muted text-sm mb-1">📝 {b.notes}</div>}
                  <div className="text-muted text-sm mb-2">Booked: {formatDateTime(b.bookedAt)}</div>
                  {canCancel && (
                    <button className="btn btn-danger btn-full btn-sm" onClick={() => cancelBooking(b.bookingId)}>
                      ❌ Cancel Booking
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}


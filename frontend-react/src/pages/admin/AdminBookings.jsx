import { useEffect, useState } from 'react';
import { BookingAPI } from '../../api/booking.js';
import { formatDate, formatDateTime, formatTime } from '../../utils/format.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import { useConfirm } from '../../components/ConfirmProvider.jsx';

const filters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function AdminBookings() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL');

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await BookingAPI.getAll();
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

  const updateStatus = async (bookingId, status) => {
    const label = status === 'APPROVED' ? 'approve' : 'reject';
    const ok = await confirm(`Are you sure you want to ${label} this booking?`);
    if (!ok) return;
    try {
      await BookingAPI.updateStatus(bookingId, status);
      showToast(`Booking ${status.toLowerCase()} successfully`, 'success');
      loadBookings();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteBooking = async (bookingId) => {
    const ok = await confirm('Permanently delete this booking record?');
    if (!ok) return;
    try {
      await BookingAPI.delete(bookingId);
      showToast('Booking deleted', 'success');
      loadBookings();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>MANAGE <span>BOOKINGS</span></h1>
          <p>Review, approve, reject, and track all bookings</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="tabs-nav mb-3">
          {filters.map((f) => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : f}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>All Bookings</h2>
            <button onClick={loadBookings} className="btn btn-secondary btn-sm">🔄 Refresh</button>
          </div>

          {loading ? (
            <div className="loading-wrap"><div className="spinner"></div><p>Loading bookings...</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">📭</div><h3>No bookings found</h3><p>No bookings in this category.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Futsal</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Price</th>
                    <th>Payment</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th>Booked At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => {
                    const isPending = b.status === 'PENDING';
                    const paymentInfo = b.paymentMethod ? `${b.paymentMethod} • ${b.paymentRef}` : '—';
                    return (
                      <tr key={b.bookingId}>
                        <td className="text-muted text-sm">{i + 1}</td>
                        <td>
                          <div className="fw-bold">{b.user.name}</div>
                          <div className="text-muted text-sm">{b.user.phone}</div>
                        </td>
                        <td className="text-muted text-sm">{b.timeSlot.futsal?.name || '—'}</td>
                        <td>{formatDate(b.timeSlot.slotDate)}</td>
                        <td>{formatTime(b.timeSlot.startTime)}<br /><span className="text-muted text-sm">{formatTime(b.timeSlot.endTime)}</span></td>
                        <td style={{ color: 'var(--accent)', fontWeight: 600 }}>NPR {b.timeSlot.futsal?.hourlyPrice ?? '—'}</td>
                        <td className="text-muted text-sm">{paymentInfo}</td>
                        <td className="text-muted text-sm">{b.notes || '—'}</td>
                        <td><StatusBadge status={b.status} /></td>
                        <td className="text-muted text-sm">{formatDateTime(b.bookedAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {isPending && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => updateStatus(b.bookingId, 'APPROVED')}>✅</button>
                                <button className="btn btn-danger btn-sm" onClick={() => updateStatus(b.bookingId, 'REJECTED')}>❌</button>
                              </>
                            )}
                            <button className="btn btn-secondary btn-sm" onClick={() => deleteBooking(b.bookingId)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


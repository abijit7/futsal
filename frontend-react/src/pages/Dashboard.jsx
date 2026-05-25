import { useEffect, useState } from 'react';
import { BookingAPI } from '../api/booking.js';
import { Auth } from '../utils/auth.js';
import { formatDate, formatDateTime, formatTime } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingWrap from '../components/LoadingWrap.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function Dashboard() {
  const { showToast } = useToast();
  const user = Auth.get();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await BookingAPI.getByUser(user.userId);
        setBookings(data || []);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast, user.userId]);

  const recent = bookings.slice(0, 5);
  const statTotal = bookings.length;
  const statPending = bookings.filter((b) => b.status === 'PENDING').length;
  const statApproved = bookings.filter((b) => b.status === 'APPROVED').length;
  const statCancelled = bookings.filter((b) => b.status === 'CANCELLED').length;

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>MY <span>DASHBOARD</span></h1>
          <p>Welcome back, {user.name}! Here's your booking summary.</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value">{statTotal}</div><div className="stat-label">Total Bookings</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--warning)' }}>{statPending}</div><div className="stat-label">Pending</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--green)' }}>{statApproved}</div><div className="stat-label">Approved</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--muted)' }}>{statCancelled}</div><div className="stat-label">Cancelled</div></div>
        </div>

        <div className="card mb-3">
          <div className="card-header"><h2>Quick Actions</h2></div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/slots" className="btn btn-primary">⚽ Book a Slot</a>
            <a href="/my-bookings" className="btn btn-secondary">📋 View My Bookings</a>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Recent Bookings</h2>
            <a href="/my-bookings" className="btn btn-secondary btn-sm">View All</a>
          </div>

          {loading && <LoadingWrap message="Loading your bookings..." />}

          {!loading && (
            <>
              {bookings.length === 0 ? (
                <EmptyState icon="📭" title="No bookings yet" description="You haven't made any bookings. Book your first slot." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Booked On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((b, i) => (
                        <tr key={b.bookingId}>
                          <td>{i + 1}</td>
                          <td>{formatDate(b.timeSlot.slotDate)}</td>
                          <td>{formatTime(b.timeSlot.startTime)} – {formatTime(b.timeSlot.endTime)}</td>
                          <td style={{ color: 'var(--accent)', fontWeight: 600 }}>NPR {b.timeSlot.futsal?.hourlyPrice ?? '—'}</td>
                          <td><StatusBadge status={b.status} /></td>
                          <td className="text-muted text-sm">{formatDateTime(b.bookedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}


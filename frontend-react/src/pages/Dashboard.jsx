import { useEffect, useState } from 'react';
import { BookingAPI } from '../api/booking.js';
import { Auth } from '../utils/auth.js';
import { compactTimeRange, formatDate, formatDateTime } from '../utils/format.js';
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
        const data = await BookingAPI.getByUser(user.userId, { page: 0, size: 200 });
        const items = data?.items ?? data ?? [];
        setBookings(items);
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
          <h1>Your <span>booking hub</span></h1>
          <p>Welcome back, {user.name}! Here's your booking summary.</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="dashboard-profile">
              <div className="nav-avatar large">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
              </div>
            </div>
            <div className="mini-stat-grid">
              <div><strong>{statTotal}</strong><span>Total</span></div>
              <div><strong>{statApproved}</strong><span>Approved</span></div>
            </div>
            <a href="/slots" className="btn btn-primary btn-full">Book a Court</a>
          </aside>

          <div className="dashboard-main">
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{statTotal}</div><div className="stat-label">Total Bookings</div></div>
              <div className="stat-card"><div className="stat-value text-warning">{statPending}</div><div className="stat-label">Pending</div></div>
              <div className="stat-card"><div className="stat-value text-approved">{statApproved}</div><div className="stat-label">Approved</div></div>
              <div className="stat-card"><div className="stat-value text-cancelled">{statCancelled}</div><div className="stat-label">Cancelled</div></div>
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
                    <EmptyState icon="0" title="No bookings yet" description="Browse available slots to book your first session." />
                  ) : (
                    <div className="booking-list">
                      {recent.map((b) => (
                        <article className="booking-row-card" key={b.bookingId}>
                          <div>
                            <div className="slot-date">{formatDate(b.timeSlot.slotDate)}</div>
                            <h3>{b.timeSlot.futsal?.name || 'Futsal booking'}</h3>
                            <p>{compactTimeRange(b.timeSlot.startTime, b.timeSlot.endTime)} · Booked {formatDateTime(b.bookedAt)}</p>
                          </div>
                          <div className="booking-row-side">
                            <strong>NPR {b.timeSlot.futsal?.hourlyPrice ?? '-'}</strong>
                            <StatusBadge status={b.status} />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

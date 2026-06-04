import { useEffect, useState } from 'react';
import { BookingAPI } from '../../api/booking.js';
import { SlotAPI } from '../../api/slot.js';
import { UserAPI } from '../../api/user.js';
import { compactTimeRange, formatDate } from '../../utils/format.js';
import { useToast } from '../../components/ToastProvider.jsx';

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalSlots: 0,
    availableSlots: 0,
    totalBookings: 0,
    pending: 0,
    approved: 0,
    totalUsers: 0
  });
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const [slotPage, availablePage, bookingPage, pendingPage, approvedPage, usersPage] = await Promise.all([
        SlotAPI.getAll({ page: 0, size: 1 }),
        SlotAPI.getAvailable({ page: 0, size: 1 }),
        BookingAPI.getAll({ page: 0, size: 1 }),
        BookingAPI.getAll({ page: 0, size: 8, status: 'PENDING' }),
        BookingAPI.getAll({ page: 0, size: 1, status: 'APPROVED' }),
        UserAPI.getAll({ page: 0, size: 1 })
      ]);

      const totalSlots = slotPage?.totalItems ?? slotPage?.items?.length ?? slotPage?.length ?? 0;
      const availableSlots = availablePage?.totalItems ?? availablePage?.items?.length ?? availablePage?.length ?? 0;
      const totalBookings = bookingPage?.totalItems ?? bookingPage?.items?.length ?? bookingPage?.length ?? 0;
      const pending = pendingPage?.totalItems ?? pendingPage?.items?.length ?? pendingPage?.length ?? 0;
      const approved = approvedPage?.totalItems ?? approvedPage?.items?.length ?? approvedPage?.length ?? 0;
      const pendingItems = pendingPage?.items ?? pendingPage ?? [];
      const totalUsers = usersPage?.totalItems ?? usersPage?.items?.length ?? usersPage?.length ?? 0;

      setStats({
        totalSlots,
        availableSlots,
        totalBookings,
        pending,
        approved,
        totalUsers
      });

      setPendingBookings(pendingItems.slice(0, 8));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const updateStatus = async (bookingId, status) => {
    try {
      await BookingAPI.updateStatus(bookingId, status);
      showToast(`Booking ${status.toLowerCase()} successfully`, 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Operations <span>dashboard</span></h1>
          <p>Monitor slot inventory, booking approvals, users, and venue activity.</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="admin-dashboard-shell">
          <aside className="admin-command-panel">
            <div className="section-eyebrow">Admin console</div>
            <h2>Venue operations</h2>
            <p>Monitor inventory, approvals, users, and booking activity from the live backend.</p>
            <div className="admin-command-links">
              <a href="/admin/futsals">Manage Venues</a>
              <a href="/admin/slots">Manage Slots</a>
              <a href="/admin/bookings">Review Bookings</a>
              <a href="/admin/users">Users</a>
            </div>
          </aside>

          <div className="admin-dashboard-main">
            <div className="stats-grid admin-stats-grid">
              <div className="stat-card"><div className="stat-value">{stats.totalSlots}</div><div className="stat-label">Total Slots</div></div>
              <div className="stat-card"><div className="stat-value text-approved">{stats.availableSlots}</div><div className="stat-label">Available Slots</div></div>
              <div className="stat-card"><div className="stat-value">{stats.totalBookings}</div><div className="stat-label">Total Bookings</div></div>
              <div className="stat-card"><div className="stat-value text-warning">{stats.pending}</div><div className="stat-label">Pending Approval</div></div>
              <div className="stat-card"><div className="stat-value text-approved">{stats.approved}</div><div className="stat-label">Approved</div></div>
              <div className="stat-card"><div className="stat-value">{stats.totalUsers}</div><div className="stat-label">Registered Users</div></div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Pending Bookings</h2>
                <a href="/admin/bookings" className="btn btn-secondary btn-sm">View All</a>
              </div>

              {loading ? (
                <div className="loading-wrap"><div className="spinner"></div><p>Loading...</p></div>
              ) : pendingBookings.length === 0 ? (
                <div className="empty-state"><div className="icon">OK</div><h3>No pending bookings</h3><p>All bookings have been reviewed.</p></div>
              ) : (
                <div className="booking-list">
                  {pendingBookings.map((b) => (
                    <article className="booking-row-card admin-booking-row" key={b.bookingId}>
                      <div>
                        <div className="fw-bold">{b.user.name}</div>
                        <p>{b.user.email}</p>
                        <div className="text-muted text-sm">{b.timeSlot.futsal?.name || '-'} · {formatDate(b.timeSlot.slotDate)} · {compactTimeRange(b.timeSlot.startTime, b.timeSlot.endTime)}</div>
                      </div>
                      <div className="booking-row-side">
                        <strong>NPR {b.timeSlot.futsal?.hourlyPrice ?? '-'}</strong>
                        <div className="actions-row">
                          <button className="btn btn-success btn-sm" onClick={() => updateStatus(b.bookingId, 'APPROVED')}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateStatus(b.bookingId, 'REJECTED')}>Reject</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

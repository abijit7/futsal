import { useEffect, useState } from 'react';
import { BookingAPI } from '../../api/booking.js';
import { SlotAPI } from '../../api/slot.js';
import { UserAPI } from '../../api/user.js';
import { formatDate, formatTime } from '../../utils/format.js';
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
      const [slots, bookings, users] = await Promise.all([
        SlotAPI.getAll(),
        BookingAPI.getAll(),
        UserAPI.getAll()
      ]);

      setStats({
        totalSlots: slots.length,
        availableSlots: slots.filter((s) => s.available).length,
        totalBookings: bookings.length,
        pending: bookings.filter((b) => b.status === 'PENDING').length,
        approved: bookings.filter((b) => b.status === 'APPROVED').length,
        totalUsers: users.filter((u) => u.role === 'USER').length
      });

      setPendingBookings(bookings.filter((b) => b.status === 'PENDING').slice(0, 8));
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
          <h1>ADMIN <span>DASHBOARD</span></h1>
          <p>Manage your futsal venue — slots, bookings, and users</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value">{stats.totalSlots}</div><div className="stat-label">Total Slots</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--green)' }}>{stats.availableSlots}</div><div className="stat-label">Available Slots</div></div>
          <div className="stat-card"><div className="stat-value">{stats.totalBookings}</div><div className="stat-label">Total Bookings</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div><div className="stat-label">Pending Approval</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--green)' }}>{stats.approved}</div><div className="stat-label">Approved</div></div>
          <div className="stat-card"><div className="stat-value">{stats.totalUsers}</div><div className="stat-label">Registered Users</div></div>
        </div>

        <div className="card mb-3">
          <div className="card-header"><h2>Quick Actions</h2></div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/admin/slots" className="btn btn-primary">⏰ Manage Slots</a>
            <a href="/admin/bookings" className="btn btn-secondary">📋 Review Bookings</a>
            <a href="/admin/users" className="btn btn-secondary">👥 View Users</a>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Pending Bookings</h2>
            <a href="/admin/bookings" className="btn btn-secondary btn-sm">View All</a>
          </div>

          {loading ? (
            <div className="loading-wrap"><div className="spinner"></div><p>Loading...</p></div>
          ) : pendingBookings.length === 0 ? (
            <div className="empty-state"><div className="icon">✅</div><h3>No pending bookings</h3><p>All bookings have been reviewed.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>User</th><th>Date</th><th>Time</th><th>Price</th><th>Notes</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {pendingBookings.map((b) => (
                    <tr key={b.bookingId}>
                      <td>
                        <div className="fw-bold">{b.user.name}</div>
                        <div className="text-muted text-sm">{b.user.email}</div>
                      </td>
                      <td>{formatDate(b.timeSlot.slotDate)}</td>
                      <td>{formatTime(b.timeSlot.startTime)} – {formatTime(b.timeSlot.endTime)}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>NPR {b.timeSlot.futsal?.hourlyPrice ?? '—'}</td>
                      <td className="text-muted text-sm">{b.notes || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" onClick={() => updateStatus(b.bookingId, 'APPROVED')}>✅ Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateStatus(b.bookingId, 'REJECTED')}>❌ Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


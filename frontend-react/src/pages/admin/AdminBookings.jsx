import { useEffect, useState } from 'react';
import { BookingAPI } from '../../api/booking.js';
import { formatDate, formatDateTime, formatTime } from '../../utils/format.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useToast } from '../../components/ToastProvider.jsx';
import { useConfirm } from '../../components/ConfirmProvider.jsx';
import Pagination from '../../components/Pagination.jsx';

const filters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function AdminBookings() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const loadBookings = async (targetPage = page, statusFilter = filter) => {
    setLoading(true);
    try {
      const params = { page: targetPage, size: pageSize };
      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const data = await BookingAPI.getAll(params);
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
    loadBookings(page, filter);
  }, [page, filter]);

  const updateStatus = async (bookingId, status) => {
    const label = status === 'APPROVED' ? 'approve' : 'reject';
    const ok = await confirm(`Are you sure you want to ${label} this booking?`);
    if (!ok) return;
    try {
      await BookingAPI.updateStatus(bookingId, status);
      showToast(`Booking ${status.toLowerCase()} successfully`, 'success');
      loadBookings(page, filter);
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
      loadBookings(page, filter);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Review <span>bookings</span></h1>
          <p>Approve requests, audit payment details, and keep booking records organized.</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="tabs-nav mb-3">
          {filters.map((f) => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => {
              setFilter(f);
              setPage(0);
            }}>
              {f === 'ALL' ? 'All' : f}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>All Bookings</h2>
            <button onClick={() => loadBookings(page, filter)} className="btn btn-secondary btn-sm">Refresh</button>
          </div>

          {loading ? (
            <div className="loading-wrap"><div className="spinner"></div><p>Loading bookings...</p></div>
          ) : bookings.length === 0 ? (
            <div className="empty-state"><div className="icon">0</div><h3>No bookings found</h3><p>No bookings in this category.</p></div>
          ) : (
            <div className="table-wrap">
              <table className="responsive-table">
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
                  {bookings.map((b, i) => {
                    const isPending = b.status === 'PENDING';
                    const paymentInfo = b.paymentMethod ? `${b.paymentMethod} / ${b.paymentRef}` : '-';
                    return (
                      <tr key={b.bookingId}>
                        <td className="text-muted text-sm" data-label="#">{i + 1}</td>
                        <td data-label="User">
                          <div className="fw-bold">{b.user.name}</div>
                          <div className="text-muted text-sm">{b.user.phone}</div>
                        </td>
                        <td className="text-muted text-sm" data-label="Futsal">{b.timeSlot.futsal?.name || '-'}</td>
                        <td data-label="Date">{formatDate(b.timeSlot.slotDate)}</td>
                        <td data-label="Time">{formatTime(b.timeSlot.startTime)}<br /><span className="text-muted text-sm">{formatTime(b.timeSlot.endTime)}</span></td>
                        <td data-label="Price" className="text-accent fw-bold">NPR {b.timeSlot.futsal?.hourlyPrice ?? '-'}</td>
                        <td className="text-muted text-sm" data-label="Payment">{paymentInfo}</td>
                        <td className="text-muted text-sm" data-label="Notes">{b.notes || '-'}</td>
                        <td data-label="Status"><StatusBadge status={b.status} /></td>
                        <td className="text-muted text-sm" data-label="Booked At">{formatDateTime(b.bookedAt)}</td>
                        <td className="table-actions" data-label="Actions">
                          <div className="actions-row">
                            {isPending && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => updateStatus(b.bookingId, 'APPROVED')}>Approve</button>
                                <button className="btn btn-danger btn-sm" onClick={() => updateStatus(b.bookingId, 'REJECTED')}>Reject</button>
                              </>
                            )}
                            <button className="btn btn-secondary btn-sm" onClick={() => deleteBooking(b.bookingId)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && bookings.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </>
  );
}

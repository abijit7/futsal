import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FutsalAPI } from '../api/futsal.js';
import { SlotAPI } from '../api/slot.js';
import { PaymentAPI } from '../api/payment.js';
import { Auth } from '../utils/auth.js';
import { FutsalStore } from '../utils/futsalStore.js';
import { calculateDuration, formatDate, formatTime } from '../utils/format.js';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function Slots() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];
  const isGuest = !Auth.isLoggedIn();

  const [futsals, setFutsals] = useState([]);
  const [selectedFutsalId, setSelectedFutsalId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(todayStr);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 12;

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ESEWA');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const loadFutsals = async () => {
      try {
        const data = await FutsalAPI.getAll({ page: 0, size: 200 });
        const items = data?.items ?? data ?? [];
        setFutsals(items);
        if (items.length === 0) {
          setLoading(false);
          return;
        }
        const stored = FutsalStore.get();
        const initialId = stored?.futsalId || items[0].futsalId;
        setSelectedFutsalId(initialId);
      } catch (err) {
        showToast(`Failed to load futsals: ${err.message}`, 'error');
        setLoading(false);
      }
    };
    loadFutsals();
  }, [showToast]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedFutsalId) return;
      try {
        setLoading(true);
        const params = { futsalId: selectedFutsalId, page, size: pageSize };
        if (dateFilter) {
          params.slotDate = dateFilter;
        }
        const data = await SlotAPI.getAvailable(params);
        const items = data?.items ?? data ?? [];
        setSlots(items);
        setTotalPages(data?.totalPages ?? (items.length > 0 ? 1 : 0));
      } catch (err) {
        showToast(`Failed to load slots: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    loadSlots();
  }, [selectedFutsalId, dateFilter, page, showToast]);

  const toggleShowAll = () => {
    setDateFilter((prev) => (prev ? '' : todayStr));
    setPage(0);
  };

  const openBookingModal = (slotId) => {
    if (!Auth.isLoggedIn()) {
      showToast('Please login to book a slot', 'error');
      setTimeout(() => navigate('/login'), 800);
      return;
    }
    setSelectedSlotId(slotId);
    setBookingNotes('');
    setPaymentMethod('ESEWA');
    setBookingError('');
    setBookingModalOpen(true);
  };

  const closeModal = () => {
    setBookingModalOpen(false);
    setSelectedSlotId(null);
    setBookingError('');
  };

  const confirmBooking = async () => {
    setBookingError('');
    setBookingLoading(true);
    try {
      const user = Auth.get();
      await PaymentAPI.confirm(user.userId, selectedSlotId, bookingNotes, paymentMethod);
      showToast(`Payment successful via ${paymentMethod}. Booking submitted! ✅`, 'success');
      closeModal();
      const params = { futsalId: selectedFutsalId, page: 0, size: pageSize };
      if (dateFilter) {
        params.slotDate = dateFilter;
      }
      const data = await SlotAPI.getAvailable(params);
      const items = data?.items ?? data ?? [];
      setSlots(items);
      setTotalPages(data?.totalPages ?? (items.length > 0 ? 1 : 0));
      setPage(0);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const selectedSlot = slots.find((s) => s.slotId === selectedSlotId);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>BOOK A <span>SLOT</span></h1>
          <p>Browse available time slots and book your game</p>
        </div>
      </div>

      <div className="container page-wrap">
        {isGuest && (
          <div className="card mb-3 guest-cta">
            <div className="guest-cta__content">
              <div>
                <div className="fw-bold">Login to book</div>
                <div className="text-muted text-sm">You can browse slots as a guest, but booking requires an account.</div>
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>Login</button>
            </div>
          </div>
        )}
        <div className="card mb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label className="form-label">Select Futsal</label>
              <select
                className="form-control"
                value={selectedFutsalId || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : null;
                  setSelectedFutsalId(value);
                  setPage(0);
                  if (value) {
                    const label = e.target.options[e.target.selectedIndex]?.text || '';
                    FutsalStore.save({ futsalId: value, name: label });
                  }
                }}
              >
                {futsals.length === 0 && <option value="">No futsals available</option>}
                {futsals.map((f) => (
                  <option key={f.futsalId} value={f.futsalId}>{f.name} — {f.city}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Filter by Date</label>
              <input
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(0);
                }}
                style={{ maxWidth: 220 }}
              />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button onClick={toggleShowAll} className="btn btn-secondary">
                {dateFilter ? 'Show All' : 'Show Today'}
              </button>
            </div>
          </div>
        </div>

        {!selectedFutsalId && !loading && (
          <EmptyState icon="🏟️" title="Select a futsal to view slots" description="Choose a futsal to continue." />
        )}

        {loading && selectedFutsalId && (
          <div className="slots-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="slot-card skeleton-card" key={`slot-skel-${index}`} aria-hidden="true">
                <div className="skeleton skeleton-line lg"></div>
                <div className="skeleton skeleton-line"></div>
                <div className="skeleton skeleton-line sm"></div>
                <div className="skeleton skeleton-line"></div>
                <div className="skeleton skeleton-button"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && selectedFutsalId && slots.length === 0 && (
          <EmptyState icon="📭" title="No slots available" description="There are no available slots at the moment. Please check back later." />
        )}

        {!loading && slots.length > 0 && (
          <div className="slots-grid">
            {slots.map((slot) => (
              <div className="slot-card" key={slot.slotId}>
                <div className="slot-date">📅 {formatDate(slot.slotDate)}</div>
                <div className="slot-time">{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</div>
                <div className="slot-duration">⏱ {calculateDuration(slot.startTime, slot.endTime)} session</div>
                <div className="slot-price">NPR {slot.futsal?.hourlyPrice ?? '—'} <span>/ hour</span></div>
                <button className="btn btn-primary btn-full" onClick={() => openBookingModal(slot.slotId)}>
                  Book This Slot
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && slots.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      <div className={`modal-overlay ${bookingModalOpen ? 'show' : ''}`}>
        <div className="modal">
          <div className="modal-header">
            <h3>Confirm Booking</h3>
            <button className="modal-close" onClick={closeModal}>✕</button>
          </div>
          <div className="modal-body">
            <div className="card mb-2" style={{ background: 'var(--surface2)' }}>
              {selectedSlot && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><div className="text-muted text-sm">Futsal</div><div className="fw-bold">{selectedSlot.futsal?.name || '—'}</div></div>
                  <div><div className="text-muted text-sm">Date</div><div className="fw-bold">{formatDate(selectedSlot.slotDate)}</div></div>
                  <div><div className="text-muted text-sm">Time</div><div className="fw-bold">{formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}</div></div>
                  <div><div className="text-muted text-sm">Duration</div><div className="fw-bold">{calculateDuration(selectedSlot.startTime, selectedSlot.endTime)}</div></div>
                  <div><div className="text-muted text-sm">Price</div><div className="fw-bold text-green">NPR {selectedSlot.futsal?.hourlyPrice ?? '—'}</div></div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="ESEWA">eSewa</option>
                <option value="KHALTI">Khalti</option>
                <option value="CASH_IN_HAND">Cash in hand</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-control" value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} placeholder="Any special requests?"></textarea>
            </div>
            <div className={`alert alert-error ${bookingError ? 'show' : ''}`}>
              <span>⚠️</span><span>{bookingError}</span>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmBooking} className="btn btn-primary" disabled={bookingLoading}>
              {bookingLoading ? 'Processing payment...' : '⚽ Book Now'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

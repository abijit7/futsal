import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FutsalAPI } from '../api/futsal.js';
import { SlotAPI } from '../api/slot.js';
import { PaymentAPI } from '../api/payment.js';
import { Auth } from '../utils/auth.js';
import { FutsalStore } from '../utils/futsalStore.js';
import { toDateInputValue } from '../utils/date.js';
import { calculateDuration, compactTimeRange, formatDate, formatTime } from '../utils/format.js';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { useModalAccessibility } from '../components/useModalAccessibility.js';

function buildDateChoices(startDate) {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      value: toDateInputValue(date),
      weekday: date.toLocaleDateString('en-NP', { weekday: 'short' }),
      day: date.toLocaleDateString('en-NP', { day: 'numeric' }),
      month: date.toLocaleDateString('en-NP', { month: 'short' }),
      isToday: index === 0
    };
  });
}

export default function Slots() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const todayStr = toDateInputValue();
  const isGuest = !Auth.isLoggedIn();

  const [futsals, setFutsals] = useState([]);
  const [selectedFutsalId, setSelectedFutsalId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(todayStr);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 48;

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ESEWA');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const bookingDialogRef = useRef(null);
  const dateChoices = buildDateChoices(new Date());

  const loadPublicSlots = async (targetPage = page) => {
    if (!selectedFutsalId) return;
    const params = { futsalId: selectedFutsalId, slotDate: dateFilter, page: targetPage, size: pageSize };
    const data = await SlotAPI.getPublic(params);
    const items = data?.items ?? data ?? [];
    setSlots(items);
    setTotalPages(data?.totalPages ?? (items.length > 0 ? 1 : 0));
  };

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
        await loadPublicSlots(page);
      } catch (err) {
        showToast(`Failed to load slots: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    loadSlots();
  }, [selectedFutsalId, dateFilter, page, showToast]);

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

  const selectSlot = (slot) => {
    if (slot.available === false) return;
    setSelectedSlotId(slot.slotId);
  };

  const reserveSelectedSlot = () => {
    if (!selectedSlotId) {
      showToast('Please select a time slot first', 'error');
      return;
    }
    openBookingModal(selectedSlotId);
  };

  const closeModal = useCallback(() => {
    setBookingModalOpen(false);
    setSelectedSlotId(null);
    setBookingError('');
  }, []);

  useModalAccessibility(bookingModalOpen, bookingDialogRef, closeModal);

  const confirmBooking = async () => {
    setBookingError('');
    setBookingLoading(true);
    try {
      const user = Auth.get();
      await PaymentAPI.confirm(user.userId, selectedSlotId, bookingNotes, paymentMethod);
      showToast(`Payment successful via ${paymentMethod}. Booking submitted.`, 'success');
      closeModal();
      await loadPublicSlots(0);
      setPage(0);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const selectedSlot = slots.find((s) => s.slotId === selectedSlotId);
  const selectedFutsal = futsals.find((f) => f.futsalId === selectedFutsalId);

  useEffect(() => {
    if (slots.length === 0) {
      setSelectedSlotId(null);
      return;
    }
    const stillAvailable = slots.some((slot) => slot.slotId === selectedSlotId && slot.available !== false);
    if (!stillAvailable) {
      const firstAvailable = slots.find((slot) => slot.available !== false);
      setSelectedSlotId(firstAvailable?.slotId || null);
    }
  }, [slots, selectedSlotId]);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Book a <span>game slot</span></h1>
          <p>Filter by venue and date, then reserve the time that fits your team.</p>
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
        <div className="booking-filter-shell mb-3">
          <div className="booking-filter-summary">
            <span className="availability-pill">Real-time availability</span>
            <h2>{selectedFutsal?.name || 'Choose a futsal'}</h2>
            <p>{selectedFutsal ? `${selectedFutsal.address}, ${selectedFutsal.city}` : 'Filter by venue and date to view bookable slots.'}</p>
          </div>
          <div className="filter-bar compact mb-0">
            <div>
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
                  <option key={f.futsalId} value={f.futsalId}>{f.name} - {f.city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Filter by Date</label>
              <input
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>
        </div>

        {!selectedFutsalId && !loading && (
          <EmptyState icon="F" title="Select a futsal to view slots" description="Choose a futsal to continue." />
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
          <EmptyState icon="0" title="No slots available" description="There are no available slots at the moment. Please check back later." />
        )}

        {!loading && slots.length > 0 && (
          <div className="slot-booking-experience">
            <section className="slot-picker-panel">
              <div className="slot-section-title">
                <span className="slot-section-icon calendar" aria-hidden="true"></span>
                <h2>Select Date</h2>
              </div>
              <div className="date-choice-row" role="list" aria-label="Select booking date">
                {dateChoices.map((choice) => {
                  const selected = dateFilter === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      className={`date-choice ${selected ? 'selected' : ''}`}
                      onClick={() => {
                        setDateFilter(choice.value);
                        setPage(0);
                      }}
                    >
                      <span>{choice.weekday}</span>
                      <strong>{choice.day}</strong>
                      <span>{choice.month}</span>
                      {choice.isToday && <em>Today</em>}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="slot-detail-layout">
              <section className="slot-picker-panel">
                <div className="slot-section-title">
                  <span className="slot-section-icon clock" aria-hidden="true"></span>
                  <h2>Available Time Slots</h2>
                </div>
                <div className="slot-legend">
                  <span><i className="legend-available"></i>Available</span>
                  <span><i className="legend-booked"></i>Booked</span>
                  <span><i className="legend-selected"></i>Selected</span>
                </div>
                <div className="time-slot-grid" role="list" aria-label="Available time slots">
                  {slots.map((slot) => {
                    const isBooked = slot.available === false;
                    const selected = slot.slotId === selectedSlotId;
                    return (
                      <button
                        type="button"
                        key={slot.slotId}
                        className={`time-slot-pill ${isBooked ? 'booked' : ''} ${selected ? 'selected' : ''}`}
                        disabled={isBooked}
                        onClick={() => selectSlot(slot)}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              </section>

              <aside className="selected-slot-card">
                <div className="selected-slot-price">
                  <strong>NPR {selectedSlot?.futsal?.hourlyPrice ?? selectedFutsal?.hourlyPrice ?? '-'}</strong>
                  <span>/hour</span>
                </div>
                <div className="selected-slot-rating">Selected futsal booking</div>
                <div className="selected-slot-body">
                  <label>Selected Slot</label>
                  <div className="selected-slot-value">
                    {selectedSlot ? compactTimeRange(selectedSlot.startTime, selectedSlot.endTime) : 'Select a time slot'}
                  </div>
                  <div className="selected-slot-metrics">
                    <div>
                      <span>Duration</span>
                      <strong>{selectedSlot ? calculateDuration(selectedSlot.startTime, selectedSlot.endTime) : '-'}</strong>
                    </div>
                    <div>
                      <span>Date</span>
                      <strong>{selectedSlot ? formatDate(selectedSlot.slotDate) : '-'}</strong>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-full" onClick={reserveSelectedSlot}>
                    Reserve Selected Slot
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}

        {!loading && slots.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      {bookingModalOpen && (
        <div className="modal-overlay show">
          <div
            ref={bookingDialogRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-dialog-title"
            tabIndex="-1"
          >
            <div className="modal-header">
              <h3 id="booking-dialog-title">Confirm Booking</h3>
              <button className="modal-close" onClick={closeModal} aria-label="Close booking dialog">x</button>
            </div>
            <div className="modal-body">
              <div className="card modal-summary mb-2">
                {selectedSlot && (
                  <div className="booking-summary-grid">
                    <div><div className="text-muted text-sm">Futsal</div><div className="fw-bold">{selectedSlot.futsal?.name || '-'}</div></div>
                    <div><div className="text-muted text-sm">Date</div><div className="fw-bold">{formatDate(selectedSlot.slotDate)}</div></div>
                    <div><div className="text-muted text-sm">Time</div><div className="fw-bold">{compactTimeRange(selectedSlot.startTime, selectedSlot.endTime)}</div></div>
                    <div><div className="text-muted text-sm">Duration</div><div className="fw-bold">{calculateDuration(selectedSlot.startTime, selectedSlot.endTime)}</div></div>
                    <div><div className="text-muted text-sm">Price</div><div className="fw-bold text-green">NPR {selectedSlot.futsal?.hourlyPrice ?? '-'}</div></div>
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
              <div className={`alert alert-error ${bookingError ? 'show' : ''}`} aria-live="polite">
                <span>Error</span><span>{bookingError}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
              <button onClick={confirmBooking} className="btn btn-primary" disabled={bookingLoading}>
                {bookingLoading ? 'Processing payment...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

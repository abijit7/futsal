import { useEffect, useState } from 'react';
import { FutsalAPI } from '../../api/futsal.js';
import { SlotAPI } from '../../api/slot.js';
import { toDateInputValue } from '../../utils/date.js';
import { calculateDuration, formatDate, formatTime } from '../../utils/format.js';
import { useToast } from '../../components/ToastProvider.jsx';
import { useConfirm } from '../../components/ConfirmProvider.jsx';
import Pagination from '../../components/Pagination.jsx';
import TimeField from '../../components/TimeField.jsx';

export default function AdminSlots() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [futsals, setFutsals] = useState([]);
  const [slots, setSlots] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedFutsalId, setSelectedFutsalId] = useState(null);
  const [futsalsLoaded, setFutsalsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ slotDate: '', startTime: '', endTime: '', futsalId: '' });
  const [alert, setAlert] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generation, setGeneration] = useState({
    startDate: '',
    endDate: '',
    slotMinutes: 60,
    startTime: '',
    endTime: '',
    holidayDates: '',
    maintenanceDate: '',
    maintenanceStartTime: '',
    maintenanceEndTime: ''
  });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const todayStr = toDateInputValue();

  const loadFutsals = async () => {
    try {
      const data = await FutsalAPI.getAll({ page: 0, size: 200 });
      const items = data?.items ?? data ?? [];
      setFutsals(items);
      if (items.length > 0 && !selectedFutsalId) {
        setSelectedFutsalId(items[0].futsalId);
        setForm((prev) => ({ ...prev, futsalId: items[0].futsalId }));
      }
    } catch (err) {
      showToast(`Failed to load futsals: ${err.message}`, 'error');
      setLoading(false);
    } finally {
      setFutsalsLoaded(true);
    }
  };

  const loadSlots = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = { page: targetPage, size: pageSize };
      if (selectedFutsalId) {
        params.futsalId = selectedFutsalId;
      }
      const data = await SlotAPI.getAll(params);
      const items = data?.items ?? data ?? [];
      setSlots(items);
      setTotalPages(data?.totalPages ?? (items.length > 0 ? 1 : 0));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFutsals();
  }, []);

  useEffect(() => {
    if (futsalsLoaded) {
      loadSlots(page);
    }
  }, [futsalsLoaded, selectedFutsalId, page]);

  const hasFutsals = futsals.length > 0;
  const formFutsal = futsals.find((futsal) => futsal.futsalId === Number(form.futsalId));
  const generationFutsal = futsals.find((futsal) => futsal.futsalId === Number(selectedFutsalId));

  const resetForm = () => {
    setEditingId(null);
    setForm({ slotDate: '', startTime: '', endTime: '', futsalId: selectedFutsalId || '' });
    setAlert('');
  };

  const updateGeneration = (key, value) => {
    setGeneration((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert('');

    const validationError = validateSlotWindow(form.startTime, form.endTime, formFutsal, 'Slot');
    if (validationError) {
      setAlert(validationError);
      return;
    }

    setSubmitting(true);

    const payload = {
      futsalId: parseInt(form.futsalId, 10),
      slotDate: form.slotDate,
      startTime: `${form.startTime}:00`,
      endTime: `${form.endTime}:00`
    };
    if (!editingId) {
      payload.available = true;
    }

    try {
      if (editingId) {
        await SlotAPI.update(editingId, payload);
        showToast('Slot updated successfully.', 'success');
      } else {
        await SlotAPI.add(payload);
        showToast('Slot added successfully.', 'success');
      }
      resetForm();
      setPage(0);
      loadSlots(0);
    } catch (err) {
      setAlert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedFutsalId) {
      showToast('Select a futsal before generating slots.', 'error');
      return;
    }

    const generationValidationError = validateGenerationWindow(generation, generationFutsal);
    if (generationValidationError) {
      showToast(generationValidationError, 'error');
      return;
    }

    const maintenanceBlocks = generation.maintenanceDate && generation.maintenanceStartTime && generation.maintenanceEndTime
      ? [{
          date: generation.maintenanceDate,
          startTime: `${generation.maintenanceStartTime}:00`,
          endTime: `${generation.maintenanceEndTime}:00`
        }]
      : [];

    const holidayDates = generation.holidayDates
      .split(',')
      .map((date) => date.trim())
      .filter(Boolean);

    const payload = {
      futsalId: selectedFutsalId,
      startDate: generation.startDate,
      endDate: generation.endDate,
      slotMinutes: Number(generation.slotMinutes),
      startTime: generation.startTime ? `${generation.startTime}:00` : null,
      endTime: generation.endTime ? `${generation.endTime}:00` : null,
      holidayDates,
      maintenanceBlocks
    };

    try {
      setGenerating(true);
      const result = await SlotAPI.generate(payload);
      showToast(`Generated ${result.created} slots. Skipped ${result.skippedExisting} existing and ${result.skippedBlocked} blocked.`, 'success');
      setPage(0);
      loadSlots(0);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const editSlot = (slot) => {
    setEditingId(slot.slotId);
    setForm({
      futsalId: slot.futsal?.futsalId || '',
      slotDate: slot.slotDate,
      startTime: slot.startTime ? slot.startTime.substring(0, 5) : '',
      endTime: slot.endTime ? slot.endTime.substring(0, 5) : ''
    });
  };

  const deleteSlot = async (slotId) => {
    const ok = await confirm('Delete this slot? This cannot be undone.');
    if (!ok) return;
    try {
      await SlotAPI.delete(slotId);
      showToast('Slot deleted', 'success');
      loadSlots(page);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Manage <span>slots</span></h1>
          <p>Create availability, adjust session times, and keep court inventory current.</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="admin-grid">
          <div className="admin-side-stack">
            <div className="card admin-side">
              <div className="card-header"><h3>{editingId ? 'Edit Slot' : 'Add New Slot'}</h3></div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Futsal</label>
                  <select
                    className="form-control"
                    value={form.futsalId}
                    onChange={(e) => setForm((prev) => ({ ...prev, futsalId: e.target.value }))}
                    disabled={!hasFutsals}
                    required
                  >
                    {!hasFutsals && <option value="">No futsals available</option>}
                    {hasFutsals && <option value="" disabled>Select futsal</option>}
                    {futsals.map((f) => (
                      <option key={f.futsalId} value={f.futsalId}>{f.name} - {f.city}</option>
                    ))}
                  </select>
                  {formFutsal && (
                    <div className="form-hint">Venue hours: {venueHoursText(formFutsal)}</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" value={form.slotDate} min={todayStr} onChange={(e) => setForm((prev) => ({ ...prev, slotDate: e.target.value }))} disabled={!hasFutsals} required />
                </div>
                <div className="form-row">
                  <TimeField
                    id="slot-start-time"
                    label="Start Time"
                    value={form.startTime}
                    onChange={(value) => setForm((prev) => ({ ...prev, startTime: value }))}
                    disabled={!hasFutsals}
                    required
                  />
                  <TimeField
                    id="slot-end-time"
                    label="End Time"
                    value={form.endTime}
                    onChange={(value) => setForm((prev) => ({ ...prev, endTime: value }))}
                    disabled={!hasFutsals}
                    required
                  />
                </div>
                <div className={`alert alert-error ${alert ? 'show' : ''}`}>
                  <span>Error</span><span>{alert}</span>
                </div>
                <div className="toolbar-inline">
                  <button type="submit" className="btn btn-primary grow" disabled={submitting || !hasFutsals}>
                    {submitting ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add Slot')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={!hasFutsals}>Reset</button>
                </div>
              </form>
            </div>

            <div className="card admin-side">
              <div className="card-header"><h3>Bulk Generate</h3></div>
              <form onSubmit={handleGenerate}>
                <div className="form-group">
                  <label className="form-label">Futsal</label>
                  <select
                    className="form-control"
                    value={selectedFutsalId || ''}
                    onChange={(e) => {
                      setSelectedFutsalId(e.target.value ? parseInt(e.target.value, 10) : null);
                      setPage(0);
                    }}
                    disabled={!hasFutsals}
                    required
                  >
                    {!hasFutsals && <option value="">No futsals available</option>}
                    {hasFutsals && <option value="" disabled>Select futsal</option>}
                    {futsals.map((f) => (
                      <option key={f.futsalId} value={f.futsalId}>{f.name} - {f.city}</option>
                    ))}
                  </select>
                  {generationFutsal && (
                    <div className="form-hint">Generation must stay within venue hours: {venueHoursText(generationFutsal)}</div>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-control" value={generation.startDate} min={todayStr} onChange={(e) => updateGeneration('startDate', e.target.value)} disabled={!hasFutsals} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-control" value={generation.endDate} min={generation.startDate || todayStr} onChange={(e) => updateGeneration('endDate', e.target.value)} disabled={!hasFutsals} required />
                  </div>
                </div>
                <div className="form-row">
                  <TimeField
                    id="generate-start-time"
                    label="Start Time"
                    value={generation.startTime}
                    onChange={(value) => updateGeneration('startTime', value)}
                    disabled={!hasFutsals}
                  />
                  <TimeField
                    id="generate-end-time"
                    label="End Time"
                    value={generation.endTime}
                    onChange={(value) => updateGeneration('endTime', value)}
                    disabled={!hasFutsals}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Slot Duration</label>
                  <select className="form-control" value={generation.slotMinutes} onChange={(e) => updateGeneration('slotMinutes', e.target.value)} disabled={!hasFutsals}>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Holiday Dates</label>
                  <input className="form-control" value={generation.holidayDates} onChange={(e) => updateGeneration('holidayDates', e.target.value)} placeholder="2026-06-15, 2026-06-20" disabled={!hasFutsals} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Maintenance Date</label>
                    <input type="date" className="form-control" value={generation.maintenanceDate} min={todayStr} onChange={(e) => updateGeneration('maintenanceDate', e.target.value)} disabled={!hasFutsals} />
                  </div>
                  <TimeField
                    id="maintenance-start-time"
                    label="Block Start"
                    value={generation.maintenanceStartTime}
                    onChange={(value) => updateGeneration('maintenanceStartTime', value)}
                    disabled={!hasFutsals}
                  />
                  <TimeField
                    id="maintenance-end-time"
                    label="Block End"
                    value={generation.maintenanceEndTime}
                    onChange={(value) => updateGeneration('maintenanceEndTime', value)}
                    disabled={!hasFutsals}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={generating || !hasFutsals}>
                  {generating ? 'Generating...' : 'Generate Slots'}
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>All Slots</h3>
              <div className="toolbar-inline">
                <select
                  className="form-control"
                  value={selectedFutsalId || ''}
                  onChange={(e) => {
                    setSelectedFutsalId(e.target.value ? parseInt(e.target.value, 10) : null);
                    setPage(0);
                  }}
                >
                  <option value="">All Futsals</option>
                  {futsals.map((f) => (
                    <option key={f.futsalId} value={f.futsalId}>{f.name} - {f.city}</option>
                  ))}
                </select>
                <button onClick={() => loadSlots(page)} className="btn btn-secondary btn-sm">Refresh</button>
              </div>
            </div>

            {loading ? (
              <div className="loading-wrap"><div className="spinner"></div><p>Loading slots...</p></div>
            ) : slots.length === 0 ? (
              <div className="empty-state"><div className="icon">0</div><h3>No slots found</h3><p>Add your first slot using the form.</p></div>
            ) : (
              <div className="table-wrap">
                <table className="responsive-table">
                  <thead>
                    <tr><th>Futsal</th><th>Date</th><th>Start</th><th>End</th><th>Duration</th><th>Price/hr</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {slots.map((s) => (
                      <tr key={s.slotId}>
                        <td className="text-muted text-sm" data-label="Futsal">{s.futsal?.name || '-'}</td>
                        <td data-label="Date">{formatDate(s.slotDate)}</td>
                        <td data-label="Start">{formatTime(s.startTime)}</td>
                        <td data-label="End">{formatTime(s.endTime)}</td>
                        <td className="text-muted text-sm" data-label="Duration">{calculateDuration(s.startTime, s.endTime)}</td>
                        <td data-label="Price/hr" className="text-accent fw-bold">NPR {s.futsal?.hourlyPrice ?? '-'}</td>
                        <td data-label="Status">
                          <span className={`badge ${s.available ? 'badge-available' : 'badge-booked'}`}>
                            {s.available ? 'Available' : 'Booked'}
                          </span>
                        </td>
                        <td className="table-actions" data-label="Actions">
                          <div className="actions-row">
                            <button className="btn btn-secondary btn-sm" onClick={() => editSlot(s)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteSlot(s.slotId)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && slots.length > 0 && (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function venueHoursText(futsal) {
  const opening = futsal.openingTime ? formatTime(futsal.openingTime) : '-';
  const closing = futsal.closingTime ? formatTime(futsal.closingTime) : '-';
  return `${opening} - ${closing}`;
}

function validateGenerationWindow(generation, futsal) {
  if (!futsal) {
    return 'Select a futsal before generating slots.';
  }
  const startTime = generation.startTime || timeInputValue(futsal.openingTime);
  const endTime = generation.endTime || timeInputValue(futsal.closingTime);
  return validateSlotWindow(startTime, endTime, futsal, 'Generation window');
}

function validateSlotWindow(startTime, endTime, futsal, label) {
  if (!startTime || !endTime) {
    return `${label} requires both start and end time.`;
  }
  if (compareTimes(endTime, startTime) <= 0) {
    return `${label} end time must be after start time.`;
  }
  if (futsal?.openingTime && compareTimes(startTime, timeInputValue(futsal.openingTime)) < 0) {
    return `${label} starts before ${futsal.name} opens at ${formatTime(futsal.openingTime)}.`;
  }
  if (futsal?.closingTime && compareTimes(endTime, timeInputValue(futsal.closingTime)) > 0) {
    return `${label} ends after ${futsal.name} closes at ${formatTime(futsal.closingTime)}.`;
  }
  return '';
}

function compareTimes(left, right) {
  return timeMinutes(left) - timeMinutes(right);
}

function timeMinutes(value) {
  const [hours = 0, minutes = 0] = timeInputValue(value).split(':').map(Number);
  return (hours * 60) + minutes;
}

function timeInputValue(value) {
  return value ? value.substring(0, 5) : '';
}

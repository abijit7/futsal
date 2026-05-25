import { useEffect, useState } from 'react';
import { FutsalAPI } from '../../api/futsal.js';
import { SlotAPI } from '../../api/slot.js';
import { calculateDuration, formatDate, formatTime } from '../../utils/format.js';
import { useToast } from '../../components/ToastProvider.jsx';
import { useConfirm } from '../../components/ConfirmProvider.jsx';

export default function AdminSlots() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [futsals, setFutsals] = useState([]);
  const [slots, setSlots] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedFutsalId, setSelectedFutsalId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ slotDate: '', startTime: '', endTime: '', futsalId: '' });
  const [alert, setAlert] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadFutsals = async () => {
    try {
      const data = await FutsalAPI.getAll();
      setFutsals(data || []);
      if (data && data.length > 0 && !selectedFutsalId) {
        setSelectedFutsalId(data[0].futsalId);
        setForm((prev) => ({ ...prev, futsalId: data[0].futsalId }));
      }
    } catch (err) {
      showToast(`Failed to load futsals: ${err.message}`, 'error');
    }
  };

  const loadSlots = async () => {
    try {
      setLoading(true);
      const data = await SlotAPI.getAll(selectedFutsalId);
      setSlots(data || []);
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
    if (selectedFutsalId !== null) {
      loadSlots();
    }
  }, [selectedFutsalId]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ slotDate: '', startTime: '', endTime: '', futsalId: selectedFutsalId || '' });
    setAlert('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert('');
    setSubmitting(true);

    const payload = {
      futsalId: parseInt(form.futsalId, 10),
      slotDate: form.slotDate,
      startTime: `${form.startTime}:00`,
      endTime: `${form.endTime}:00`,
      available: true
    };

    try {
      if (editingId) {
        await SlotAPI.update(editingId, payload);
        showToast('Slot updated successfully ✅', 'success');
      } else {
        await SlotAPI.add(payload);
        showToast('Slot added successfully ✅', 'success');
      }
      resetForm();
      loadSlots();
    } catch (err) {
      setAlert(err.message);
    } finally {
      setSubmitting(false);
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
      loadSlots();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>MANAGE <span>SLOTS</span></h1>
          <p>Add, edit, and remove available time slots</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <div className="card-header"><h3>{editingId ? 'Edit Slot' : 'Add New Slot'}</h3></div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Futsal</label>
                <select
                  className="form-control"
                  value={form.futsalId}
                  onChange={(e) => setForm((prev) => ({ ...prev, futsalId: e.target.value }))}
                  required
                >
                  {futsals.map((f) => (
                    <option key={f.futsalId} value={f.futsalId}>{f.name} — {f.city}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={form.slotDate} min={todayStr} onChange={(e) => setForm((prev) => ({ ...prev, slotDate: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-control" value={form.startTime} onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-control" value={form.endTime} onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))} required />
                </div>
              </div>
              <div className={`alert alert-error ${alert ? 'show' : ''}`}>
                <span>⚠️</span><span>{alert}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add Slot')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Reset</button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>All Slots</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  className="form-control"
                  style={{ minWidth: 220 }}
                  value={selectedFutsalId || ''}
                  onChange={(e) => setSelectedFutsalId(e.target.value ? parseInt(e.target.value, 10) : null)}
                >
                  <option value="">All Futsals</option>
                  {futsals.map((f) => (
                    <option key={f.futsalId} value={f.futsalId}>{f.name} — {f.city}</option>
                  ))}
                </select>
                <button onClick={loadSlots} className="btn btn-secondary btn-sm">🔄 Refresh</button>
              </div>
            </div>

            {loading ? (
              <div className="loading-wrap"><div className="spinner"></div><p>Loading slots...</p></div>
            ) : slots.length === 0 ? (
              <div className="empty-state"><div className="icon">📭</div><h3>No slots found</h3><p>Add your first slot using the form.</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Futsal</th><th>Date</th><th>Start</th><th>End</th><th>Duration</th><th>Price/hr</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {slots.map((s) => (
                      <tr key={s.slotId}>
                        <td className="text-muted text-sm">{s.futsal?.name || '—'}</td>
                        <td>{formatDate(s.slotDate)}</td>
                        <td>{formatTime(s.startTime)}</td>
                        <td>{formatTime(s.endTime)}</td>
                        <td className="text-muted text-sm">{calculateDuration(s.startTime, s.endTime)}</td>
                        <td style={{ color: 'var(--accent)', fontWeight: 600 }}>NPR {s.futsal?.hourlyPrice ?? '—'}</td>
                        <td>
                          <span className={`badge ${s.available ? 'badge-available' : 'badge-booked'}`}>
                            {s.available ? 'Available' : 'Booked'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => editSlot(s)}>✏️ Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteSlot(s.slotId)}>🗑️</button>
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
      </div>
    </>
  );
}


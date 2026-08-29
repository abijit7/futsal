import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Pencil, Plus, Trash2, Wand2, X } from 'lucide-react';
import { futsalApi, slotApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, LoadingState } from '../../components/State';
import { StatusBadge } from '../../components/StatusBadge';
import type { Futsal, SlotGenerationPayload, TimeSlot, TimeSlotPayload } from '../../types/api';
import { formatDate, formatTimeCompact, slotDuration, timeRange, todayInput } from '../../utils/format';

const initial: TimeSlotPayload = {
  futsalId: 0,
  slotDate: todayInput(),
  startTime: '06:00:00',
  endTime: '07:00:00',
  available: true
};

const initialGeneration: SlotGenerationPayload = {
  futsalId: 0,
  startDate: todayInput(),
  endDate: todayInput(),
  startTime: '',
  endTime: '',
  slotMinutes: 60,
  holidayDates: []
};

export function AdminSlots() {
  const [futsals, setFutsals] = useState<Futsal[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedFutsalId, setSelectedFutsalId] = useState(0);
  const [form, setForm] = useState<TimeSlotPayload>(initial);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState(todayInput());
  const [generation, setGeneration] = useState<SlotGenerationPayload>(initialGeneration);
  const [holidayInput, setHolidayInput] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingHourly, setGeneratingHourly] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeSlot | null>(null);
  const [modal, setModal] = useState<'slot' | 'bulk' | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedFutsal = useMemo(
    () => futsals.find((item) => item.futsalId === selectedFutsalId),
    [futsals, selectedFutsalId]
  );
  const availableCount = useMemo(() => slots.filter((slot) => slot.available).length, [slots]);
  const bookedCount = slots.length - availableCount;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [futsalData, slotData] = await Promise.all([
        futsalApi.list({ page: 0, size: 200 }),
        slotApi.all({ futsalId: selectedFutsalId || undefined, slotDate: filterDate, page, size: 24 })
      ]);
      const venues = futsalData.items || [];
      const nextFutsalId = selectedFutsalId || venues[0]?.futsalId || 0;

      setFutsals(venues);
      setSlots(slotData.items || []);
      setTotalPages(slotData.totalPages || 0);

      if (!selectedFutsalId && nextFutsalId) {
        setSelectedFutsalId(nextFutsalId);
      }
      if (!form.futsalId && nextFutsalId) {
        setForm((prev) => ({ ...prev, futsalId: nextFutsalId }));
      }
      if (!generation.futsalId && nextFutsalId) {
        setGeneration((prev) => ({ ...prev, futsalId: nextFutsalId }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, filterDate, selectedFutsalId]);

  const setSelectedFutsal = (futsalId: number) => {
    setSelectedFutsalId(futsalId);
    setForm((prev) => ({ ...prev, futsalId }));
    setGeneration((prev) => ({ ...prev, futsalId }));
    setPage(0);
  };

  const setSelectedFilterDate = (slotDate: string) => {
    setFilterDate(slotDate);
    setGeneration((prev) => ({ ...prev, startDate: slotDate, endDate: slotDate }));
    setPage(0);
  };

  const openCreateSlot = () => {
    const futsalId = selectedFutsalId || futsals[0]?.futsalId || 0;
    setEditingId(null);
    setForm({ ...initial, futsalId, slotDate: filterDate, available: true });
    setError('');
    setMessage('');
    setModal('slot');
  };

  const openBulkGenerator = () => {
    const futsalId = selectedFutsalId || futsals[0]?.futsalId || 0;
    setGeneration({ ...initialGeneration, futsalId, startDate: filterDate, endDate: filterDate });
    setHolidayInput('');
    setError('');
    setMessage('');
    setModal('bulk');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const payload: TimeSlotPayload = {
        ...form,
        available: editingId ? form.available : true
      };
      if (editingId) await slotApi.update(editingId, payload);
      else await slotApi.create(payload);
      setMessage(editingId ? 'Slot updated.' : 'Slot created.');
      setEditingId(null);
      setModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slot save failed');
    } finally {
      setSaving(false);
    }
  };

  const generate = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setGenerating(true);
    try {
      const payload: SlotGenerationPayload = {
        ...generation,
        startTime: generation.startTime || undefined,
        endTime: generation.endTime || undefined,
        holidayDates: splitDates(holidayInput)
      };
      const result = await slotApi.generate(payload);
      setMessage(`Generated ${result.created} slots. Skipped ${result.skippedExisting} existing and ${result.skippedBlocked} blocked.`);
      setModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slot generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const generateHourlyForFilterDate = async () => {
    const futsalId = selectedFutsalId || generation.futsalId || futsals[0]?.futsalId;
    if (!futsalId) {
      setError('Select a futsal before generating hourly slots.');
      return;
    }
    setGeneratingHourly(true);
    setError('');
    setMessage('');
    try {
      const result = await slotApi.generate({
        futsalId,
        startDate: filterDate,
        endDate: filterDate,
        slotMinutes: 60,
        holidayDates: [],
        maintenanceBlocks: []
      });
      setMessage(`Hourly generation complete for ${formatDate(filterDate)}: created ${result.created}, skipped ${result.skippedExisting} existing and ${result.skippedBlocked} blocked.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hourly slot generation failed');
    } finally {
      setGeneratingHourly(false);
    }
  };

  const edit = (slot: TimeSlot) => {
    const futsalId = slot.futsal?.futsalId || selectedFutsalId || futsals[0]?.futsalId || 0;
    setEditingId(slot.slotId);
    setForm({
      futsalId,
      slotDate: slot.slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: slot.available
    });
    setError('');
    setMessage('');
    setModal('slot');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.slotId);
    setError('');
    setMessage('');
    try {
      await slotApi.delete(deleteTarget.slotId);
      setMessage('Slot deleted.');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slot delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="panel overflow-hidden">
        <div className="border-b border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="eyebrow">Slot operations</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Schedule manager</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {selectedFutsal ? selectedFutsal.name : 'Select a venue'} - {formatDate(filterDate)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(210px,280px)_180px_auto_auto_auto] xl:items-end">
              <div>
                <label className="label" htmlFor="slot-venue">Venue</label>
                <select
                  id="slot-venue"
                  className="input py-2.5"
                  value={selectedFutsalId}
                  onChange={(event) => setSelectedFutsal(Number(event.target.value))}
                >
                  {futsals.length === 0 && <option value={0}>No venues</option>}
                  {futsals.map((item) => (
                    <option key={item.futsalId} value={item.futsalId}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="slot-date">Date</label>
                <input
                  id="slot-date"
                  className="input py-2.5"
                  type="date"
                  value={filterDate}
                  onChange={(event) => setSelectedFilterDate(event.target.value)}
                />
              </div>
              <button type="button" className="btn-soft px-3 py-2 text-sm" onClick={openBulkGenerator} disabled={!selectedFutsalId}>
                <Wand2 size={16} /> Bulk
              </button>
              <button type="button" className="btn-soft px-3 py-2 text-sm" disabled={generatingHourly || !selectedFutsalId} onClick={generateHourlyForFilterDate}>
                <Clock3 size={16} /> {generatingHourly ? 'Generating' : 'Hourly'}
              </button>
              <button type="button" className="btn-primary px-3 py-2 text-sm" onClick={openCreateSlot} disabled={!selectedFutsalId}>
                <Plus size={16} /> Add slot
              </button>
            </div>
          </div>

          {(message || error) && (
            <div className="mt-4 grid gap-2">
              {message && <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</p>}
              {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
            </div>
          )}
        </div>

        <div className="grid gap-4 border-b border-slate-200 bg-slate-50/70 p-5 sm:grid-cols-3">
          <Stat label="Total slots" value={slots.length} />
          <Stat label="Available" value={availableCount} tone="green" />
          <Stat label="Booked / blocked" value={bookedCount} />
        </div>

        <div className="p-5">
          <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <CalendarDays size={18} className="text-green-600" />
                Calendar overview
              </div>
              <div className="text-xs font-bold text-slate-500">Green is available. Gray is booked or blocked.</div>
            </div>
            {loading ? (
              <div className="mt-4"><LoadingState /></div>
            ) : slots.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm font-bold text-slate-500">
                No slots on this date.
              </div>
            ) : (
              <div className="motion-stagger mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                {slots.map((slot) => (
                  <button
                    key={slot.slotId}
                    type="button"
                    className={`rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${
                      slot.available
                        ? 'border-green-200 bg-green-50 text-green-700 hover:border-green-300'
                        : 'border-slate-200 bg-slate-100 text-slate-500'
                    }`}
                    onClick={() => edit(slot)}
                  >
                    <span className="block text-sm font-black">{formatTimeCompact(slot.startTime)}</span>
                    <span className="mt-1 block text-xs font-bold">{slot.available ? 'Available' : 'Booked'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <LoadingState />
          ) : slots.length === 0 ? (
            <EmptyState title="No slots found" />
          ) : (
            <div className="motion-stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {slots.map((slot) => (
                <article key={slot.slotId} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-lg font-black text-slate-950">
                        <Clock3 size={18} className="text-green-600" />
                        {timeRange(slot.startTime, slot.endTime)}
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {slotDuration(slot.startTime, slot.endTime) || 'Custom duration'} - {formatDate(slot.slotDate)}
                      </p>
                    </div>
                    <StatusBadge status={slot.available ? 'AVAILABLE' : 'UNAVAILABLE'} label={slot.available ? 'Available' : 'Booked'} />
                  </div>
                  <p className="mt-4 truncate text-sm font-bold text-slate-600">{slot.futsal?.name || 'Futsal'}</p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="btn-soft flex-1 px-3 py-2 text-sm" onClick={() => edit(slot)}>
                      <Pencil size={15} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn-navy flex-1 px-3 py-2 text-sm"
                      disabled={deletingId === slot.slotId}
                      onClick={() => setDeleteTarget(slot)}
                    >
                      <Trash2 size={15} /> {deletingId === slot.slotId ? 'Deleting' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      {modal === 'slot' && (
        <div className="admin-modal-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4">
          <form className="admin-modal-panel relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl" onSubmit={submit}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="eyebrow">{editingId ? 'Edit slot' : 'New slot'}</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">{editingId ? 'Update slot' : 'Add slot'}</h3>
              </div>
              <button type="button" className="btn-soft h-10 w-10 rounded-2xl p-0" onClick={() => setModal(null)} aria-label="Close slot form">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 px-5 py-5">
              <div>
                <label className="label">Venue</label>
                <select className="input py-2.5" value={form.futsalId} onChange={(event) => setForm({ ...form, futsalId: Number(event.target.value) })} required>
                  {futsals.map((item) => (
                    <option key={item.futsalId} value={item.futsalId}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input className="input py-2.5" type="date" min={todayInput()} value={form.slotDate} onChange={(event) => setForm({ ...form, slotDate: event.target.value })} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Start</label>
                  <input className="input py-2.5" type="time" value={toTimeInput(form.startTime)} onChange={(event) => setForm({ ...form, startTime: withSeconds(event.target.value) })} required />
                </div>
                <div>
                  <label className="label">End</label>
                  <input className="input py-2.5" type="time" value={toTimeInput(form.endTime)} onChange={(event) => setForm({ ...form, endTime: withSeconds(event.target.value) })} required />
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                Availability is controlled by booking state. Editing keeps the current slot status.
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
              <button type="button" className="btn-soft px-4 py-2 text-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary px-4 py-2 text-sm" disabled={saving}>
                {saving ? 'Saving' : editingId ? 'Update slot' : 'Create slot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'bulk' && (
        <div className="admin-modal-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4">
          <form className="admin-modal-panel relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl" onSubmit={generate}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="eyebrow">Bulk slots</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">Generate schedule</h3>
              </div>
              <button type="button" className="btn-soft h-10 w-10 rounded-2xl p-0" onClick={() => setModal(null)} aria-label="Close generator">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 px-5 py-5">
              <div>
                <label className="label">Venue</label>
                <select className="input py-2.5" value={generation.futsalId} onChange={(event) => setGeneration({ ...generation, futsalId: Number(event.target.value) })} required>
                  {futsals.map((item) => (
                    <option key={item.futsalId} value={item.futsalId}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Start date</label>
                  <input className="input py-2.5" type="date" min={todayInput()} value={generation.startDate} onChange={(event) => setGeneration({ ...generation, startDate: event.target.value })} required />
                </div>
                <div>
                  <label className="label">End date</label>
                  <input className="input py-2.5" type="date" min={generation.startDate} value={generation.endDate} onChange={(event) => setGeneration({ ...generation, endDate: event.target.value })} required />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Start</label>
                  <input className="input py-2.5" type="time" value={toTimeInput(generation.startTime)} onChange={(event) => setGeneration({ ...generation, startTime: event.target.value ? withSeconds(event.target.value) : '' })} />
                </div>
                <div>
                  <label className="label">End</label>
                  <input className="input py-2.5" type="time" value={toTimeInput(generation.endTime)} onChange={(event) => setGeneration({ ...generation, endTime: event.target.value ? withSeconds(event.target.value) : '' })} />
                </div>
                <div>
                  <label className="label">Minutes</label>
                  <input className="input py-2.5" type="number" min={15} max={240} step={15} value={generation.slotMinutes} onChange={(event) => setGeneration({ ...generation, slotMinutes: Number(event.target.value) })} />
                </div>
              </div>
              <div>
                <label className="label">Holiday dates</label>
                <input className="input py-2.5" value={holidayInput} onChange={(event) => setHolidayInput(event.target.value)} placeholder="2026-07-01, 2026-07-04" />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
              <button type="button" className="btn-soft px-4 py-2 text-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-navy px-4 py-2 text-sm" disabled={generating}>
                {generating ? 'Generating' : 'Generate slots'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-modal-backdrop fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div className="admin-modal-panel w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Delete slot</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">Remove this slot?</h3>
              </div>
              <button type="button" className="btn-soft h-10 w-10 rounded-2xl p-0" onClick={() => setDeleteTarget(null)} aria-label="Close delete confirmation">
                <X size={20} />
              </button>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">
              {formatDate(deleteTarget.slotDate)} - {timeRange(deleteTarget.startTime, deleteTarget.endTime)}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="btn-soft px-4 py-2 text-sm" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="btn-navy px-4 py-2 text-sm" disabled={deletingId === deleteTarget.slotId} onClick={confirmDelete}>
                {deletingId === deleteTarget.slotId ? 'Deleting' : 'Delete slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'green' }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tone === 'green' ? 'text-green-600' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}

function splitDates(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function toTimeInput(value?: string) {
  return (value || '').slice(0, 5);
}

function withSeconds(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

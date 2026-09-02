import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Plus, Trash2, Wand2, X } from 'lucide-react';
import { futsalApi, slotApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, LoadingState } from '../../components/State';
import { Button, DialogFrame, IconButton, ModalShell } from '../../components/UI';
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
      <div className="admin-card overflow-hidden">
        <div className="border-b border-slate-200 bg-white p-5">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Schedule manager</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {selectedFutsal ? selectedFutsal.name : 'Select a venue'} · {formatDate(filterDate)}
              </p>
            </div>
            {/* Filters and actions are separate rows: five controls in one grid row collapsed
                badly at every width between sm and xl. */}
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px] xl:w-auto xl:grid-cols-[240px_180px]">
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
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={openBulkGenerator} disabled={!selectedFutsalId}>
                  <Wand2 size={16} /> Bulk generate
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={generatingHourly || !selectedFutsalId} onClick={generateHourlyForFilterDate}>
                  <Clock3 size={16} /> {generatingHourly ? 'Generating…' : 'Hourly'}
                </Button>
                <Button type="button" size="sm" onClick={openCreateSlot} disabled={!selectedFutsalId}>
                  <Plus size={16} /> Add slot
                </Button>
              </div>
            </div>
          </div>

          {(message || error) && (
            <div className="mt-4 grid gap-2" aria-live="polite">
              {message && <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</p>}
              {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700" aria-live="assertive">{error}</p>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 border-b border-slate-200 bg-slate-50/70 p-4">
          <Stat label="Total slots" value={slots.length} />
          <Stat label="Available" value={availableCount} tone="green" />
          <Stat label="Booked" value={bookedCount} />
        </div>

        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CalendarDays size={17} className="text-green-600" aria-hidden="true" />
              Schedule for {formatDate(filterDate)}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-green-200 bg-green-50" aria-hidden="true" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-slate-300 bg-slate-100" aria-hidden="true" /> Booked or blocked
              </span>
            </div>
          </div>

          {/* One grid, not two: this page used to render the same slots as a button grid AND
              again as a card list below it. */}
          {loading ? (
            <LoadingState label="Loading schedule" />
          ) : slots.length === 0 ? (
            <EmptyState
              title="No slots on this date"
              description="Add a single slot, or bulk-generate a schedule from the venue's opening hours."
            />
          ) : (
            <div className="motion-stagger grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" aria-live="polite">
              {slots.map((slot) => (
                <div
                  key={slot.slotId}
                  className={`group relative rounded-xl border transition hover:shadow-sm ${
                    slot.available ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => edit(slot)}
                    className="w-full rounded-xl p-3 pr-8 text-left focus:outline-none focus:ring-4 focus:ring-green-100"
                    aria-label={`Edit slot ${timeRange(slot.startTime, slot.endTime)}, ${slot.available ? 'available' : 'booked'}`}
                  >
                    <span className={`block text-sm font-bold tabular-nums ${slot.available ? 'text-green-800' : 'text-slate-700'}`}>
                      {formatTimeCompact(slot.startTime)}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                      {slotDuration(slot.startTime, slot.endTime) || timeRange(slot.startTime, slot.endTime)}
                    </span>
                    <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      slot.available ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-700'
                    }`}>
                      {slot.available ? 'Available' : 'Booked'}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete slot ${timeRange(slot.startTime, slot.endTime)}`}
                    disabled={deletingId === slot.slotId}
                    onClick={() => setDeleteTarget(slot)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      {modal === 'slot' && (
        <DialogFrame onClose={() => setModal(null)} className="max-w-lg">
          <form className="overflow-hidden rounded-2xl bg-white shadow-2xl" onSubmit={submit}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="eyebrow">{editingId ? 'Edit slot' : 'New slot'}</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{editingId ? 'Update slot' : 'Add slot'}</h3>
              </div>
              <IconButton label="Close slot form" onClick={() => setModal(null)}>
                <X size={20} />
              </IconButton>
            </div>
            <div className="grid gap-4 px-5 py-5">
              <label className="block"><span className="label">Venue</span><select className="input py-2.5" value={form.futsalId} onChange={(event) => setForm({ ...form, futsalId: Number(event.target.value) })} required>
                  {futsals.map((item) => (
                    <option key={item.futsalId} value={item.futsalId}>{item.name}</option>
                  ))}
                </select></label>
              <label className="block"><span className="label">Date</span><input className="input py-2.5" type="date" min={todayInput()} value={form.slotDate} onChange={(event) => setForm({ ...form, slotDate: event.target.value })} required /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="label">Start</span><input className="input py-2.5" type="time" value={toTimeInput(form.startTime)} onChange={(event) => setForm({ ...form, startTime: withSeconds(event.target.value) })} required /></label>
                <label className="block"><span className="label">End</span><input className="input py-2.5" type="time" value={toTimeInput(form.endTime)} onChange={(event) => setForm({ ...form, endTime: withSeconds(event.target.value) })} required /></label>
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
        </DialogFrame>
      )}

      {modal === 'bulk' && (
        <DialogFrame onClose={() => setModal(null)} className="max-w-xl">
          <form className="overflow-hidden rounded-2xl bg-white shadow-2xl" onSubmit={generate}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="eyebrow">Bulk slots</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Generate schedule</h3>
              </div>
              <IconButton label="Close generator" onClick={() => setModal(null)}>
                <X size={20} />
              </IconButton>
            </div>
            <div className="grid gap-4 px-5 py-5">
              <label className="block"><span className="label">Venue</span><select className="input py-2.5" value={generation.futsalId} onChange={(event) => setGeneration({ ...generation, futsalId: Number(event.target.value) })} required>
                  {futsals.map((item) => (
                    <option key={item.futsalId} value={item.futsalId}>{item.name}</option>
                  ))}
                </select></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="label">Start date</span><input className="input py-2.5" type="date" min={todayInput()} value={generation.startDate} onChange={(event) => setGeneration({ ...generation, startDate: event.target.value })} required /></label>
                <label className="block"><span className="label">End date</span><input className="input py-2.5" type="date" min={generation.startDate} value={generation.endDate} onChange={(event) => setGeneration({ ...generation, endDate: event.target.value })} required /></label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Start <span className="text-sm font-normal text-slate-500">(optional)</span></label>
                  <input className="input py-2.5" type="time" value={toTimeInput(generation.startTime)} onChange={(event) => setGeneration({ ...generation, startTime: event.target.value ? withSeconds(event.target.value) : '' })} />
                </div>
                <div>
                  <label className="label">End <span className="text-sm font-normal text-slate-500">(optional)</span></label>
                  <input className="input py-2.5" type="time" value={toTimeInput(generation.endTime)} onChange={(event) => setGeneration({ ...generation, endTime: event.target.value ? withSeconds(event.target.value) : '' })} />
                </div>
                <label className="block"><span className="label">Minutes</span><input className="input py-2.5" type="number" min={15} max={240} step={15} value={generation.slotMinutes} onChange={(event) => setGeneration({ ...generation, slotMinutes: Number(event.target.value) })} /></label>
              </div>
              <label className="block"><span className="label">Holiday dates</span><input className="input py-2.5" value={holidayInput} onChange={(event) => setHolidayInput(event.target.value)} placeholder="2026-07-01, 2026-07-04" /></label>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
              <button type="button" className="btn-soft px-4 py-2 text-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-navy px-4 py-2 text-sm" disabled={generating}>
                {generating ? 'Generating' : 'Generate slots'}
              </button>
            </div>
          </form>
        </DialogFrame>
      )}

      {deleteTarget && (
        <ModalShell
          title="Remove this slot?"
          eyebrow="Delete slot"
          onClose={() => setDeleteTarget(null)}
          maxWidth="max-w-md"
          footer={(
            <>
              <Button type="button" variant="outline" disabled={deletingId !== null} onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button type="button" variant="destructive" loading={deletingId === deleteTarget.slotId} onClick={confirmDelete}>Delete slot</Button>
            </>
          )}
        >
          <p className="text-sm font-semibold text-slate-600">
            {formatDate(deleteTarget.slotDate)} - {timeRange(deleteTarget.startTime, deleteTarget.endTime)}
          </p>
        </ModalShell>
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'green' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${tone === 'green' ? 'text-green-700' : 'text-slate-900'}`}>{value}</p>
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

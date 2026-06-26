import { FormEvent, useEffect, useState } from 'react';
import { futsalApi, slotApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, LoadingState } from '../../components/State';
import { TimeField } from '../../components/TimeField';
import type { Futsal, SlotGenerationPayload, TimeSlot, TimeSlotPayload } from '../../types/api';
import { formatDate, timeRangeWithDuration, todayInput } from '../../utils/format';

const initial: TimeSlotPayload = { futsalId: 0, slotDate: todayInput(), startTime: '06:00:00', endTime: '07:00:00', available: true };
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
  const [form, setForm] = useState<TimeSlotPayload>(initial);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState(todayInput());
  const [generation, setGeneration] = useState<SlotGenerationPayload>(initialGeneration);
  const [holidayInput, setHolidayInput] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generatingHourly, setGeneratingHourly] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const [futsalData, slotData] = await Promise.all([
      futsalApi.list({ page: 0, size: 200 }),
      slotApi.all({ futsalId: form.futsalId || undefined, slotDate: filterDate, page, size: 24 })
    ]);
    const venues = futsalData.items || [];
    setFutsals(venues);
    setSlots(slotData.items || []);
    setTotalPages(slotData.totalPages || 0);
    if (!form.futsalId && venues[0]) {
      setForm((prev) => ({ ...prev, futsalId: venues[0].futsalId }));
      setGeneration((prev) => ({ ...prev, futsalId: venues[0].futsalId }));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [page, filterDate, form.futsalId]);

  const setSelectedFutsal = (futsalId: number) => {
    setForm((prev) => ({ ...prev, futsalId }));
    setGeneration((prev) => ({ ...prev, futsalId }));
    setPage(0);
  };

  const setSelectedFilterDate = (slotDate: string) => {
    setFilterDate(slotDate);
    setGeneration((prev) => ({ ...prev, startDate: slotDate, endDate: slotDate }));
    setPage(0);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingId) await slotApi.update(editingId, form);
      else await slotApi.create(form);
      setEditingId(null);
      setMessage(editingId ? 'Slot updated.' : 'Slot created.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slot save failed');
    }
  };

  const generate = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const payload: SlotGenerationPayload = {
        ...generation,
        startTime: generation.startTime || undefined,
        endTime: generation.endTime || undefined,
        holidayDates: splitDates(holidayInput)
      };
      const result = await slotApi.generate(payload);
      setMessage(`Generated ${result.created} slots. Skipped ${result.skippedExisting} existing and ${result.skippedBlocked} blocked.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slot generation failed');
    }
  };

  const generateHourlyForFilterDate = async () => {
    const futsalId = form.futsalId || generation.futsalId || futsals[0]?.futsalId;
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
    setEditingId(slot.slotId);
    setForm({ futsalId: slot.futsal?.futsalId || form.futsalId, slotDate: slot.slotDate, startTime: slot.startTime, endTime: slot.endTime, available: slot.available });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this slot?')) return;
    await slotApi.delete(id);
    await load();
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[410px_1fr]">
      <div className="grid h-max gap-6">
      <form className="panel p-6" onSubmit={submit}>
        <h2 className="text-2xl font-black text-slate-950">{editingId ? 'Edit slot' : 'Add one slot'}</h2>
        {message && <p className="mt-3 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{message}</p>}
        {error && <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        <div className="mt-5 grid gap-4">
          <div><label className="label">Futsal</label><select className="input" value={form.futsalId} onChange={(e) => setSelectedFutsal(Number(e.target.value))}>{futsals.map((item) => <option key={item.futsalId} value={item.futsalId}>{item.name}</option>)}</select></div>
          <div><label className="label">Date</label><input className="input" type="date" min={todayInput()} value={form.slotDate} onChange={(e) => setForm({ ...form, slotDate: e.target.value })} /></div>
          <TimeField label="Start time" value={form.startTime} onChange={(value) => setForm({ ...form, startTime: value })} />
          <TimeField label="End time" value={form.endTime} onChange={(value) => setForm({ ...form, endTime: value })} />
          <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 font-bold text-slate-700"><span>Available</span><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /></label>
        </div>
        <div className="mt-6 flex gap-2"><button className="btn-primary flex-1">{editingId ? 'Update slot' : 'Create slot'}</button>{editingId && <button type="button" className="btn-soft" onClick={() => setEditingId(null)}>Cancel</button>}</div>
      </form>

      <form className="panel p-6" onSubmit={generate}>
        <h2 className="text-xl font-black text-slate-950">Bulk generate slots</h2>
        <p className="mt-1 text-sm text-slate-500">Uses venue hours by default. Optional times narrow the window.</p>
        <div className="mt-5 grid gap-4">
          <div><label className="label">Futsal</label><select className="input" value={generation.futsalId} onChange={(e) => setSelectedFutsal(Number(e.target.value))}>{futsals.map((item) => <option key={item.futsalId} value={item.futsalId}>{item.name}</option>)}</select></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Start date</label><input className="input" type="date" min={todayInput()} value={generation.startDate} onChange={(e) => setGeneration({ ...generation, startDate: e.target.value })} required /></div>
            <div><label className="label">End date</label><input className="input" type="date" min={generation.startDate} value={generation.endDate} onChange={(e) => setGeneration({ ...generation, endDate: e.target.value })} required /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Start time optional</label><input className="input" type="time" value={toTimeInput(generation.startTime)} onChange={(e) => setGeneration({ ...generation, startTime: e.target.value ? withSeconds(e.target.value) : '' })} /></div>
            <div><label className="label">End time optional</label><input className="input" type="time" value={toTimeInput(generation.endTime)} onChange={(e) => setGeneration({ ...generation, endTime: e.target.value ? withSeconds(e.target.value) : '' })} /></div>
          </div>
          <div><label className="label">Slot duration minutes</label><input className="input" type="number" min={15} max={240} step={15} value={generation.slotMinutes} onChange={(e) => setGeneration({ ...generation, slotMinutes: Number(e.target.value) })} /></div>
          <div><label className="label">Holiday dates</label><input className="input" value={holidayInput} onChange={(e) => setHolidayInput(e.target.value)} placeholder="2026-07-01, 2026-07-04" /></div>
        </div>
        <button className="btn-navy mt-6 w-full">Generate slots</button>
      </form>
      </div>
      <div>
        <div className="panel mb-4 grid gap-3 p-4 md:grid-cols-[minmax(220px,320px)_auto] md:items-end">
          <div><label className="label">Filter date</label><input className="input" type="date" value={filterDate} onChange={(e) => setSelectedFilterDate(e.target.value)} /></div>
          <button type="button" className="btn-primary md:justify-self-start" disabled={generatingHourly} onClick={generateHourlyForFilterDate}>{generatingHourly ? 'Generating...' : 'Generate hourly slots for this date'}</button>
        </div>
        {loading ? <LoadingState /> : slots.length === 0 ? <EmptyState title="No slots found" /> : <div className="grid gap-3">{slots.map((slot) => <div key={slot.slotId} className="panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"><div><div className="font-black text-slate-950">{slot.futsal?.name || 'Futsal'} · {formatDate(slot.slotDate)}</div><div className="text-sm font-bold text-slate-500">{timeRangeWithDuration(slot.startTime, slot.endTime)} · {slot.available ? 'Available' : 'Booked/unavailable'}</div></div><div className="flex gap-2"><button className="btn-soft px-4 py-2" onClick={() => edit(slot)}>Edit</button><button className="btn-navy px-4 py-2" onClick={() => remove(slot.slotId)}>Delete</button></div></div>)}</div>}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </section>
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

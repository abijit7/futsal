import { FormEvent, useEffect, useState } from 'react';
import { futsalApi, slotApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, LoadingState } from '../../components/State';
import { TimeField } from '../../components/TimeField';
import type { Futsal, TimeSlot, TimeSlotPayload } from '../../types/api';
import { formatDate, timeRange, todayInput } from '../../utils/format';

const initial: TimeSlotPayload = { futsalId: 0, slotDate: todayInput(), startTime: '06:00:00', endTime: '07:00:00', available: true };

export function AdminSlots() {
  const [futsals, setFutsals] = useState<Futsal[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [form, setForm] = useState<TimeSlotPayload>(initial);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState(todayInput());
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const [futsalData, slotData] = await Promise.all([
      futsalApi.list({ page: 0, size: 200 }),
      slotApi.all({ futsalId: form.futsalId || undefined, slotDate: filterDate, page, size: 10 })
    ]);
    const venues = futsalData.items || [];
    setFutsals(venues);
    setSlots(slotData.items || []);
    setTotalPages(slotData.totalPages || 0);
    if (!form.futsalId && venues[0]) setForm((prev) => ({ ...prev, futsalId: venues[0].futsalId }));
    setLoading(false);
  };
  useEffect(() => { load(); }, [page, filterDate, form.futsalId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (editingId) await slotApi.update(editingId, form);
      else await slotApi.create(form);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slot save failed');
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
    <section className="grid gap-6 xl:grid-cols-[390px_1fr]">
      <form className="panel h-max p-6" onSubmit={submit}>
        <h2 className="text-2xl font-black text-slate-950">{editingId ? 'Edit slot' : 'Add slot'}</h2>
        {error && <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        <div className="mt-5 grid gap-4">
          <div><label className="label">Futsal</label><select className="input" value={form.futsalId} onChange={(e) => setForm({ ...form, futsalId: Number(e.target.value) })}>{futsals.map((item) => <option key={item.futsalId} value={item.futsalId}>{item.name}</option>)}</select></div>
          <div><label className="label">Date</label><input className="input" type="date" min={todayInput()} value={form.slotDate} onChange={(e) => setForm({ ...form, slotDate: e.target.value })} /></div>
          <TimeField label="Start time" value={form.startTime} onChange={(value) => setForm({ ...form, startTime: value })} />
          <TimeField label="End time" value={form.endTime} onChange={(value) => setForm({ ...form, endTime: value })} />
          <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 font-bold text-slate-700"><span>Available</span><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /></label>
        </div>
        <div className="mt-6 flex gap-2"><button className="btn-primary flex-1">{editingId ? 'Update slot' : 'Create slot'}</button>{editingId && <button type="button" className="btn-soft" onClick={() => setEditingId(null)}>Cancel</button>}</div>
      </form>
      <div>
        <div className="panel mb-4 p-4"><label className="label">Filter date</label><input className="input max-w-xs" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} /></div>
        {loading ? <LoadingState /> : slots.length === 0 ? <EmptyState title="No slots found" /> : <div className="grid gap-3">{slots.map((slot) => <div key={slot.slotId} className="panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"><div><div className="font-black text-slate-950">{slot.futsal?.name || 'Futsal'} · {formatDate(slot.slotDate)}</div><div className="text-sm font-bold text-slate-500">{timeRange(slot.startTime, slot.endTime)} · {slot.available ? 'Available' : 'Booked/unavailable'}</div></div><div className="flex gap-2"><button className="btn-soft px-4 py-2" onClick={() => edit(slot)}>Edit</button><button className="btn-navy px-4 py-2" onClick={() => remove(slot.slotId)}>Delete</button></div></div>)}</div>}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </section>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import { futsalApi, uploadApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, LoadingState } from '../../components/State';
import type { Futsal, FutsalPayload } from '../../types/api';
import { formatTime, imageForVenue, money } from '../../utils/format';

const emptyForm: FutsalPayload = { name: '', address: '', city: '', phone: '', hourlyPrice: 1500, openingTime: '06:00:00', imageUrl: '', imageUrls: [], description: '' };

export function AdminFutsals() {
  const [items, setItems] = useState<Futsal[]>([]);
  const [form, setForm] = useState<FutsalPayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await futsalApi.list({ page, size: 8 });
    setItems(data.items || []);
    setTotalPages(data.totalPages || 0);
    setLoading(false);
  };
  useEffect(() => { load(); }, [page]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (editingId) await futsalApi.update(editingId, form);
      else await futsalApi.create(form);
      setMessage(editingId ? 'Futsal updated.' : 'Futsal created.');
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const edit = (item: Futsal) => {
    setEditingId(item.futsalId);
    setForm({ name: item.name, address: item.address, city: item.city, phone: item.phone, hourlyPrice: item.hourlyPrice, openingTime: item.openingTime, imageUrl: item.imageUrl || '', imageUrls: item.imageUrls || [], description: item.description || '' });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this futsal?')) return;
    await futsalApi.delete(id);
    await load();
  };

  const upload = async (file?: File) => {
    if (!file) return;
    const data = await uploadApi.single(file);
    setForm((prev) => ({ ...prev, imageUrl: data.url, imageUrls: [data.url, ...(prev.imageUrls || [])] }));
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[410px_1fr]">
      <form className="panel h-max p-6" onSubmit={submit}>
        <h2 className="text-2xl font-black text-slate-950">{editingId ? 'Edit futsal' : 'Add futsal'}</h2>
        {message && <p className="mt-3 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{message}</p>}
        {error && <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        <div className="mt-5 grid gap-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
          <div className="grid gap-3 sm:grid-cols-2"><div><label className="label">City</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div><div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><div><label className="label">Price/hour</label><input className="input" type="number" value={form.hourlyPrice} onChange={(e) => setForm({ ...form, hourlyPrice: Number(e.target.value) })} required /></div><div><label className="label">Opening time</label><input className="input" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} placeholder="06:00:00" required /></div></div>
          <div><label className="label">Image upload</label><input className="input" type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} /></div>
          <div><label className="label">Description</label><textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <div className="mt-6 flex gap-2"><button className="btn-primary flex-1">{editingId ? 'Update' : 'Create'}</button>{editingId && <button type="button" className="btn-soft" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}</div>
      </form>
      <div>
        {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="No futsals added yet" /> : <div className="grid gap-4">{items.map((item) => <div key={item.futsalId} className="panel flex flex-col gap-4 p-4 md:flex-row md:items-center"><img src={imageForVenue(item.imageUrl)} alt="" className="h-28 w-full rounded-2xl object-cover md:w-40" /><div className="flex-1"><h3 className="font-black text-slate-950">{item.name}</h3><p className="text-sm font-bold text-slate-500">{item.address}, {item.city}</p><p className="mt-1 text-sm text-slate-500">{money(item.hourlyPrice)} · Opens {formatTime(item.openingTime)}</p></div><div className="flex gap-2"><button className="btn-soft px-4 py-2" onClick={() => edit(item)}>Edit</button><button className="btn-navy px-4 py-2" onClick={() => remove(item.futsalId)}>Delete</button></div></div>)}</div>}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </section>
  );
}

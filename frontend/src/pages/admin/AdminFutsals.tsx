import { FormEvent, useEffect, useMemo, useState } from 'react';
import { futsalApi, uploadApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, LoadingState } from '../../components/State';
import type { Futsal, FutsalPayload } from '../../types/api';
import { formatTime, imageForVenue, money } from '../../utils/format';

const emptyForm: FutsalPayload = {
  name: '',
  address: '',
  city: '',
  phone: '',
  hourlyPrice: 1500,
  openingTime: '06:00:00',
  closingTime: '22:00:00',
  imageUrl: '',
  imageUrls: [],
  verified: false,
  courtType: '',
  rating: 0,
  reviewCount: 0,
  description: ''
};

export function AdminFutsals() {
  const [items, setItems] = useState<Futsal[]>([]);
  const [form, setForm] = useState<FutsalPayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const imageUrls = useMemo(() => (form.imageUrls || []).filter(Boolean), [form.imageUrls]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await futsalApi.list({ page, size: 8 });
      setItems(data.items || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load futsals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const payload = normalizePayload(form);
      if (editingId) await futsalApi.update(editingId, payload);
      else await futsalApi.create(payload);
      setMessage(editingId ? 'Venue updated.' : 'Venue created.');
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const edit = (item: Futsal) => {
    const urls = urlsFor(item);
    setEditingId(item.futsalId);
    setForm({
      name: item.name,
      address: item.address,
      city: item.city,
      phone: item.phone,
      hourlyPrice: item.hourlyPrice,
      openingTime: toTimeInput(item.openingTime),
      closingTime: toTimeInput(item.closingTime),
      imageUrl: item.imageUrl || urls[0] || '',
      imageUrls: urls,
      verified: Boolean(item.verified),
      courtType: item.courtType || '',
      rating: item.rating ?? 0,
      reviewCount: item.reviewCount ?? 0,
      description: item.description || ''
    });
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this venue? Active bookings or booking history will block deletion.')) return;
    setError('');
    try {
      await futsalApi.delete(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const uploadSingle = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = await uploadApi.single(file);
      addUploadedUrls([data.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const uploadMany = async (files?: FileList | null) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const data = await uploadApi.multiple(list);
      addUploadedUrls(data.urls || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Images upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addUploadedUrls = (urls: string[]) => {
    setForm((prev) => {
      const nextUrls = [...urls, ...(prev.imageUrls || [])].filter(Boolean);
      return { ...prev, imageUrl: nextUrls[0] || '', imageUrls: nextUrls };
    });
  };

  const removeImage = (url: string) => {
    setForm((prev) => {
      const nextUrls = (prev.imageUrls || []).filter((item) => item !== url);
      return { ...prev, imageUrl: nextUrls[0] || '', imageUrls: nextUrls };
    });
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <form className="panel h-max p-6" onSubmit={submit}>
        <h2 className="text-2xl font-black text-slate-950">{editingId ? 'Edit venue' : 'Add venue'}</h2>
        <p className="mt-1 text-sm text-slate-500">Creates records through the backend futsal API.</p>
        {message && <p className="mt-3 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{message}</p>}
        {error && <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

        <div className="mt-5 grid gap-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={3} maxLength={80} /></div>
          <div><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required minLength={5} maxLength={120} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">City</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required minLength={2} maxLength={50} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required pattern="^(98|97|96)\d{8}$" placeholder="98XXXXXXXX" /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Price/hour</label><input className="input" type="number" min={1} step="1" value={form.hourlyPrice} onChange={(e) => setForm({ ...form, hourlyPrice: Number(e.target.value) })} required /></div>
            <div><label className="label">Court type</label><input className="input" value={form.courtType || ''} onChange={(e) => setForm({ ...form, courtType: e.target.value })} maxLength={60} placeholder="Indoor turf" /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Opening time</label><input className="input" type="time" value={toTimeInput(form.openingTime)} onChange={(e) => setForm({ ...form, openingTime: withSeconds(e.target.value) })} required /></div>
            <div><label className="label">Closing time</label><input className="input" type="time" value={toTimeInput(form.closingTime)} onChange={(e) => setForm({ ...form, closingTime: withSeconds(e.target.value) })} required /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Rating</label><input className="input" type="number" min={0} max={5} step="0.1" value={form.rating ?? 0} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
            <div><label className="label">Review count</label><input className="input" type="number" min={0} step="1" value={form.reviewCount ?? 0} onChange={(e) => setForm({ ...form, reviewCount: Number(e.target.value) })} /></div>
          </div>
          <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 font-bold text-slate-700">
            <span>Verified venue</span>
            <input type="checkbox" checked={Boolean(form.verified)} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
          </label>
          <div><label className="label">Cover image</label><input className="input" type="file" accept="image/png,image/jpeg" disabled={uploading} onChange={(e) => uploadSingle(e.target.files?.[0])} /></div>
          <div><label className="label">Gallery images</label><input className="input" type="file" accept="image/png,image/jpeg" multiple disabled={uploading} onChange={(e) => uploadMany(e.target.files)} /></div>
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {imageUrls.map((url) => (
                <div key={url} className="relative overflow-hidden rounded-2xl border border-slate-200">
                  <img src={url} alt="" className="h-20 w-full object-cover" />
                  <button type="button" className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-black text-slate-700" onClick={() => removeImage(url)}>x</button>
                </div>
              ))}
            </div>
          )}
          <div><label className="label">Description</label><textarea className="input min-h-24" maxLength={250} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <div className="mt-6 flex gap-2">
          <button className="btn-primary flex-1" disabled={saving || uploading}>{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
          {editingId && <button type="button" className="btn-soft" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>

      <div>
        {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="No venues added yet" /> : (
          <div className="grid gap-4">
            {items.map((item) => (
              <div key={item.futsalId} className="panel flex flex-col gap-4 p-4 md:flex-row md:items-center">
                <img src={imageForVenue(item.imageUrl || item.imageUrls?.[0])} alt="" className="h-28 w-full rounded-2xl object-cover md:w-40" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-950">{item.name}</h3>
                    {item.verified && <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-black text-green-700">Verified</span>}
                  </div>
                  <p className="text-sm font-bold text-slate-500">{item.address}, {item.city}</p>
                  <p className="mt-1 text-sm text-slate-500">{money(item.hourlyPrice)} · {formatTime(item.openingTime)} - {formatTime(item.closingTime)} · {item.courtType || 'Court'}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-soft px-4 py-2" onClick={() => edit(item)}>Edit</button>
                  <button className="btn-navy px-4 py-2" onClick={() => remove(item.futsalId)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </section>
  );
}

function urlsFor(item: Futsal) {
  const fromImages = (item.images || []).map((image) => image.imageUrl || image.url || '').filter(Boolean);
  const urls = item.imageUrls?.length ? item.imageUrls : fromImages;
  return urls.length ? urls : item.imageUrl ? [item.imageUrl] : [];
}

function toTimeInput(value?: string) {
  return (value || '').slice(0, 5);
}

function withSeconds(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

function normalizePayload(form: FutsalPayload): FutsalPayload {
  const imageUrls = (form.imageUrls || []).filter(Boolean);
  return {
    ...form,
    openingTime: withSeconds(form.openingTime),
    closingTime: withSeconds(form.closingTime),
    imageUrl: imageUrls[0] || form.imageUrl || '',
    imageUrls,
    rating: Number(form.rating || 0),
    reviewCount: Number(form.reviewCount || 0)
  };
}

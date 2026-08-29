import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Clock3, ImageIcon, MapPin, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { futsalApi, uploadApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, LoadingState } from '../../components/State';
import type { Futsal, FutsalPayload } from '../../types/api';
import { formatTime, imageForVenue, money } from '../../utils/format';

type VenueSort = 'recommended' | 'price-low' | 'price-high';
type FormTab = 'details' | 'location' | 'schedule' | 'media';

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

const tabs: { id: FormTab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'location', label: 'Location' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'media', label: 'Media' }
];

export function AdminFutsals() {
  const [items, setItems] = useState<Futsal[]>([]);
  const [form, setForm] = useState<FutsalPayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FormTab>('details');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<VenueSort>('recommended');
  const [deleteTarget, setDeleteTarget] = useState<Futsal | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const imageUrls = useMemo(() => (form.imageUrls || []).filter(Boolean), [form.imageUrls]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await futsalApi.list({ page, size: 8, q: query.trim() || undefined, sort });
      setItems(data.items || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, query, sort]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setActiveTab('details');
    setMessage('');
    setError('');
    setDrawerOpen(true);
  };

  const openEdit = (item: Futsal) => {
    const urls = urlsFor(item);
    setEditingId(item.futsalId);
    setActiveTab('details');
    setMessage('');
    setError('');
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
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving || uploading) return;
    setDrawerOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

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
      setDrawerOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    setMessage('');
    setDeletingId(deleteTarget.futsalId);
    try {
      await futsalApi.delete(deleteTarget.futsalId);
      setMessage('Venue deleted.');
      setDeleteTarget(null);
      if (items.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
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
    <section className="space-y-5">
      <div className="panel overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="eyebrow">Venue Management</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Futsal venues</h2>
              <p className="mt-1 text-sm text-slate-500">Manage customer-facing venue listings from one clean workspace.</p>
            </div>
            <button className="btn-primary" onClick={openCreate} type="button">
              <Plus size={18} />
              Add venue
            </button>
          </div>

          {message && <p className="mt-4 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{message}</p>}
          {error && !drawerOpen && !deleteTarget && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
            <div>
              <label className="label" htmlFor="venue-search">Search venues</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="venue-search"
                  className="input pl-11"
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setPage(0); }}
                  placeholder="Name, city, address, or surface"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="venue-sort">Sort</label>
              <select id="venue-sort" className="input" value={sort} onChange={(event) => { setSort(event.target.value as VenueSort); setPage(0); }}>
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </div>
            <button type="button" className="btn-soft" disabled={!query && sort === 'recommended'} onClick={() => { setQuery(''); setSort('recommended'); setPage(0); }}>
              Clear filters
            </button>
          </div>
        </div>

        <div className="p-5">
          {loading ? <LoadingState /> : items.length === 0 ? (
            <EmptyState title="No venues found" description="Create a venue or adjust your filters." action={<button className="btn-primary" onClick={openCreate}>Add venue</button>} />
          ) : (
            <div className="motion-stagger grid gap-4">
              {items.map((item) => (
                <div key={item.futsalId} className="rounded-3xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-sm">
                  <div className="grid gap-4 md:grid-cols-[176px_minmax(0,1fr)_auto] md:items-center">
                    <img src={imageForVenue(item.imageUrl || item.imageUrls?.[0])} alt="" className="h-32 w-full rounded-2xl object-cover md:h-28" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-slate-950">{item.name}</h3>
                        {item.verified && <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-black text-green-700">Verified</span>}
                        {item.courtType && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{item.courtType}</span>}
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500"><MapPin size={15} className="text-green-600" /> {item.address}, {item.city}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                        <span className="font-black text-slate-950">{money(item.hourlyPrice)}/hr</span>
                        <span className="flex items-center gap-1"><Clock3 size={15} /> {formatTime(item.openingTime)} - {formatTime(item.closingTime)}</span>
                        <span>{Number(item.rating || 0).toFixed(1)} rating</span>
                      </div>
                    </div>
                    <div className="flex gap-2 md:flex-col">
                      <button className="btn-soft flex-1 px-4 py-2 md:flex-none" onClick={() => openEdit(item)}>
                        <Pencil size={16} />
                        Edit
                      </button>
                      <button className="btn-navy flex-1 px-4 py-2 md:flex-none" disabled={deletingId === item.futsalId} onClick={() => setDeleteTarget(item)}>
                        <Trash2 size={16} />
                        {deletingId === item.futsalId ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      {drawerOpen && (
        <div className="admin-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <button className="absolute inset-0 cursor-default" type="button" aria-label="Close venue form" onClick={closeDrawer} />
          <form className="admin-modal-panel relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onSubmit={submit}>
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow">{editingId ? 'Edit venue' : 'New venue'}</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">{editingId ? form.name || 'Edit venue' : 'Add venue'}</h3>
                  <p className="mt-1 text-sm text-slate-500">Only the selected section is shown to keep the form focused.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close venue form"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-green-200 hover:text-green-700 focus:outline-none focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={closeDrawer}
                  disabled={saving || uploading}
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 sm:grid-cols-4">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    className={`rounded-xl px-3 py-2 text-sm font-black transition ${activeTab === tab.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[380px] flex-1 overflow-y-auto px-6 py-5">
              {error && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

              {activeTab === 'details' && (
                <div className="grid gap-4">
                  <div><label className="label">Venue name</label><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={3} maxLength={80} placeholder="Rave futsal" /></div>
                  <div><label className="label">Surface type</label><input className="input" value={form.courtType || ''} onChange={(event) => setForm({ ...form, courtType: event.target.value })} maxLength={60} placeholder="Indoor turf" /></div>
                  <div><label className="label">Description</label><textarea className="input min-h-28" maxLength={250} value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Parking, lighting, facilities, or short venue note" /></div>
                  <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 font-bold text-slate-700">
                    <span>Verified venue</span>
                    <input type="checkbox" checked={Boolean(form.verified)} onChange={(event) => setForm({ ...form, verified: event.target.checked })} />
                  </label>
                </div>
              )}

              {activeTab === 'location' && (
                <div className="grid gap-4">
                  <div><label className="label">Address</label><input className="input" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required minLength={5} maxLength={120} placeholder="Kapan, Kathmandu" /></div>
                  <div><label className="label">City</label><input className="input" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required minLength={2} maxLength={50} placeholder="Kathmandu" /></div>
                  <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required pattern="^(98|97|96)\d{8}$" placeholder="98XXXXXXXX" /></div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="grid gap-4">
                  <div><label className="label">Price per hour</label><input className="input" type="number" min={1} step="1" value={form.hourlyPrice} onChange={(event) => setForm({ ...form, hourlyPrice: Number(event.target.value) })} required /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="label">Opening time</label><input className="input" type="time" value={toTimeInput(form.openingTime)} onChange={(event) => setForm({ ...form, openingTime: withSeconds(event.target.value) })} required /></div>
                    <div><label className="label">Closing time</label><input className="input" type="time" value={toTimeInput(form.closingTime)} onChange={(event) => setForm({ ...form, closingTime: withSeconds(event.target.value) })} required /></div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="grid gap-4">
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                    <ImageIcon className="mx-auto text-green-600" size={26} />
                    <h4 className="mt-3 font-black text-slate-950">Upload venue images</h4>
                    <p className="mt-1 text-sm text-slate-500">Use one clear cover photo and optional gallery images.</p>
                  </div>
                  <div><label className="label">Cover image</label><input className="input" type="file" accept="image/png,image/jpeg" disabled={uploading} onChange={(event) => uploadSingle(event.target.files?.[0])} /></div>
                  <div><label className="label">Gallery images</label><input className="input" type="file" accept="image/png,image/jpeg" multiple disabled={uploading} onChange={(event) => uploadMany(event.target.files)} /></div>
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {imageUrls.map((url) => (
                        <div key={url} className="relative overflow-hidden rounded-2xl border border-slate-200">
                          <img src={url} alt="" className="h-28 w-full object-cover" />
                          <button
                            type="button"
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-100"
                            aria-label="Remove venue image"
                            onClick={() => removeImage(url)}
                          >
                            <X size={16} strokeWidth={2.6} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button type="button" className="btn-soft min-w-32 px-6 py-3" onClick={closeDrawer} disabled={saving || uploading}>Cancel</button>
                <button className="btn-primary min-w-44 px-6 py-3" disabled={saving || uploading}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create venue'}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <p className="eyebrow">Delete venue</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">Remove {deleteTarget.name}?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              The backend will block this if the venue has active bookings or booking history. This keeps historical booking data protected.
            </p>
            {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
              <button className="btn-soft flex-1" disabled={deletingId !== null} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-navy flex-1" disabled={deletingId !== null} onClick={confirmDelete}>
                {deletingId === deleteTarget.futsalId ? 'Deleting...' : 'Delete venue'}
              </button>
            </div>
          </div>
        </div>
      )}
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

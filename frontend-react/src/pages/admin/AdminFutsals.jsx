import { useEffect, useState } from 'react';
import { FutsalAPI } from '../../api/futsal.js';
import { formatTime } from '../../utils/format.js';
import { resolveImageUrl } from '../../utils/image.js';
import { useToast } from '../../components/ToastProvider.jsx';
import { useConfirm } from '../../components/ConfirmProvider.jsx';
import Pagination from '../../components/Pagination.jsx';

const emptyForm = {
  name: '',
  address: '',
  city: '',
  phone: '',
  openingTime: '',
  closingTime: '',
  hourlyPrice: '',
  imageUrls: [],
  verified: false,
  courtType: '',
  rating: '',
  reviewCount: '',
  description: ''
};

export default function AdminFutsals() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [form, setForm] = useState(emptyForm);
  const [futsals, setFutsals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const previewUrls = [
    ...(form.imageUrls || []).map((url) => resolveImageUrl(url)),
    ...newFiles.map((file) => URL.createObjectURL(file))
  ];

  const loadFutsals = async (targetPage = page) => {
    try {
      const data = await FutsalAPI.getAll({ page: targetPage, size: pageSize });
      const items = data?.items ?? data ?? [];
      setFutsals(items);
      setTotalPages(data?.totalPages ?? (items.length > 0 ? 1 : 0));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFutsals(page);
  }, [page]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setAlert('');
    setNewFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert('');
    setSubmitting(true);

    try {
      let mergedUrls = [...(form.imageUrls || [])];
      if (newFiles.length > 0) {
        const res = await FutsalAPI.uploadImages(newFiles);
        mergedUrls = mergedUrls.concat(res.urls || []);
      }

      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
        hourlyPrice: parseFloat(form.hourlyPrice),
        openingTime: form.openingTime ? `${form.openingTime}:00` : null,
        closingTime: form.closingTime ? `${form.closingTime}:00` : null,
        imageUrls: mergedUrls,
        imageUrl: mergedUrls.length > 0 ? mergedUrls[0] : null,
        verified: form.verified,
        courtType: form.courtType.trim() || null,
        rating: form.rating === '' ? null : parseFloat(form.rating),
        reviewCount: form.reviewCount === '' ? 0 : parseInt(form.reviewCount, 10),
        description: form.description.trim() || null
      };

      if (editingId) {
        await FutsalAPI.update(editingId, payload);
        showToast('Futsal updated successfully.', 'success');
      } else {
        await FutsalAPI.add(payload);
        showToast('Futsal added successfully.', 'success');
      }

      resetForm();
      setPage(0);
      loadFutsals(0);
    } catch (err) {
      setAlert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const editFutsal = (f) => {
    setEditingId(f.futsalId);
    setForm({
      name: f.name || '',
      address: f.address || '',
      city: f.city || '',
      phone: f.phone || '',
      openingTime: f.openingTime ? f.openingTime.substring(0, 5) : '',
      closingTime: f.closingTime ? f.closingTime.substring(0, 5) : '',
      hourlyPrice: f.hourlyPrice ?? '',
      imageUrls: (f.imageUrls && f.imageUrls.length > 0) ? f.imageUrls : (f.imageUrl ? [f.imageUrl] : []),
      verified: Boolean(f.verified),
      courtType: f.courtType || '',
      rating: f.rating ?? '',
      reviewCount: f.reviewCount ?? '',
      description: f.description || ''
    });
    setNewFiles([]);
  };

  const deleteFutsal = async (id) => {
    const ok = await confirm('Delete this futsal? Slots linked to it will also be removed.');
    if (!ok) return;
    try {
      await FutsalAPI.delete(id);
      showToast('Futsal deleted', 'success');
      loadFutsals(page);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Manage <span>venues</span></h1>
          <p>Create, edit, and maintain futsal venue details, media, and pricing.</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="admin-grid">
          <div className="card admin-side">
            <div className="card-header"><h3>{editingId ? 'Edit Futsal' : 'Add New Futsal'}</h3></div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-control" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address} onChange={(e) => updateField('address', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" value={form.city} onChange={(e) => updateField('city', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Opening Time</label>
                  <input type="time" className="form-control" value={form.openingTime} onChange={(e) => updateField('openingTime', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Closing Time</label>
                  <input type="time" className="form-control" value={form.closingTime} onChange={(e) => updateField('closingTime', e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hourly Price (NPR)</label>
                  <input type="number" className="form-control" value={form.hourlyPrice} onChange={(e) => updateField('hourlyPrice', e.target.value)} min="0" step="50" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Court Type</label>
                  <input className="form-control" value={form.courtType} onChange={(e) => updateField('courtType', e.target.value)} placeholder="Indoor turf, outdoor court..." maxLength={60} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <input type="number" className="form-control" value={form.rating} onChange={(e) => updateField('rating', e.target.value)} min="0" max="5" step="0.1" placeholder="4.8" />
                </div>
                <div className="form-group">
                  <label className="form-label">Review Count</label>
                  <input type="number" className="form-control" value={form.reviewCount} onChange={(e) => updateField('reviewCount', e.target.value)} min="0" step="1" placeholder="128" />
                </div>
                <div className="form-group">
                  <label className="form-label">Verified Venue</label>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={form.verified} onChange={(e) => updateField('verified', e.target.checked)} />
                    <span>Show verified badge</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Photos</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setNewFiles((prev) => prev.concat(files));
                    e.target.value = '';
                  }}
                />
                {previewUrls.length > 0 && (
                  <div className="preview-grid">
                    {previewUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="preview-tile">
                        <img src={url} alt="Preview" />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm preview-remove"
                          aria-label="Remove photo"
                          onClick={() => {
                            const existingCount = (form.imageUrls || []).length;
                            if (index < existingCount) {
                              setForm((prev) => ({
                                ...prev,
                                imageUrls: prev.imageUrls.filter((_, i) => i !== index)
                              }));
                            } else {
                              const fileIndex = index - existingCount;
                              setNewFiles((prev) => prev.filter((_, i) => i !== fileIndex));
                            }
                          }}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea className="form-control" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Parking, turf type, amenities..."></textarea>
              </div>
              <div className={`alert alert-error ${alert ? 'show' : ''}`}>
                <span>Error</span><span>{alert}</span>
              </div>
              <div className="toolbar-inline">
                <button type="submit" className="btn btn-primary grow" disabled={submitting}>
                  {submitting ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add Futsal')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Reset</button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>All Futsals</h3>
              <button onClick={() => loadFutsals(page)} className="btn btn-secondary btn-sm">Refresh</button>
            </div>

            {loading ? (
              <div className="loading-wrap"><div className="spinner"></div><p>Loading futsals...</p></div>
            ) : futsals.length === 0 ? (
              <div className="empty-state"><div className="icon">0</div><h3>No futsals found</h3><p>Add your first futsal using the form.</p></div>
            ) : (
                <div className="table-wrap">
                  <table className="responsive-table">
                   <thead>
                     <tr><th>Name</th><th>Address</th><th>City</th><th>Type</th><th>Rating</th><th>Hours</th><th>Price/hr</th><th>Actions</th></tr>
                   </thead>
                   <tbody>
                     {futsals.map((f) => (
                        <tr key={f.futsalId}>
                          <td className="fw-bold" data-label="Name">{f.name}</td>
                          <td className="text-muted text-sm" data-label="Address">{f.address}</td>
                          <td data-label="City">{f.city}</td>
                          <td data-label="Type">{f.courtType || '-'}</td>
                          <td data-label="Rating">
                            {f.rating !== null && f.rating !== undefined ? `${Number(f.rating).toFixed(1)} (${f.reviewCount || 0})` : '-'}
                            {f.verified && <span className="badge badge-approved ml-2">Verified</span>}
                          </td>
                          <td data-label="Hours">{f.openingTime ? formatTime(f.openingTime) : '-'} - {f.closingTime ? formatTime(f.closingTime) : '-'}</td>
                          <td data-label="Price/hr">NPR {f.hourlyPrice ?? '-'}</td>
                          <td className="table-actions" data-label="Actions">
                           <div className="actions-row">
                             <button className="btn btn-secondary btn-sm" onClick={() => editFutsal(f)}>Edit</button>
                             <button className="btn btn-danger btn-sm" onClick={() => deleteFutsal(f.futsalId)}>Delete</button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
             {!loading && futsals.length > 0 && (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
           </div>
        </div>
      </div>
    </>
  );
}

import { apiFetch, apiUpload, API_URL, withQuery } from './client.js';

export const FutsalAPI = {
  getAll:  (params = {}) => apiFetch(withQuery('/futsals', params)),
  getById: (id) => apiFetch(`/futsals/${id}`),
  add:     (futsal) => apiFetch('/futsals', { method: 'POST', body: JSON.stringify(futsal) }),
  update:  (id, futsal) => apiFetch(`/futsals/${id}`, { method: 'PUT', body: JSON.stringify(futsal) }),
  delete:  (id) => apiFetch(`/futsals/${id}`, { method: 'DELETE' }),
  uploadImage: (file) => apiUpload('/uploads/futsal-image', file),
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return fetch(`${API_URL}/uploads/futsal-images`, {
      method: 'POST',
      body: formData
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      return data;
    });
  }
};

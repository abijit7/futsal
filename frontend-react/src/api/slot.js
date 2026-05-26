import { apiFetch, withQuery } from './client.js';

export const SlotAPI = {
  getAvailable: (params = {}) => apiFetch(withQuery('/slots', params)),
  getAll:       (params = {}) => apiFetch(withQuery('/slots/all', params)),
  getById:      (id) => apiFetch(`/slots/${id}`),
  add:          (slot) => apiFetch('/slots', { method: 'POST', body: JSON.stringify(slot) }),
  update:       (id, slot) => apiFetch(`/slots/${id}`, { method: 'PUT', body: JSON.stringify(slot) }),
  delete:       (id) => apiFetch(`/slots/${id}`, { method: 'DELETE' })
};

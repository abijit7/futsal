import { apiFetch, withQuery } from './client.js';

export const SlotAPI = {
  getAvailable: (futsalId) => apiFetch(withQuery('/slots', { futsalId })),
  getAll:       (futsalId) => apiFetch(withQuery('/slots/all', { futsalId })),
  getById:      (id) => apiFetch(`/slots/${id}`),
  add:          (slot) => apiFetch('/slots', { method: 'POST', body: JSON.stringify(slot) }),
  update:       (id, slot) => apiFetch(`/slots/${id}`, { method: 'PUT', body: JSON.stringify(slot) }),
  delete:       (id) => apiFetch(`/slots/${id}`, { method: 'DELETE' })
};


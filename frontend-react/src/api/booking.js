import { apiFetch } from './client.js';

export const BookingAPI = {
  create:       (userId, slotId, notes) => apiFetch('/bookings', { method: 'POST', body: JSON.stringify({ userId, slotId, notes }) }),
  getAll:       () => apiFetch('/bookings'),
  getByUser:    (userId) => apiFetch(`/bookings/user/${userId}`),
  getById:      (id) => apiFetch(`/bookings/${id}`),
  updateStatus: (id, status) => apiFetch(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete:       (id) => apiFetch(`/bookings/${id}`, { method: 'DELETE' })
};


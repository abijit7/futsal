import { apiFetch } from './client.js';

export const UserAPI = {
  register: (user) => apiFetch('/users/register', { method: 'POST', body: JSON.stringify(user) }),
  login:    (email, password) => apiFetch('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getAll:   () => apiFetch('/users'),
  getById:  (id) => apiFetch(`/users/${id}`),
  update:   (id, data) => apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:   (id) => apiFetch(`/users/${id}`, { method: 'DELETE' })
};


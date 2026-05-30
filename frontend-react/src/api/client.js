import { Auth } from '../utils/auth.js';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
export const API_URL = import.meta.env.VITE_API_URL || `${API_BASE}/api`;
export const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || '';

function buildHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const user = Auth.get();
  if (user?.userId) {
    headers['X-User-Id'] = String(user.userId);
  }
  if (Auth.isAdmin() && ADMIN_TOKEN) {
    headers['X-Admin-Token'] = ADMIN_TOKEN;
  }
  return headers;
}

export function withQuery(endpoint, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `${endpoint}?${qs}` : endpoint;
}

export async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: buildHeaders(options.headers),
      ...options
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.error || 'Request failed');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Network error. Is the server running?');
  }
}

export async function apiUpload(endpoint, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: Auth.isAdmin() && ADMIN_TOKEN ? { 'X-Admin-Token': ADMIN_TOKEN } : undefined,
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Upload failed');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Upload failed');
  }
}

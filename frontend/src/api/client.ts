import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const apiBaseUrl = API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api` : '/api';

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const rawUser = localStorage.getItem('futsal_user');
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser) as { authToken?: string };
      if (user.authToken) {
        config.headers.Authorization = `Bearer ${user.authToken}`;
      }
    } catch {
      localStorage.removeItem('futsal_user');
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Request failed';
    if (status === 401 || (status === 403 && /token|auth/i.test(message))) {
      localStorage.removeItem('futsal_user');
      window.dispatchEvent(new CustomEvent('authrequired', { detail: { status, message } }));
    }
    return Promise.reject(new Error(message));
  }
);

export function query(params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  return search.toString();
}

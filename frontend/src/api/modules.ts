import { api, query } from './client';
import type { Booking, BookingStatus, Futsal, FutsalPayload, PagedResponse, PaymentMethod, TimeSlot, TimeSlotPayload, User } from '../types/api';

export const authApi = {
  login: (payload: Pick<User, 'email'> & { password: string }) =>
    api.post<User>('/users/login', payload).then((res) => res.data),
  register: (payload: Pick<User, 'name' | 'email' | 'phone'> & { password: string }) =>
    api.post<User>('/users/register', payload).then((res) => res.data)
};

export const userApi = {
  list: (page = 0, size = 10) => api.get<PagedResponse<User>>(`/users?${query({ page, size })}`).then((res) => res.data),
  update: (id: number, payload: { name: string; phone: string; password?: string }) => api.put<User>(`/users/${id}`, payload).then((res) => res.data),
  delete: (id: number) => api.delete(`/users/${id}`).then((res) => res.data)
};

export const futsalApi = {
  list: (params: { page?: number; size?: number } = {}) =>
    api.get<PagedResponse<Futsal>>(`/futsals?${query({ page: params.page ?? 0, size: params.size ?? 12 })}`).then((res) => res.data),
  get: (id: number) => api.get<Futsal>(`/futsals/${id}`).then((res) => res.data),
  create: (payload: FutsalPayload) => api.post<Futsal>('/futsals', payload).then((res) => res.data),
  update: (id: number, payload: FutsalPayload) => api.put<Futsal>(`/futsals/${id}`, payload).then((res) => res.data),
  delete: (id: number) => api.delete(`/futsals/${id}`).then((res) => res.data)
};

export const uploadApi = {
  single: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<{ url: string }>('/uploads/futsal-image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  multiple: async (files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const res = await api.post<{ urls: string[] }>('/uploads/futsal-images', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  }
};

export const slotApi = {
  available: (params: { futsalId?: number; slotDate?: string; page?: number; size?: number }) =>
    api.get<PagedResponse<TimeSlot>>(`/slots?${query(params)}`).then((res) => res.data),
  all: (params: { futsalId?: number; slotDate?: string; page?: number; size?: number }) =>
    api.get<PagedResponse<TimeSlot>>(`/slots/all?${query(params)}`).then((res) => res.data),
  create: (payload: TimeSlotPayload) => api.post<TimeSlot>('/slots', payload).then((res) => res.data),
  update: (id: number, payload: TimeSlotPayload) => api.put<TimeSlot>(`/slots/${id}`, payload).then((res) => res.data),
  delete: (id: number) => api.delete(`/slots/${id}`).then((res) => res.data)
};

export const bookingApi = {
  all: (params: { page?: number; size?: number; status?: BookingStatus | 'ALL' } = {}) =>
    api.get<PagedResponse<Booking>>(`/bookings?${query({ page: params.page ?? 0, size: params.size ?? 10, status: params.status ?? 'ALL' })}`).then((res) => res.data),
  byUser: (userId: number, page = 0, size = 10) =>
    api.get<PagedResponse<Booking>>(`/bookings/user/${userId}?${query({ page, size })}`).then((res) => res.data),
  updateStatus: (id: number, status: BookingStatus) => api.put<Booking>(`/bookings/${id}/status`, { status }).then((res) => res.data),
  delete: (id: number) => api.delete(`/bookings/${id}`).then((res) => res.data)
};

export const paymentApi = {
  confirm: (payload: { userId: number; slotId: number; method: PaymentMethod; notes?: string }) =>
    api.post<Booking>('/payments/confirm', payload).then((res) => res.data)
};

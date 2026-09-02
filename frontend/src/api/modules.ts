import { api, query } from './client';
import type { Booking, BookingStatus, Futsal, FutsalPayload, PagedResponse, PaymentInitiation, PaymentMethod, PaymentVerification, Review, ReviewPayload, SlotGenerationPayload, SlotGenerationResponse, TimeSlot, TimeSlotPayload, User, VerificationIssueResponse } from '../types/api';

export const authApi = {
  login: (payload: Pick<User, 'email'> & { password: string }) =>
    api.post<User>('/users/login', payload).then((res) => res.data),
  register: (payload: Pick<User, 'name' | 'email' | 'phone'> & { password: string }) =>
    api.post<User>('/users/register', payload).then((res) => res.data),
  forgotPassword: (email: string) =>
    api.post<VerificationIssueResponse>('/users/forgot-password', { email }).then((res) => res.data),
  resetPassword: (payload: { email: string; code: string; newPassword: string }) =>
    api.post<{ message: string }>('/users/reset-password', payload).then((res) => res.data)
};

export const userApi = {
  list: (params: { page?: number; size?: number; q?: string; role?: 'USER' | 'ADMIN' } = {}) =>
    api.get<PagedResponse<User>>(`/users?${query({ page: params.page ?? 0, size: params.size ?? 10, q: params.q, role: params.role })}`).then((res) => res.data),
  get: (id: number) => api.get<User>(`/users/${id}`).then((res) => res.data),
  update: (id: number, payload: { name?: string; phone?: string }) => api.put<User>(`/users/${id}`, payload).then((res) => res.data),
  changePassword: (id: number, payload: { currentPassword: string; newPassword: string }) =>
    api.put<{ message: string }>(`/users/${id}/password`, payload).then((res) => res.data),
  requestEmailVerification: (id: number) =>
    api.post<VerificationIssueResponse>(`/users/${id}/verification/email/request`).then((res) => res.data),
  confirmEmailVerification: (id: number, code: string) =>
    api.post<User>(`/users/${id}/verification/email/confirm`, { code }).then((res) => res.data),
  requestPhoneVerification: (id: number) =>
    api.post<VerificationIssueResponse>(`/users/${id}/verification/phone/request`).then((res) => res.data),
  confirmPhoneVerification: (id: number, code: string) =>
    api.post<User>(`/users/${id}/verification/phone/confirm`, { code }).then((res) => res.data),
  delete: (id: number) => api.delete(`/users/${id}`).then((res) => res.data)
};

export const futsalApi = {
  list: (params: { page?: number; size?: number; q?: string; sort?: 'recommended' | 'price-low' | 'price-high' } = {}) =>
    api.get<PagedResponse<Futsal>>(`/futsals?${query({ page: params.page ?? 0, size: params.size ?? 12, q: params.q, sort: params.sort ?? 'recommended' })}`).then((res) => res.data),
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
  public: (params: { futsalId?: number; slotDate?: string; page?: number; size?: number }) =>
    api.get<PagedResponse<TimeSlot>>(`/slots/public?${query(params)}`).then((res) => res.data),
  all: (params: { futsalId?: number; slotDate?: string; page?: number; size?: number }) =>
    api.get<PagedResponse<TimeSlot>>(`/slots/all?${query(params)}`).then((res) => res.data),
  generate: (payload: SlotGenerationPayload) => api.post<SlotGenerationResponse>('/slots/generate', payload).then((res) => res.data),
  create: (payload: TimeSlotPayload) => api.post<TimeSlot>('/slots', payload).then((res) => res.data),
  update: (id: number, payload: TimeSlotPayload) => api.put<TimeSlot>(`/slots/${id}`, payload).then((res) => res.data),
  delete: (id: number) => api.delete(`/slots/${id}`).then((res) => res.data)
};

export const bookingApi = {
  all: (params: { page?: number; size?: number; status?: BookingStatus | 'ALL'; q?: string; slotDate?: string } = {}) =>
    api.get<PagedResponse<Booking>>(`/bookings?${query({ page: params.page ?? 0, size: params.size ?? 10, status: params.status ?? 'ALL', q: params.q, slotDate: params.slotDate })}`).then((res) => res.data),
  byUser: (userId: number, page = 0, size = 10, status?: BookingStatus | 'ALL') =>
    api.get<PagedResponse<Booking>>(`/bookings/user/${userId}?${query({ page, size, status: status ?? 'ALL' })}`).then((res) => res.data),
  get: (id: number) => api.get<Booking>(`/bookings/${id}`).then((res) => res.data),
  updateStatus: (id: number, status: BookingStatus) => api.put<Booking>(`/bookings/${id}/status`, { status }).then((res) => res.data),
  delete: (id: number) => api.delete(`/bookings/${id}`).then((res) => res.data)
};

export const reviewApi = {
  /** Public: anyone can read a venue's reviews. */
  forFutsal: (futsalId: number, page = 0, size = 10) =>
    api.get<PagedResponse<Review>>(`/futsals/${futsalId}/reviews?${query({ page, size })}`).then((res) => res.data),

  /**
   * The server checks that the booking belongs to the caller, was approved, is for this venue,
   * and has already finished - so a rating cannot be left by someone who never played.
   */
  create: (futsalId: number, payload: ReviewPayload) =>
    api.post<Review>(`/futsals/${futsalId}/reviews`, payload).then((res) => res.data),

  update: (reviewId: number, payload: ReviewPayload) =>
    api.put<Review>(`/reviews/${reviewId}`, payload).then((res) => res.data),

  delete: (reviewId: number) => api.delete(`/reviews/${reviewId}`).then((res) => res.data),

  /** Booking ids this user has already reviewed, so the prompt can be hidden for them. */
  reviewedBookings: (userId: number) =>
    api.get<number[]>(`/users/${userId}/reviewed-bookings`).then((res) => res.data)
};

export const paymentApi = {
  /**
   * Starts a payment. The amount is NOT sent: the server prices the slot from the venue's hourly
   * rate, so the client cannot choose what to pay.
   */
  initiate: (payload: { userId: number; slotId: number; method: PaymentMethod; notes?: string }) =>
    api.post<PaymentInitiation>('/payments/initiate', payload).then((res) => res.data),

  /** Confirms a gateway payment after the redirect back. */
  verify: (payload: { data?: string }) =>
    api.post<PaymentVerification>('/payments/verify', payload).then((res) => res.data),

  /** Releases the slot hold when the user abandons checkout. */
  cancel: (transactionId: string) =>
    api.post<PaymentVerification>(`/payments/cancel/${transactionId}`).then((res) => res.data)
};

export type Role = 'USER' | 'ADMIN';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PaymentMethod = 'ESEWA' | 'KHALTI' | 'CASH_IN_HAND';

export type PagedResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type User = {
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt?: string;
  authToken?: string | null;
};

export type FutsalImage = {
  imageId?: number;
  url?: string;
  imageUrl?: string;
};

export type Futsal = {
  futsalId: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  hourlyPrice: number;
  openingTime: string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: FutsalImage[];
  description?: string;
  createdAt?: string;
};

export type FutsalPayload = Omit<Futsal, 'futsalId' | 'createdAt' | 'images'>;

export type TimeSlot = {
  slotId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  available: boolean;
  futsal?: Pick<Futsal, 'futsalId' | 'name' | 'hourlyPrice' | 'city' | 'imageUrl'>;
  statusHistory?: unknown[];
};

export type TimeSlotPayload = {
  futsalId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  available: boolean;
};

export type Booking = {
  bookingId: number;
  status: BookingStatus;
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
  paidAt?: string;
  bookedAt?: string;
  notes?: string;
  user?: Pick<User, 'userId' | 'name' | 'email' | 'phone'>;
  timeSlot?: TimeSlot;
};

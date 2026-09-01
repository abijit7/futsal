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
  emailVerified: boolean;
  phoneVerified: boolean;
};

export type VerificationIssueResponse = {
  message: string;
  expiresInSeconds: number;
  devCode?: string | null;
};

export type FutsalImage = {
  imageId?: number;
  url?: string;
  imageUrl?: string;
  sortOrder?: number;
  cover?: boolean;
  caption?: string;
};

export type Futsal = {
  futsalId: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  hourlyPrice: number;
  openingTime: string;
  closingTime: string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: FutsalImage[];
  verified?: boolean;
  courtType?: string;
  rating?: number;
  reviewCount?: number;
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
  available?: boolean;
};

export type SlotGenerationPayload = {
  futsalId: number;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  slotMinutes: number;
  holidayDates?: string[];
  maintenanceBlocks?: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
};

export type SlotGenerationResponse = {
  created: number;
  skippedExisting: number;
  skippedBlocked: number;
};

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

/**
 * How the browser continues a payment. eSewa needs an auto-submitted form POST
 * (formUrl + formFields), Khalti a redirect (redirectUrl), cash neither.
 */
export type PaymentInitiation = {
  transactionId: string;
  method: PaymentMethod;
  amount: number;
  message?: string;
  formUrl?: string;
  formFields?: Record<string, string>;
  redirectUrl?: string;
  booking?: Booking;
};

export type PaymentVerification = {
  status: PaymentStatus;
  message?: string;
  gatewayReference?: string;
  booking?: Booking;
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

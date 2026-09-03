export type Role = 'USER' | 'ADMIN';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
// KHALTI is retained only so historical bookings returned by the API still type-check;
// it can no longer be selected for a new checkout.
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

export type Review = {
  reviewId: number;
  futsalId: number;
  bookingId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
  authorName?: string;
  authorId?: number;
};

export type ReviewPayload = {
  bookingId: number;
  rating: number;
  comment?: string;
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

// REFUND_PENDING means money was taken and is owed back but nobody has issued the refund yet.
// eSewa has no merchant refund API, so that gap is worked by hand in their dashboard.
export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'CANCELLED';

export type Refund = {
  transactionId: number;
  bookingId: number;
  amount: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  venueName?: string;
  /** Paste this into the eSewa merchant dashboard to find the original payment. */
  gatewayReference?: string;
  reason?: string;
  requestedBy?: string;
  refundDueAt?: string;
  outstandingHours: number;
};

/**
 * How the browser continues a payment. eSewa needs an auto-submitted form POST
 * (formUrl + formFields), cash neither.
 */
export type PaymentInitiation = {
  transactionId: string;
  method: PaymentMethod;
  amount: number;
  message?: string;
  formUrl?: string;
  formFields?: Record<string, string>;
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

// types/booking.ts

export interface BookingDto {
  id: number;
  bookingCode: string;

  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  propertyId: number;
  propertyName: string;
  propertyAddress: string;

  roomTypeId: number;
  roomTypeName: string;

  checkIn: string;          // ISO date string
  checkOut: string;         // ISO date string
  nights: number;
  adults: number;
  children: number;
  roomsCount: number;

  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;

  roomPrice: number;
  discountAmount: number;
  taxAmount: number;
  serviceFee: number;
  totalAmount: number;

  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookingSource: string;

  bookingDate: string;      // ISO date string
  confirmedAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelledAt: string | null;
}


export interface BookingDetailDto {
  id: number;
  bookingCode: string;
  customerId: number;
  customerName?: string;
  propertyId: number;
  propertyName?: string;
  roomTypeId: number;
  roomTypeName?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  roomsCount: number;
  guestName: string;
  guestPhone?: string;
  guestEmail: string;
  guestIdNumber?: string;
  specialRequests?: string;
  roomPrice: number;
  discountPercent: number;
  discountAmount: number;
  couponDiscountAmount: number;
  couponDiscountPercent: number;
  taxAmount: number;
  serviceFee: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookingSource?: string;
  bookingDate: string;
  confirmedAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  cancelledAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}

// Updated to match database constraints
export type BookingStatus = 
  | 'pending'
  | 'confirmed' 
  | 'checkedIn'
  | 'noShow'
  | 'completed' 
  | 'cancelled';

// Updated to match database constraints
export type PaymentStatus = 
  | 'unpaid' 
  | 'partial'
  | 'paid' 
  | 'refunded';

export interface GetUserBookingsRequest {
  bookingCode?: string;
  propertyName?: string;
  fromDate?: string;
  toDate?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  sortBy?: 'bookingDate' | 'checkIn' | 'checkOut' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
}

export interface GetUserBookingsResponse {
  bookings: BookingDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface BookingStatistics {
  totalBookings: number;
  totalAmount: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface CreateBookingRequest {
  propertyId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomsCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  specialRequests?: string;
}

export interface UpdateBookingRequest {
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  specialRequests?: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

// New refund ticket types
export interface CreateRefundTicketRequest {
  bookingId: number;
  requestedAmount: number;
  reason: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export interface RefundTicketResponse {
  id: number;
  bookingId: number;
  bookingCode: string;
  propertyName: string;
  customerId: number;
  requestedAmount: number;
  reason: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: string;
  createdAt: string;
  processedAt?: string;
}
export interface AvailabilityParams {
  propertyId: number
  roomTypeId: number
  checkIn: string
  checkOut: string
  roomsCount: number
  totalGuests: number
  adults: number
  children: number
}

export interface AvailableDatesParams {
  propertyId: number
  roomTypeId: number
  year: number
  month: number
  roomsCount: number
}

export interface AvailabilityResult {
  available: boolean
  propertyId: number
  roomTypeId: number
  roomTypeName: string
  checkIn: string
  checkOut: string
  nights: number
  roomsCount: number
  adults: number
  children: number
  totalGuests: number
  availableRooms: number
  totalRooms: number
  maxAdults: number
  maxChildren: number
  maxGuests: number
  validationPassed: boolean
}

export interface DayInfo {
  date: string
  dayOfWeek: string
  dayOfWeekShort: string
  day: number
  isAvailable: boolean
  availableRooms: number
  bookedRooms: number
  totalRooms: number
  pricePerRoom: number
  priceType: string
  isWeekend: boolean
  isHoliday: boolean
  isToday: boolean
  isPast: boolean
}

export interface AvailableDatesResult {
  propertyId: number
  roomTypeId: number
  roomTypeName: string
  year: number
  month: number
  monthName: string
  roomsCount: number
  totalRooms: number
  summary: {
    totalDays: number
    availableDays: number
    unavailableDays: number
    availabilityRate: number
  }
  calendar: DayInfo[]
  availableDates: string[]
  unavailableDates: string[]
}
export interface PriceQuoteParams {
  propertyId: number
  roomTypeId: number
  checkIn: string
  checkOut: string
  roomsCount: number
}

// Thay thế interface PriceQuoteResult hiện tại
export interface PriceQuoteResult {
  propertyId: number
  roomTypeId: number
  roomTypeName: string
  checkIn: string
  checkOut: string
  nights: number
  roomsCount: number
  roomPrice: number
  discountPercent: number
  discountAmount: number
  subtotal: number
  taxAmount: number
  taxPercent: number
  serviceFee: number
  totalAmount: number
  weeklyDiscountPercent: number
  monthlyDiscountPercent: number
  appliedDiscount: string
  dailyBreakdown: DailyBreakdown[]
  averagePricePerNight: number
}

export interface DailyBreakdown {
  date: string
  dayOfWeek: string
  priceType: 'weekday' | 'weekend'
  pricePerRoom: number
  totalForRooms: number
}
export interface CreateBookingRequestFull extends CreateBookingRequest {
  guestIdNumber?: string
  bookingSource?: string
  utmSource?: string
  utmCampaign?: string
  utmMedium?: string
}
export interface BookingData {
  bookingCode: string
  amount: number
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  propertyName: string
  roomTypeName: string
  status: string
  paymentStatus: string
  qrCodeUrl?: string
}
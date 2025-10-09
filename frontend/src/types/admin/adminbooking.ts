// Common API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T | null;
  error?: string;
}

// Request Types

export interface UpdateBookingStatusRequest {
  status: 'pending' | 'confirmed' | 'checkedIn' | 'completed' | 'cancelled';
  note?: string;
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'partial_refund';
  note?: string;
}

export interface AdminCancelBookingRequest {
  reason: string;
  refundAmount?: number;
  sendNotification?: boolean;
}

export interface ExportBookingsRequest {
  status?: string;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  hostId?: number;
  propertyId?: number;
  format?: 'csv' | 'xlsx';
}

// Response Types - Booking List

export interface AdminBookingListResponse {
  bookings: AdminBookingListDto[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminBookingListDto {
  id: number;
  bookingCode: string;
  
  // Customer Info
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Property & Host Info
  propertyId: number;
  propertyName: string;
  hostId: number;
  hostName: string;
  hostEmail: string;
  
  // Room Info
  roomTypeId: number;
  roomTypeName: string;
  
  // Booking Details
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  roomsCount: number;
  
  // Guest Info
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  
  // Financial
  totalAmount: number;
  roomPrice: number;
  discountAmount: number;
  serviceFee: number;
  taxAmount: number;
  
  // Status
  status: string;
  paymentStatus: string;
  
  // Timestamps
  bookingDate: string;
  confirmedAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  cancelledAt?: string;
  updatedAt: string;
  
  // Refund Info
  hasRefundTicket: boolean;
  refundTicketStatus?: string;
  refundTicketAmount?: number;
  hasRefund: boolean;
  refundedAmount?: number;
}

// Response Types - Booking Detail

export interface AdminBookingDetailDto {
  // Basic Info
  id: number;
  bookingCode: string;
  
  // Customer Details
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAvatar?: string;
  
  // Property & Host Details
  propertyId: number;
  propertyName: string;
  propertyAddress: string;
  hostId: number;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  
  // Room Details
  roomTypeId: number;
  roomTypeName: string;
  totalRooms: number;
  maxGuests: number;
  
  // Booking Details
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  roomsCount: number;
  
  // Guest Information
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestIdNumber?: string;
  specialRequests?: string;
  
  // Financial Breakdown
  roomPrice: number;
  discountPercent: number;
  discountAmount: number;
  couponDiscountPercent: number;
  couponDiscountAmount: number;
  taxAmount: number;
  serviceFee: number;
  totalAmount: number;
  
  // Status & Source
  status: string;
  paymentStatus: string;
  bookingSource?: string;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  
  // Timestamps
  bookingDate: string;
  confirmedAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  cancelledAt?: string;
  updatedAt: string;
  
  // Refund Ticket (Customer Request)
  refundTicket?: RefundTicketDto;
  
  // Refunds (Admin Processed)
  refunds: RefundDto[];
  
  // Reviews
  reviews: ReviewSummaryDto[];
  
  // Payments
  payments: PaymentSummaryDto[];
}

export interface RefundTicketDto {
  id: number;
  requestedAmount: number;
  reason: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

export interface RefundDto {
  id: number;
  refundTicketId: number;
  approvedBy: number;
  approvedByName: string;
  refundedAmount: number;
  receiverBankName: string;
  receiverAccount: string;
  receiverName: string;
  paymentMethod: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
}

export interface ReviewSummaryDto {
  id: number;
  overallRating: number;
  title: string;
  reviewText: string;
  status: string;
  createdAt: string;
}

export interface PaymentSummaryDto {
  id: number;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

// Response Types - Statistics

export interface AdminBookingStatisticsDto {
  // Basic Counts
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  checkedInBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  
  // Financial Statistics
  totalRevenue: number;
  pendingRevenue: number;
  confirmedRevenue: number;
  completedRevenue: number;
  cancelledRevenue: number;
  averageBookingValue: number;
  
  // Guest Statistics
  totalGuests: number;
  totalAdults: number;
  totalChildren: number;
  averageGuestsPerBooking: number;
  
  // Room Statistics
  totalRoomsBooked: number;
  averageRoomsPerBooking: number;
  averageNights: number;
  
  // Payment Statistics
  totalPaid: number;
  totalUnpaid: number;
  paidAmount: number;
  unpaidAmount: number;
  
  // Refund Statistics
  totalRefundTickets: number;
  pendingRefundTickets: number;
  approvedRefundTickets: number;
  rejectedRefundTickets: number;
  totalRefundRequested: number;
  totalRefunded: number;
  totalRefundProcessed: number;
  
  // Source Statistics
  bookingsBySource: Record<string, number>;
  revenueBySource: Record<string, number>;
  
  // Monthly Trends
  bookingsByMonth: Record<string, number>;
  revenueByMonth: Record<string, number>;
  
  // Property Statistics
  bookingsByProperty: Record<number, PropertyStatsDto>;
  
  // Customer Statistics
  uniqueCustomers: number;
  returningCustomers: number;
  returnRate: number;
}

export interface PropertyStatsDto {
  propertyId: number;
  propertyName: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
}

// Response Types - Dashboard

export interface DashboardOverviewDto {
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  confirmedBookings: number;
  checkedInBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingRefundTickets: number;
  totalGuests: number;
  averageBookingValue: number;
  occupancyRate: number;
}

export interface RevenueChartDto {
  groupBy: string;
  data: RevenueDataPoint[];
  totalRevenue: number;
  totalBookings: number;
}

export interface RevenueDataPoint {
  period: string;
  revenue: number;
  bookingCount: number;
}

export interface BookingTrendsDto {
  monthlyTrends: MonthlyTrendDto[];
  overallGrowthRate: number;
}

export interface MonthlyTrendDto {
  month: string;
  totalBookings: number;
  revenue: number;
  cancellationRate: number;
}

export interface TopPropertyDto {
  propertyId: number;
  propertyName: string;
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
}

export interface TopCustomerDto {
  customerId: number;
  customerName: string;
  customerEmail: string;
  totalBookings: number;
  totalSpent: number;
  averageSpent: number;
}

export interface DashboardAlertsDto {
  pendingBookingsCount: number;
  checkInsTodayCount: number;
  checkOutsTodayCount: number;
  lateCheckoutsCount: number;
  unpaidBookingsCount: number;
  pendingRefundsCount: number;
  totalAlertsCount: number;
}
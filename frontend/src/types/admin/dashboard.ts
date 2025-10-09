// Base API Response
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

// Dashboard Overview
export interface DashboardOverview {
  totalBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProperties: number;
  pendingBookings: number;
  checkInsToday: number;
  checkOutsToday: number;
  activeRefundTickets: number;
  averageBookingValue: number;
}

export interface GetOverviewRequest {
  startDate?: string;
  endDate?: string;
}

// Revenue Chart
export interface RevenueChartItem {
  period: string;
  revenue: number;
  bookingCount: number;
}

export type RevenueChartData = RevenueChartItem[];

export interface GetRevenueChartRequest {
  period?: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
}

// Booking Status
export interface BookingStatusItem {
  status: string;
  count: number;
  totalAmount: number;
}

export type BookingStatusData = BookingStatusItem[];

// Top Properties
export interface TopPropertyItem {
  propertyId: number;
  propertyName: string;
  bookingCount: number;
  totalRevenue: number;
  averageRating: number;
}

export type TopPropertiesData = TopPropertyItem[];

export interface GetTopPropertiesRequest {
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// Recent Bookings
export interface RecentBookingItem {
  bookingId: number;
  bookingCode: string;
  customerName: string;
  propertyName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  bookingDate: string;
}

export type RecentBookingsData = RecentBookingItem[];

export interface GetRecentBookingsRequest {
  limit?: number;
}

// Occupancy Rate
export interface OccupancyRateData {
  date: string;
  totalRooms: number;
  bookedRooms: number;
  availableRooms: number;
  occupancyPercentage: number;
}

export interface GetOccupancyRateRequest {
  date?: string;
}

// Customer Growth
export interface CustomerGrowthItem {
  period: string;
  newCustomers: number;
  totalCustomers: number;
}

export type CustomerGrowthData = CustomerGrowthItem[];

export interface GetCustomerGrowthRequest {
  startDate?: string;
  endDate?: string;
}

// Payment Methods
export interface PaymentMethodItem {
  method: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export type PaymentMethodsData = PaymentMethodItem[];

export interface GetPaymentMethodsRequest {
  startDate?: string;
  endDate?: string;
}

// Reviews Summary
export interface RatingDistributionItem {
  rating: number;
  count: number;
}

export interface ReviewsSummaryData {
  totalReviews: number;
  averageRating: number;
  averageCleanliness: number;
  averageLocation: number;
  averageService: number;
  averageValue: number;
  ratingDistribution: RatingDistributionItem[];
}

export interface GetReviewsSummaryRequest {
  startDate?: string;
  endDate?: string;
}
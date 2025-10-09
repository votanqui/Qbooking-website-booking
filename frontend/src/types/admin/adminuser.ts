// my-next-app/src/types/adminuser.ts

export interface UserDetailResponse {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  addressDetail?: string;
  province?: string;
  commune?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt: string;
}

export interface GetUsersResponse {
  users: UserDetailResponse[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PropertyStatsResponse {
  totalProperties: number;
  activeProperties: number;
  pendingProperties: number;
  rejectedProperties: number;
  totalViews: number;
}

export interface BookingStatsResponse {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  totalRevenue: number;
  totalHostBookings: number;
}

export interface SearchHistoryResponseUser {
  id: number;
  searchKeyword?: string;
  propertyType?: string;
  provinceId?: number;
  checkIn?: string;
  checkOut?: string;
  resultCount: number;
  createdAt: string;
}

export interface UserFullDetailResponse {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  addressDetail?: string;
  province?: string;
  commune?: string;
  provinceId?: number;
  communeId?: number;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt: string;
  propertyStats?: PropertyStatsResponse;
  bookingStats: BookingStatsResponse;
  recentSearches: SearchHistoryResponseUser[];
}

export interface BookingResponse {
  id: number;
  bookingCode: string;
  propertyName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  roomsCount: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  bookingDate: string;
}

export interface GetUserBookingsResponse {
  bookings: BookingResponse[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface UsersStatisticsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  customerCount: number;
  hostCount: number;
  adminCount: number;
  newUsersLast30Days: number;
}

export interface GetUsersRequest {
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  provinceId?: number;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: string;
  pageNumber: number;
  pageSize: number;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
  reason?: string;
}

export interface UpdateUserRoleRequest {
  role: string;
  reason?: string;
}

export interface GetUserBookingsRequest {
  status?: string;
  paymentStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: string;
  pageNumber: number;
  pageSize: number;
}

export interface AdminResetPasswordRequest {
  newPassword: string;
  reason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}
export interface LoginHistory {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  loginTime: string;
  ipAddress: string;
  deviceInfo: string;
  isSuccess: boolean;
  failureReason?: string;
  createdAt: string;
}

export interface GetUserLoginHistoryRequest {
  userId: number;
  page?: number;
  pageSize?: number;
  isSuccess?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface GetUserLoginHistoryResponse {
  userId: number;
  userName: string;
  userEmail: string;
  histories: LoginHistory[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
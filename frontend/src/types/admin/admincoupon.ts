//types/admin/admincoupon.ts
// ==================== Base Types ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// ==================== Coupon Models ====================

export interface CouponApplicationResponse {
  id: number;
  applicableType: string;
  applicableId: number;
  applicableName?: string;
}

export interface AdminCouponResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  minNights: number;
  applicableDays?: string;
  applicableTo: string;
  startDate: string;
  endDate: string;
  maxTotalUses?: number;
  maxUsesPerCustomer: number;
  usedCount: number;
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  applications: CouponApplicationResponse[];
}

// ==================== Request Types ====================

export interface CouponApplicationRequest {
  applicableType: string;
  applicableId: number;
}

export interface CreateCouponRequest {
  code: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  minNights: number;
  applicableDays?: string;
  applicableTo: string;
  startDate: string;
  endDate: string;
  maxTotalUses?: number;
  maxUsesPerCustomer: number;
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  applications?: CouponApplicationRequest[];
}

export interface UpdateCouponRequest {
  code: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  minNights: number;
  applicableDays?: string;
  applicableTo: string;
  startDate: string;
  endDate: string;
  maxTotalUses?: number;
  maxUsesPerCustomer: number;
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  applications?: CouponApplicationRequest[];
}

export interface DuplicateCouponRequest {
  newCode: string;
}

export interface GetAllCouponsRequest {
  keyword?: string;
  isFeatured?: boolean;
  isPublic?: boolean;
  isActive?: boolean;
  discountType?: string;
  applicableTo?: string;
  page: number;
  pageSize: number;
}

export interface GetTopUsedCouponsRequest {
  limit: number;
  startDate?: Date;
  endDate?: Date;
}

export interface GetUsageHistoryRequest {
  couponId?: number;
  customerId?: number;
  customerEmail?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  pageSize: number;
}

export interface GetPerformanceReportRequest {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

export interface GetTopCustomersRequest {
  limit: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ExportCouponsRequest {
  startDate?: Date;
  endDate?: Date;
}

// ==================== Statistics & Reports ====================

export interface CouponOverviewStatisticsResponse {
  totalCoupons: number;
  activeCoupons: number;
  inactiveCoupons: number;
  expiredCoupons: number;
  totalUsages: number;
  totalDiscountAmount: number;
  uniqueCustomers: number;
  averageDiscountPerUsage: number;
  thisMonthUsages: number;
  thisMonthDiscountAmount: number;
}

export interface CouponDetailStatisticsResponse {
  couponId: number;
  couponCode: string;
  couponName: string;
  totalUsages: number;
  totalDiscountAmount: number;
  uniqueCustomers: number;
  averageDiscountAmount: number;
  usageRate: number;
  remainingUses?: number;
  daysUntilExpiry: number;
  isActive: boolean;
  isExpired: boolean;
}

export interface TopUsedCouponResponse {
  couponId: number;
  couponCode: string;
  couponName: string;
  usageCount: number;
  totalDiscountAmount: number;
  discountType: string;
  isActive: boolean;
}

export interface AdminCouponUsageHistoryResponse {
  id: number;
  couponCode: string;
  couponName: string;
  customerEmail: string;
  customerName: string;
  bookingCode: string;
  discountAmount: number;
  usedAt: string;
}

export interface PerformanceDataPoint {
  period: string;
  usageCount: number;
  totalDiscountAmount: number;
  uniqueCustomers: number;
}

export interface CouponPerformanceReportResponse {
  startDate: string;
  endDate: string;
  groupBy: string;
  dataPoints: PerformanceDataPoint[];
  totalUsages: number;
  totalDiscountAmount: number;
  averageDiscountPerPeriod: number;
}

export interface ExpiringSoonCouponResponse {
  id: number;
  code: string;
  name: string;
  endDate: string;
  daysRemaining: number;
  usedCount: number;
  maxTotalUses?: number;
  isPublic: boolean;
}

export interface TopCouponCustomerResponse {
  customerId: number;
  customerEmail: string;
  customerName: string;
  totalCouponUsages: number;
  totalSavingsAmount: number;
  uniqueCouponsUsed: number;
}

// ==================== Helper Response Types ====================

export interface CodeAvailabilityResponse {
  isAvailable: boolean;
  message: string;
}

export interface DiscountTypeResponse {
  value: string;
  label: string;
  description: string;
}

export interface ApplicableToTypeResponse {
  value: string;
  label: string;
  description: string;
}

// ==================== Enums ====================

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixedAmount',
  FREE_NIGHT = 'freeNight'
}

export enum ApplicableToType {
  ALL = 'all',
  PROPERTY = 'property',
  PROPERTY_TYPE = 'propertyType',
  LOCATION = 'location'
}

export enum CouponGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

// ==================== Form Data Types ====================

export interface CouponFormData {
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  minNights: number;
  applicableDays: string;
  applicableTo: ApplicableToType;
  startDate: Date;
  endDate: Date;
  maxTotalUses: number | null;
  maxUsesPerCustomer: number;
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  applications: CouponApplicationRequest[];
}

// ==================== Filter Types ====================

export interface CouponFilterOptions {
  keyword?: string;
  isFeatured?: boolean;
  isPublic?: boolean;
  isActive?: boolean;
  discountType?: DiscountType;
  applicableTo?: ApplicableToType;
}

// ==================== Table Column Types ====================

export interface CouponTableRow extends AdminCouponResponse {
  // Additional computed fields for table display
  discountDisplay: string;
  statusDisplay: string;
  usageDisplay: string;
  validityDisplay: string;
}

// ==================== Chart Data Types ====================

export interface CouponChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface CouponStatisticsCard {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: string;
}

// ==================== Validation Types ====================

export interface CouponValidationError {
  field: string;
  message: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  errors: CouponValidationError[];
}

// ==================== Export Types ====================

export interface CouponExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  startDate?: Date;
  endDate?: Date;
  includeUsageHistory?: boolean;
  includeStatistics?: boolean;
}
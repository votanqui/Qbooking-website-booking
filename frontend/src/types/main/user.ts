// types/user.ts
export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
  addressDetail?: string;
  province?: string;
  commune?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
    provinceId?: number;    // Thêm
  communeId?: number;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  addressDetail?: string;
  communeId?: number;
  provinceId?: number;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface UserStatistics {
  totalProperties: number;
  activeProperties: number;
  totalBookings: number;
  totalViews: number;
  totalRevenue: number;
}

export interface PropertySummary {
  id: number;
  name: string;
  slug: string;
  type: string;
  productTypeId: number;
  productTypeCode: string;
  description: string;
  shortDescription: string;
  addressDetail: string;
  province: string;
  commune?: string;
  starRating: number;
  totalRooms: number;
  priceFrom: number;
  currency: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  bookingCount: number;
  primaryImage?: string;
  imageCount: number;
  roomTypeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUserPropertiesResponse {
  properties: PropertySummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetUserPropertiesRequest {
  status?: string;
  productTypeId?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  pageNumber: number;
  pageSize: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}

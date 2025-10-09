// ============= BASE RESPONSE =============

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: string;
}

// ============= PAGINATION =============

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============= CATEGORY TYPES =============

export interface AmenityCategoryResponse {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
  amenities?: AmenityResponse[];
}

export interface CreateAmenityCategoryRequest {
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder?: number;
}

export interface UpdateAmenityCategoryRequest {
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
}

// ============= AMENITY TYPES =============

export interface AmenityResponse {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isPopular: boolean;
  sortOrder: number;
  categoryName?: string;
}

export interface CreateAmenityRequest {
  categoryId: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isPopular?: boolean;
  sortOrder?: number;
}

export interface UpdateAmenityRequest {
  categoryId: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isPopular: boolean;
  sortOrder: number;
}

export interface UpdateSortOrderRequest {
  sortOrder: number;
}

// ============= REQUEST TYPES =============

export interface GetAmenitiesRequest {
  page: number;
  pageSize: number;
  categoryId?: number;
  isPopular?: boolean;
}

// ============= STATISTICS TYPES =============

export interface CategoryWithCount {
  categoryId: number;
  categoryName: string;
  amenityCount: number;
  propertyCount: number;
}

export interface AmenityStatisticsOverview {
  totalCategories: number;
  totalAmenities: number;
  popularAmenities: number;
  totalPropertyAmenities: number;
  topCategories: CategoryWithCount[];
}

export interface AmenityUsageStatistics {
  amenityId: number;
  amenityName: string;
  categoryName: string;
  icon: string;
  isPopular: boolean;
  usageCount: number;
  propertyCount: number;
}

export interface UnusedAmenityResponse {
  id: number;
  name: string;
  categoryName: string;
  icon: string;
  isPopular: boolean;
}

export interface CategoryStatistics {
  categoryId: number;
  categoryName: string;
  icon: string;
  totalAmenities: number;
  popularAmenities: number;
  totalUsage: number;
  uniqueProperties: number;
  averageUsagePerAmenity: number;
}
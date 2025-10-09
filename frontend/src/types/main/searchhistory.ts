export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

export interface ProvinceResponse {
  id: number;
  name: string;
  code: string;
}

export interface CommuneResponse {
  id: number;
  name: string;
  code: string;
}

// Main Search History Response
export interface SearchHistoryResponse {
  id: number;
  userId?: number;
  sessionId?: string;
  searchKeyword?: string;
  provinceId?: number;
  communeId?: number;
  propertyType?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  priceMin?: number;
  priceMax?: number;
  starRating?: number;
  resultCount?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: UserResponse;
  province?: ProvinceResponse;
  commune?: CommuneResponse;
}

// List Response with Pagination
export interface SearchHistoryListResponse {
  items: SearchHistoryResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Request Types
export interface SearchHistoryFilterRequest {
  userId?: number;
  sessionId?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
}

// DTO đơn giản - không cần sessionId, ipAddress, userAgent
export interface CreateSearchHistoryRequest {
  searchKeyword?: string;
  provinceId?: number;
  communeId?: number;
  propertyType?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  priceMin?: number;
  priceMax?: number;
  starRating?: number;
  resultCount?: number;
}

export interface UpdateSearchHistoryRequest {
  searchKeyword?: string;
  provinceId?: number;
  communeId?: number;
  propertyType?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  priceMin?: number;
  priceMax?: number;
  starRating?: number;
  resultCount?: number;
}

// Statistics Response Types
export interface TopSearchKeywordResponse {
  keyword: string;
  count: number;
}

export interface TopProvinceResponse {
  provinceId?: number;
  provinceName: string;
  count: number;
}

export interface UserSearchStatsResponse {
  totalSearches: number;
  topSearchKeywords: TopSearchKeywordResponse[];
  topProvinces: TopProvinceResponse[];
}

export interface PopularSearchResponse {
  keyword: string;
  count: number;
}

export interface PopularSearchesRequest {
  fromDate?: string;
  toDate?: string;
  limit: number;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}
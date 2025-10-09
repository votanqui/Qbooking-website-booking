// types/adminaddress.ts

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}

// ============= Province Types =============
export interface Province {
  id: number;
  name: string;
  slug: string;
  code: string;
  region: string;
  type: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProvinceStatistics {
  provinceId: number;
  provinceName: string;
  provinceCode: string;
  region: string;
  isActive: boolean;
  totalUsers: number;
  totalProperties: number;
  activeProperties: number;
  totalCommunes: number;
  totalBookings: number;
}

export interface ProvinceStatisticsSummary {
  totalProvinces: number;
  activeProvinces: number;
  inactiveProvinces: number;
  totalUsersAcrossAllProvinces: number;
  totalPropertiesAcrossAllProvinces: number;
  provinceWithMostUsers: string;
  provinceWithMostProperties: string;
}

export interface ProvinceStatisticsResponse {
  summary: ProvinceStatisticsSummary;
  details: ProvinceStatistics[];
}

export interface ProvinceTopUsers {
  provinceId: number;
  totalUsers: number;
  activeUsers: number;
  customersCount: number;
  hostsCount: number;
  adminsCount: number;
  provinceName: string;
  provinceCode: string;
  region: string;
}

export interface ProvinceDetail {
  id: number;
  name: string;
  slug: string;
  code: string;
  region: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  statistics: {
    totalCommunes: number;
    activeCommunes: number;
    totalUsers: number;
    activeUsers: number;
    totalProperties: number;
    activeProperties: number;
    approvedProperties: number;
    totalBookings: number;
    totalReviews: number;
  };
}

export interface ProvinceTopProperties {
  tinhId: number;
  soLuongProperty: number;
  tenTinh: string;
}

// ============= Commune Types =============
export interface Commune {
  id: number;
  name: string;
  slug: string;
  code: string;
  type: string;
  provinceName: string;
  provinceCode: string;
  isActive?: boolean;
}

export interface CommuneStatistics {
  communeId: number;
  communeName: string;
  communeCode: string;
  communeType: string;
  isActive: boolean;
  provinceName: string;
  provinceCode: string;
  totalUsers: number;
  totalProperties: number;
  activeProperties: number;
}

export interface CommuneStatisticsSummary {
  totalCommunes: number;
  activeCommunes: number;
  inactiveCommunes: number;
  totalUsersInCommunes: number;
  totalPropertiesInCommunes: number;
  communeWithMostUsers: string;
  communeWithMostProperties: string;
}

export interface CommuneStatisticsResponse {
  summary: CommuneStatisticsSummary;
  details: CommuneStatistics[];
}

export interface CommuneTopProperties {
  communeId: number;
  totalProperties: number;
  activeProperties: number;
  approvedProperties: number;
  featuredProperties: number;
  totalBookings: number;
  totalViews: number;
  communeName: string;
  communeCode: string;
  provinceName: string;
}

export interface CommunePaginationResponse {
  items: Commune[];
  pagination: PaginationInfo;
}

// ============= Dashboard Types =============
export interface DashboardOverview {
  totalProvinces: number;
  activeProvinces: number;
  inactiveProvinces: number;
  totalCommunes: number;
  activeCommunes: number;
  inactiveCommunes: number;
}

export interface TopProvinceByProperties {
  provinceId: number;
  provinceName: string;
  totalProperties: number;
}

export interface TopProvinceByUsers {
  provinceId: number;
  provinceName: string;
  totalUsers: number;
}

export interface RegionDistribution {
  region: string;
  totalProvinces: number;
  totalProperties: number;
  totalUsers: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  topProvincesByProperties: TopProvinceByProperties[];
  topProvincesByUsers: TopProvinceByUsers[];
  regionDistribution: RegionDistribution[];
}

// ============= Map Types =============
export interface PropertyForMap {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  primaryImage: string | null;
}

// ============= Pagination Types =============
export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============= Status Toggle Types =============
export interface StatusToggleResponse {
  id: number;
  name: string;
  isActive: boolean;
  provinceName?: string; // For commune toggle
}

// ============= Query Parameters =============
export interface ProvinceSearchParams {
  name?: string;
  code?: string;
  region?: string;
}

export interface CommuneSearchParams {
  name?: string;
  code?: string;
  provinceCode?: string;
  page?: number;
  pageSize?: number;
}

export interface TopQueryParams {
  top?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
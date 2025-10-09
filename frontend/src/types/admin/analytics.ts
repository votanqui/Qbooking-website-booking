// Base API Response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  error?: string;
}

// 1. Search Trends Types
export interface SearchTrendItem {
  period: string;
  totalSearches: number;
  uniqueUsers: number;
  uniqueSessions: number;
  avgResultCount: number;
}

export interface SearchTrendsResponse {
  startDate: string;
  endDate: string;
  groupBy: string;
  trends: SearchTrendItem[];
}

export interface GetSearchTrendsRequest {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

// 2. Top Keywords Types
export interface KeywordItem {
  keyword: string;
  searchCount: number;
  uniqueUsers: number;
  avgResultCount: number;
  lastSearched: string;
}

export interface TopKeywordsResponse {
  period: string;
  top: number;
  keywords: KeywordItem[];
}

export interface GetTopKeywordsRequest {
  top?: number;
  days?: number;
}

// 3. Popular Locations Types
export interface LocationItem {
  locationId: number;
  locationName: string;
  searchCount: number;
  uniqueUsers: number;
}

export interface CommuneLocationItem {
  communeId: number;
  communeName: string;
  provinceId: number;
  searchCount: number;
}

export interface PopularLocationsResponse {
  topProvinces: LocationItem[];
  topCommunes: CommuneLocationItem[];
}

export interface GetPopularLocationsRequest {
  top?: number;
}

// 4. Property Type Distribution Types
export interface PropertyTypeItem {
  propertyType: string;
  count: number;
  percentage: number;
}

export interface PropertyTypeDistributionResponse {
  period: string;
  totalSearches: number;
  distribution: PropertyTypeItem[];
}

export interface GetPropertyTypeDistributionRequest {
  days?: number;
}

// 5. Price Range Analysis Types
export interface PriceRangeItem {
  range: string;
  count: number;
}

export interface PriceRangeAnalysisResponse {
  distribution: PriceRangeItem[];
  averagePriceMin: number;
  averagePriceMax: number;
}

// 6. Property Views Stats Types
export interface ViewsByDayItem {
  date: string;
  count: number;
}

export interface PropertyViewsStatsResponse {
  startDate: string;
  endDate: string;
  totalViews: number;
  uniqueProperties: number;
  uniqueUsers: number;
  uniqueIPAddresses: number;
  avgViewsPerProperty: number;
  viewsByDay: ViewsByDayItem[];
}

export interface GetPropertyViewsStatsRequest {
  startDate?: string;
  endDate?: string;
}

// 7. Top Viewed Properties Types
export interface TopPropertyItem {
  propertyId: number;
  propertyTitle: string;
  viewCount: number;
  uniqueViewers: number;
  lastViewed: string;
}

export interface TopViewedPropertiesResponse {
  period: string;
  top: number;
  properties: TopPropertyItem[];
}

export interface GetTopViewedPropertiesRequest {
  top?: number;
  days?: number;
}

// 8. User Journey Types
export interface SearchHistoryItem {
  searchKeyword: string;
  createdAt: string;
  resultCount: number;
  provinceName: string;
  communeName: string;
}

export interface ViewHistoryItem {
  propertyId: number;
  propertyTitle: string;
  viewedAt: string;
}

export interface UserJourneyResponse {
  userId: number;
  totalSearches: number;
  totalViews: number;
  firstActivity: string | null;
  lastActivity: string | null;
  searchHistory: SearchHistoryItem[];
  viewHistory: ViewHistoryItem[];
}

// 9. Conversion Rate Types
export interface ConversionRateResponse {
  period: string;
  totalSearches: number;
  usersWhoSearched: number;
  usersWhoViewed: number;
  conversionRate: number;
  avgSearchesPerUser: number;
}

export interface GetConversionRateRequest {
  days?: number;
}

// 10. Peak Hours Types
export interface HourlyActivityItem {
  hour: number;
  count: number;
}

export interface PeakHoursResponse {
  period: string;
  searchesByHour: HourlyActivityItem[];
  viewsByHour: HourlyActivityItem[];
  peakSearchHour: number | null;
  peakViewHour: number | null;
}

export interface GetPeakHoursRequest {
  days?: number;
}
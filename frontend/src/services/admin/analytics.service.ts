import {
  ApiResponse,
  SearchTrendsResponse,
  GetSearchTrendsRequest,
  TopKeywordsResponse,
  GetTopKeywordsRequest,
  PopularLocationsResponse,
  GetPopularLocationsRequest,
  PropertyTypeDistributionResponse,
  GetPropertyTypeDistributionRequest,
  PriceRangeAnalysisResponse,
  PropertyViewsStatsResponse,
  GetPropertyViewsStatsRequest,
  TopViewedPropertiesResponse,
  GetTopViewedPropertiesRequest,
  UserJourneyResponse,
  ConversionRateResponse,
  GetConversionRateRequest,
  PeakHoursResponse,
  GetPeakHoursRequest,
} from '@/types/admin/analytics';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AnalyticsService {
  
  // 1. Lấy xu hướng tìm kiếm theo thời gian
  async getSearchTrends(request?: GetSearchTrendsRequest): Promise<ApiResponse<SearchTrendsResponse>> {
    const params = new URLSearchParams();
    
    if (request?.startDate) params.append('startDate', request.startDate);
    if (request?.endDate) params.append('endDate', request.endDate);
    if (request?.groupBy) params.append('groupBy', request.groupBy);

    const url = params.toString() 
      ? `${API_BASE_URL}/Analytics/search-trends?${params}`
      : `${API_BASE_URL}/Analytics/search-trends`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // 2. Lấy top từ khóa tìm kiếm phổ biến
  async getTopKeywords(request?: GetTopKeywordsRequest): Promise<ApiResponse<TopKeywordsResponse>> {
    const params = new URLSearchParams();
    
    if (request?.top) params.append('top', request.top.toString());
    if (request?.days) params.append('days', request.days.toString());

    const url = params.toString()
      ? `${API_BASE_URL}/Analytics/top-keywords?${params}`
      : `${API_BASE_URL}/Analytics/top-keywords`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // 3. Lấy địa điểm tìm kiếm phổ biến
  async getPopularLocations(request?: GetPopularLocationsRequest): Promise<ApiResponse<PopularLocationsResponse>> {
    const params = new URLSearchParams();
    
    if (request?.top) params.append('top', request.top.toString());

    const url = params.toString()
      ? `${API_BASE_URL}/Analytics/popular-locations?${params}`
      : `${API_BASE_URL}/Analytics/popular-locations`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // 4. Lấy phân bố loại hình property
  async getPropertyTypeDistribution(request?: GetPropertyTypeDistributionRequest): Promise<ApiResponse<PropertyTypeDistributionResponse>> {
    const params = new URLSearchParams();
    
    if (request?.days) params.append('days', request.days.toString());

    const url = params.toString()
      ? `${API_BASE_URL}/Analytics/property-type-distribution?${params}`
      : `${API_BASE_URL}/Analytics/property-type-distribution`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // 5. Lấy phân tích khoảng giá
  async getPriceRangeAnalysis(): Promise<ApiResponse<PriceRangeAnalysisResponse>> {
    const response = await fetch(`${API_BASE_URL}/Analytics/price-range-analysis`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // 6. Lấy thống kê lượt xem property
  async getPropertyViewsStats(request?: GetPropertyViewsStatsRequest): Promise<ApiResponse<PropertyViewsStatsResponse>> {
    const params = new URLSearchParams();
    
    if (request?.startDate) params.append('startDate', request.startDate);
    if (request?.endDate) params.append('endDate', request.endDate);

    const url = params.toString()
      ? `${API_BASE_URL}/Analytics/property-views-stats?${params}`
      : `${API_BASE_URL}/Analytics/property-views-stats`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // 7. Lấy top properties được xem nhiều nhất
  async getTopViewedProperties(request?: GetTopViewedPropertiesRequest): Promise<ApiResponse<TopViewedPropertiesResponse>> {
    const params = new URLSearchParams();
    
    if (request?.top) params.append('top', request.top.toString());
    if (request?.days) params.append('days', request.days.toString());

    const url = params.toString()
      ? `${API_BASE_URL}/Analytics/top-viewed-properties?${params}`
      : `${API_BASE_URL}/Analytics/top-viewed-properties`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // 8. Lấy hành trình người dùng
  async getUserJourney(userId: number): Promise<ApiResponse<UserJourneyResponse>> {
    const response = await fetch(`${API_BASE_URL}/Analytics/user-journey/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // 9. Lấy tỷ lệ chuyển đổi
  async getConversionRate(request?: GetConversionRateRequest): Promise<ApiResponse<ConversionRateResponse>> {
    const params = new URLSearchParams();
    
    if (request?.days) params.append('days', request.days.toString());

    const url = params.toString()
      ? `${API_BASE_URL}/Analytics/conversion-rate?${params}`
      : `${API_BASE_URL}/Analytics/conversion-rate`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // 10. Lấy giờ cao điểm
  async getPeakHours(request?: GetPeakHoursRequest): Promise<ApiResponse<PeakHoursResponse>> {
    const params = new URLSearchParams();
    
    if (request?.days) params.append('days', request.days.toString());

    const url = params.toString()
      ? `${API_BASE_URL}/Analytics/peak-hours?${params}`
      : `${API_BASE_URL}/Analytics/peak-hours`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }
}

export const analyticsService = new AnalyticsService();
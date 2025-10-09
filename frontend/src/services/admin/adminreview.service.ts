import {
  ApiResponse,
  AdminReviewFilterRequest,
  ReviewListResponse,
  ReviewResponse,
  UpdateReviewStatusRequest,
  StatisticsFilterRequest,
  ReviewStatisticsResponse,
  TrendsFilterRequest,
  ReviewTrendResponse,
  TopPropertiesFilterRequest,
  TopPropertyResponse,
  RatingDistributionResponse,
  HostResponseStatisticsResponse
} from '@/types/admin/adminreview';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AdminReviewService {
  
  // ===== ADMIN MANAGEMENT APIs =====

  /**
   * Get all reviews with advanced filtering
   */
  async getAllReviews(request: AdminReviewFilterRequest): Promise<ApiResponse<ReviewListResponse>> {
    const params = new URLSearchParams();
    
    params.append('page', request.page.toString());
    params.append('pageSize', request.pageSize.toString());
    
    if (request.customerId) params.append('customerId', request.customerId.toString());
    if (request.propertyId) params.append('propertyId', request.propertyId.toString());
    if (request.minRating) params.append('minRating', request.minRating.toString());
    if (request.maxRating) params.append('maxRating', request.maxRating.toString());
    if (request.status) params.append('status', request.status);
    if (request.hasHostReply !== undefined) params.append('hasHostReply', request.hasHostReply.toString());
    if (request.isFeatured !== undefined) params.append('isFeatured', request.isFeatured.toString());
    if (request.isVerified !== undefined) params.append('isVerified', request.isVerified.toString());
    if (request.fromDate) params.append('fromDate', request.fromDate.toISOString());
    if (request.toDate) params.append('toDate', request.toDate.toISOString());
    if (request.searchText) params.append('searchText', request.searchText);
    if (request.sortBy) params.append('sortBy', request.sortBy);
    if (request.sortOrder) params.append('sortOrder', request.sortOrder);

    const response = await fetch(`${API_BASE_URL}/Review/admin/reviews?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: number): Promise<ApiResponse<ReviewResponse>> {
    const response = await fetch(`${API_BASE_URL}/Review/admin/reviews/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Update review status (published/hidden)
   */
  async updateReviewStatus(id: number, data: UpdateReviewStatusRequest): Promise<ApiResponse<ReviewResponse>> {
    const response = await fetch(`${API_BASE_URL}/Review/admin/reviews/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  /**
   * Toggle featured status
   */
  async toggleFeaturedStatus(id: number): Promise<ApiResponse<ReviewResponse>> {
    const response = await fetch(`${API_BASE_URL}/Review/admin/reviews/${id}/featured`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Delete review
   */
  async deleteReview(id: number): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${API_BASE_URL}/Review/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Delete host reply
   */
  async deleteHostReply(reviewId: number): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${API_BASE_URL}/Review/admin/reviews/${reviewId}/host-reply`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // ===== STATISTICS APIs =====

  /**
   * Get review statistics overview
   */
  async getReviewStatistics(request: StatisticsFilterRequest): Promise<ApiResponse<ReviewStatisticsResponse>> {
    const params = new URLSearchParams();
    
    if (request.fromDate) params.append('fromDate', request.fromDate.toISOString());
    if (request.toDate) params.append('toDate', request.toDate.toISOString());
    if (request.propertyId) params.append('propertyId', request.propertyId.toString());

    const response = await fetch(`${API_BASE_URL}/Review/admin/statistics/overview?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get review trends by date range
   */
  async getReviewTrends(request: TrendsFilterRequest): Promise<ApiResponse<ReviewTrendResponse[]>> {
    const params = new URLSearchParams();
    
    if (request.fromDate) params.append('fromDate', request.fromDate.toISOString());
    if (request.toDate) params.append('toDate', request.toDate.toISOString());
    if (request.propertyId) params.append('propertyId', request.propertyId.toString());
    if (request.groupBy) params.append('groupBy', request.groupBy);

    const response = await fetch(`${API_BASE_URL}/Review/admin/statistics/trends?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get top rated properties
   */
  async getTopRatedProperties(request: TopPropertiesFilterRequest): Promise<ApiResponse<TopPropertyResponse[]>> {
    const params = new URLSearchParams();
    
    if (request.fromDate) params.append('fromDate', request.fromDate.toISOString());
    if (request.toDate) params.append('toDate', request.toDate.toISOString());
    if (request.minReviewCount) params.append('minReviewCount', request.minReviewCount.toString());
    params.append('limit', request.limit.toString());

    const response = await fetch(`${API_BASE_URL}/Review/admin/statistics/top-properties?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get rating distribution
   */
  async getRatingDistribution(request: StatisticsFilterRequest): Promise<ApiResponse<RatingDistributionResponse>> {
    const params = new URLSearchParams();
    
    if (request.fromDate) params.append('fromDate', request.fromDate.toISOString());
    if (request.toDate) params.append('toDate', request.toDate.toISOString());
    if (request.propertyId) params.append('propertyId', request.propertyId.toString());

    const response = await fetch(`${API_BASE_URL}/Review/admin/statistics/rating-distribution?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get host response statistics
   */
  async getHostResponseStatistics(request: StatisticsFilterRequest): Promise<ApiResponse<HostResponseStatisticsResponse>> {
    const params = new URLSearchParams();
    
    if (request.fromDate) params.append('fromDate', request.fromDate.toISOString());
    if (request.toDate) params.append('toDate', request.toDate.toISOString());
    if (request.propertyId) params.append('propertyId', request.propertyId.toString());

    const response = await fetch(`${API_BASE_URL}/Review/admin/statistics/host-responses?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }
}

export const adminReviewService = new AdminReviewService();
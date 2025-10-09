import {
  CreateReviewRequest,
  UpdateReviewRequest,
  HostReplyRequest,
  ReviewFilterRequest,
  ReviewResponse,
  ReviewListResponse,
  HostPropertyReviewsResponse,
  ApiResponse
} from '@/types/main/review';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class ReviewService {
  // ===== CUSTOMER APIs =====

  /**
   * Create a new review for a completed booking
   */
  async createReview(data: CreateReviewRequest): Promise<ApiResponse<ReviewResponse>> {
    const formData = new FormData();
    
    formData.append('bookingId', data.bookingId.toString());
    formData.append('propertyId', data.propertyId.toString());
    formData.append('overallRating', data.overallRating.toString());
    
    if (data.cleanlinessRating) formData.append('cleanlinessRating', data.cleanlinessRating.toString());
    if (data.locationRating) formData.append('locationRating', data.locationRating.toString());
    if (data.serviceRating) formData.append('serviceRating', data.serviceRating.toString());
    if (data.valueRating) formData.append('valueRating', data.valueRating.toString());
    if (data.amenitiesRating) formData.append('amenitiesRating', data.amenitiesRating.toString());
    if (data.title) formData.append('title', data.title);
    if (data.reviewText) formData.append('reviewText', data.reviewText);
    if (data.pros) formData.append('pros', data.pros);
    if (data.cons) formData.append('cons', data.cons);
    if (data.travelType) formData.append('travelType', data.travelType);
    if (data.roomStayed) formData.append('roomStayed', data.roomStayed);
    if (data.isAnonymous !== undefined) formData.append('isAnonymous', data.isAnonymous.toString());
    
    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await fetch(`${API_BASE_URL}/Review/customer/create`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }

  /**
   * Get all my reviews with optional filters
   */
  async getMyReviews(params?: ReviewFilterRequest): Promise<ApiResponse<ReviewListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.propertyId) queryParams.append('propertyId', params.propertyId.toString());
      if (params.minRating) queryParams.append('minRating', params.minRating.toString());
      if (params.maxRating) queryParams.append('maxRating', params.maxRating.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.hasHostReply !== undefined) queryParams.append('hasHostReply', params.hasHostReply.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const response = await fetch(
      `${API_BASE_URL}/Review/customer/my-reviews?${queryParams.toString()}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }

  /**
   * Get a specific review by ID
   */
  async getMyReviewById(id: number): Promise<ApiResponse<ReviewResponse>> {
    const response = await fetch(
      `${API_BASE_URL}/Review/customer/my-reviews/${id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }

  /**
   * Update my review
   */
  async updateReview(id: number, data: UpdateReviewRequest): Promise<ApiResponse<ReviewResponse>> {
    const formData = new FormData();
    
    if (data.overallRating) formData.append('overallRating', data.overallRating.toString());
    if (data.cleanlinessRating) formData.append('cleanlinessRating', data.cleanlinessRating.toString());
    if (data.locationRating) formData.append('locationRating', data.locationRating.toString());
    if (data.serviceRating) formData.append('serviceRating', data.serviceRating.toString());
    if (data.valueRating) formData.append('valueRating', data.valueRating.toString());
    if (data.amenitiesRating) formData.append('amenitiesRating', data.amenitiesRating.toString());
    if (data.title) formData.append('title', data.title);
    if (data.reviewText) formData.append('reviewText', data.reviewText);
    if (data.pros) formData.append('pros', data.pros);
    if (data.cons) formData.append('cons', data.cons);
    if (data.travelType) formData.append('travelType', data.travelType);
    if (data.roomStayed) formData.append('roomStayed', data.roomStayed);
    if (data.isAnonymous !== undefined) formData.append('isAnonymous', data.isAnonymous.toString());
    
    if (data.newImages && data.newImages.length > 0) {
      data.newImages.forEach((image) => {
        formData.append('newImages', image);
      });
    }
    
    if (data.deleteImageIds && data.deleteImageIds.length > 0) {
      data.deleteImageIds.forEach((id) => {
        formData.append('deleteImageIds', id.toString());
      });
    }

    const response = await fetch(`${API_BASE_URL}/Review/customer/my-reviews/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }

  /**
   * Delete my review
   */
  async deleteReview(id: number): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${API_BASE_URL}/Review/customer/my-reviews/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }

  // ===== HOST APIs =====

  /**
   * Add a reply to a review
   */
  async addHostReply(reviewId: number, data: HostReplyRequest): Promise<ApiResponse<ReviewResponse>> {
    const response = await fetch(`${API_BASE_URL}/Review/host/reviews/${reviewId}/reply`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }

  /**
   * Update a reply to a review
   */
  async updateHostReply(reviewId: number, data: HostReplyRequest): Promise<ApiResponse<ReviewResponse>> {
    const response = await fetch(`${API_BASE_URL}/Review/host/reviews/${reviewId}/reply`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }

  /**
   * Delete a reply from a review
   */
  async deleteHostReply(reviewId: number): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${API_BASE_URL}/Review/host/reviews/${reviewId}/reply`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }

  /**
   * Get all my properties with review statistics
   */
  async getMyPropertiesReviews(): Promise<ApiResponse<HostPropertyReviewsResponse[]>> {
    const response = await fetch(`${API_BASE_URL}/Review/host/my-properties-reviews`, {
      method: 'GET',
      credentials: 'include',
    });

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }

  /**
   * Get all reviews for a specific property (host must own the property)
   */
  async getMyPropertyReviews(propertyId: number, params?: ReviewFilterRequest): Promise<ApiResponse<ReviewListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.minRating) queryParams.append('minRating', params.minRating.toString());
      if (params.maxRating) queryParams.append('maxRating', params.maxRating.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.hasHostReply !== undefined) queryParams.append('hasHostReply', params.hasHostReply.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const response = await fetch(
      `${API_BASE_URL}/Review/host/property/${propertyId}/reviews?${queryParams.toString()}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }

  // ===== PUBLIC APIs =====

  /**
   * Get all reviews for a property (public endpoint)
   */
  async getPropertyReviews(propertyId: number, params?: ReviewFilterRequest): Promise<ApiResponse<ReviewListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.minRating) queryParams.append('minRating', params.minRating.toString());
      if (params.maxRating) queryParams.append('maxRating', params.maxRating.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.hasHostReply !== undefined) queryParams.append('hasHostReply', params.hasHostReply.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const response = await fetch(
      `${API_BASE_URL}/Review/property/${propertyId}?${queryParams.toString()}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const json = await response.json().catch(() => ({}));
    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }
    return json;
  }
}

export const reviewService = new ReviewService();
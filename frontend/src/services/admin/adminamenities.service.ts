import {
  ApiResponse,
  PaginatedResponse,
  AmenityCategoryResponse,
  AmenityResponse,
  CreateAmenityCategoryRequest,
  UpdateAmenityCategoryRequest,
  CreateAmenityRequest,
  UpdateAmenityRequest,
  UpdateSortOrderRequest,
  AmenityStatisticsOverview,
  AmenityUsageStatistics,
  UnusedAmenityResponse,
  CategoryStatistics,
  GetAmenitiesRequest
} from '@/types/admin/adminamenities';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AdminAmenitiesService {
  // ============= AMENITY CATEGORIES =============

  async getAllCategories(): Promise<ApiResponse<AmenityCategoryResponse[]>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/categories`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  async getCategoriesSimple(): Promise<ApiResponse<AmenityCategoryResponse[]>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/categories/simple`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  async getCategoryById(id: number): Promise<ApiResponse<AmenityCategoryResponse>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/categories/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  async createCategory(data: CreateAmenityCategoryRequest): Promise<ApiResponse<AmenityCategoryResponse>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  async updateCategory(id: number, data: UpdateAmenityCategoryRequest): Promise<ApiResponse<AmenityCategoryResponse>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  async deleteCategory(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async updateCategorySortOrder(id: number, data: UpdateSortOrderRequest): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/categories/${id}/sort-order`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  // ============= AMENITIES =============

  async getAmenities(request: GetAmenitiesRequest): Promise<ApiResponse<PaginatedResponse<AmenityResponse>>> {
    const params = new URLSearchParams();
    
    params.append('page', request.page.toString());
    params.append('pageSize', request.pageSize.toString());
    if (request.categoryId) params.append('categoryId', request.categoryId.toString());
    if (request.isPopular !== undefined) params.append('isPopular', request.isPopular.toString());

    const response = await fetch(`${API_BASE_URL}/Amenity?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async getAmenityById(id: number): Promise<ApiResponse<AmenityResponse>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  async createAmenity(data: CreateAmenityRequest): Promise<ApiResponse<AmenityResponse>> {
    const response = await fetch(`${API_BASE_URL}/Amenity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  async updateAmenity(id: number, data: UpdateAmenityRequest): Promise<ApiResponse<AmenityResponse>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  async deleteAmenity(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async updateAmenitySortOrder(id: number, data: UpdateSortOrderRequest): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/${id}/sort-order`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  async toggleAmenityPopular(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/${id}/toggle-popular`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // ============= STATISTICS & REPORTS =============

  async getStatisticsOverview(): Promise<ApiResponse<AmenityStatisticsOverview>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/statistics/overview`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  async getMostUsedAmenities(top: number = 20): Promise<ApiResponse<AmenityUsageStatistics[]>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/statistics/most-used?top=${top}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  async getUnusedAmenities(): Promise<ApiResponse<UnusedAmenityResponse[]>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/statistics/unused`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  async getStatisticsByCategory(): Promise<ApiResponse<CategoryStatistics[]>> {
    const response = await fetch(`${API_BASE_URL}/Amenity/statistics/by-category`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }
}

export const adminAmenitiesService = new AdminAmenitiesService();
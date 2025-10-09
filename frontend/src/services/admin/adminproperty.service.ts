// src/services/adminproperty.service.ts
import { 
  ApiResponse, 
  PropertyAdminFilter,
  PropertyAdmin,
  PropertyDetailAdmin,
  PropertyStatistics,
  PaginationResponse
} from '@/types/admin/adminproperty';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AdminPropertyService {
  
  // Lấy danh sách tất cả properties với filter
  async getAllProperties(filter: PropertyAdminFilter): Promise<ApiResponse<PaginationResponse<PropertyAdmin>>> {
    const params = new URLSearchParams();
    
    if (filter.name) params.append('name', filter.name);
    if (filter.productTypeId) params.append('productTypeId', filter.productTypeId.toString());
    if (filter.provinceId) params.append('provinceId', filter.provinceId.toString());
    if (filter.hostId) params.append('hostId', filter.hostId.toString());
    if (filter.status) params.append('status', filter.status);
    if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
    if (filter.isFeatured !== undefined) params.append('isFeatured', filter.isFeatured.toString());
    if (filter.createdFrom) params.append('createdFrom', filter.createdFrom);
    if (filter.createdTo) params.append('createdTo', filter.createdTo);
    if (filter.priceFrom) params.append('priceFrom', filter.priceFrom.toString());
    if (filter.priceTo) params.append('priceTo', filter.priceTo.toString());
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);
    params.append('page', filter.page.toString());
    params.append('pageSize', filter.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/Property/admin/all?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // Lấy chi tiết property cho admin
  async getPropertyDetail(id: number): Promise<ApiResponse<PropertyDetailAdmin>> {
    const response = await fetch(`${API_BASE_URL}/Property/admin/${id}/detail`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // Duyệt property
  async approveProperty(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Property/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // Từ chối property
  async rejectProperty(id: number, reason: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Property/admin/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    return await response.json();
  }

  // Vô hiệu hóa property
  async deactivateProperty(id: number, reason: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Property/admin/${id}/deactivate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    return await response.json();
  }

  // Kích hoạt property
  async activateProperty(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Property/admin/${id}/activate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // Toggle featured status
  async toggleFeaturedStatus(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Property/${id}/toggle-featured`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // Lấy thống kê
  async getStatistics(): Promise<ApiResponse<PropertyStatistics>> {
    const response = await fetch(`${API_BASE_URL}/Property/admin/statistics`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // Lấy properties theo status
  async getPropertiesByStatus(
    status: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<ApiResponse<PaginationResponse<PropertyAdmin>>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/Property/admin/by-status/${status}?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }
}

export const adminPropertyService = new AdminPropertyService();
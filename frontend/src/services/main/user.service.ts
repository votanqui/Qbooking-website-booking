import { 
  ApiResponse, 
  UserProfile, 
  UpdateProfileRequest, 
  UploadAvatarResponse,
  UserStatistics,
  GetUserPropertiesRequest,
  GetUserPropertiesResponse,
  ChangePasswordRequest
} from '@/types/main/user';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class UserService {

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const response = await fetch(`${API_BASE_URL}/User/profile`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/User/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  async uploadAvatar(file: File): Promise<ApiResponse<UploadAvatarResponse>> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/User/upload-avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    return await response.json();
  }

  async removeAvatar(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/User/remove-avatar`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async upgradeToHost(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/User/upgrade-to-host`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async getStatistics(): Promise<ApiResponse<UserStatistics>> {
    const response = await fetch(`${API_BASE_URL}/User/statistics`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/User/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  async getUserProperties(request: GetUserPropertiesRequest): Promise<ApiResponse<GetUserPropertiesResponse>> {
    const params = new URLSearchParams();
    
    if (request.status) params.append('status', request.status);
    if (request.productTypeId) params.append('productTypeId', request.productTypeId.toString());
    if (request.isActive !== undefined) params.append('isActive', request.isActive.toString());
    if (request.isFeatured !== undefined) params.append('isFeatured', request.isFeatured.toString());
    if (request.search) params.append('search', request.search);
    if (request.sortBy) params.append('sortBy', request.sortBy);
    if (request.sortOrder) params.append('sortOrder', request.sortOrder);
    params.append('pageNumber', request.pageNumber.toString());
    params.append('pageSize', request.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/User/properties?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }
}

export const userService = new UserService();
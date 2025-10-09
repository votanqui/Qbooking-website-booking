// my-next-app/src/services/adminuser.service.ts
import { 
  ApiResponse,
  UserDetailResponse,
  GetUsersResponse,
  UserFullDetailResponse,
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
  GetUserBookingsRequest,
  GetUserBookingsResponse,
  UsersStatisticsResponse,
  AdminResetPasswordRequest,
  GetUsersRequest,
    GetUserLoginHistoryRequest,
    GetUserLoginHistoryResponse
} from '@/types/admin/adminuser';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AdminUserService {
  
  async getAllUsers(request: GetUsersRequest): Promise<ApiResponse<GetUsersResponse>> {
    const params = new URLSearchParams();
    
    if (request.role) params.append('role', request.role);
    if (request.isActive !== undefined) params.append('isActive', request.isActive.toString());
    if (request.isEmailVerified !== undefined) params.append('isEmailVerified', request.isEmailVerified.toString());
    if (request.provinceId) params.append('provinceId', request.provinceId.toString());
    if (request.search) params.append('search', request.search);
    if (request.createdFrom) params.append('createdFrom', request.createdFrom);
    if (request.createdTo) params.append('createdTo', request.createdTo);
    if (request.sortBy) params.append('sortBy', request.sortBy);
    if (request.sortOrder) params.append('sortOrder', request.sortOrder);
    params.append('pageNumber', request.pageNumber.toString());
    params.append('pageSize', request.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/User/admin/users?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async getUserById(userId: number): Promise<ApiResponse<UserFullDetailResponse>> {
    const response = await fetch(`${API_BASE_URL}/User/admin/users/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async updateUserStatus(userId: number, data: UpdateUserStatusRequest): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/User/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  async updateUserRole(userId: number, data: UpdateUserRoleRequest): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/User/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  async getUserBookings(userId: number, request: GetUserBookingsRequest): Promise<ApiResponse<GetUserBookingsResponse>> {
    const params = new URLSearchParams();
    
    if (request.status) params.append('status', request.status);
    if (request.paymentStatus) params.append('paymentStatus', request.paymentStatus);
    if (request.dateFrom) params.append('dateFrom', request.dateFrom.toISOString());
    if (request.dateTo) params.append('dateTo', request.dateTo.toISOString());
    if (request.sortBy) params.append('sortBy', request.sortBy);
    if (request.sortOrder) params.append('sortOrder', request.sortOrder);
    params.append('pageNumber', request.pageNumber.toString());
    params.append('pageSize', request.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/User/admin/users/${userId}/bookings?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async getStatistics(): Promise<ApiResponse<UsersStatisticsResponse>> {
    const response = await fetch(`${API_BASE_URL}/User/admin/users/statistics`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  async resetPassword(userId: number, data: AdminResetPasswordRequest): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/User/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

async getUserLoginHistory(request: GetUserLoginHistoryRequest): Promise<ApiResponse<GetUserLoginHistoryResponse>> {
  const params = new URLSearchParams();
  
  if (request.page) params.append('page', request.page.toString());
  if (request.pageSize) params.append('pageSize', request.pageSize.toString());
  if (request.isSuccess !== undefined) params.append('isSuccess', request.isSuccess.toString());
  if (request.fromDate) params.append('fromDate', request.fromDate);
  if (request.toDate) params.append('toDate', request.toDate);

  const response = await fetch(`${API_BASE_URL}/HistoryLogin/user/${request.userId}?${params}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return await response.json();
  
}
}

export const adminUserService = new AdminUserService();
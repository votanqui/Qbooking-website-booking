//services/admin/adminfavorite.service.ts
import {
  ApiResponse,
  AdminFavoriteDto,
  FavoriteStatisticsDto,
  TopFavoritePropertyDto,
  TopFavoriteUserDto,
  FavoriteTimelineDto,
  FavoriteDto,
  GetAllFavoritesRequest,
  GetAllFavoritesResponse,
  GetTopPropertiesRequest,
  GetTopUsersRequest,
  GetTimelineRequest
} from '@/types/admin/adminfavorite';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AdminFavoriteService {

  /**
   * Lấy tất cả favorites của tất cả người dùng (Admin only)
   */
  async getAllFavorites(request: GetAllFavoritesRequest = {}): Promise<ApiResponse<GetAllFavoritesResponse>> {
    const params = new URLSearchParams();
    
    if (request.page) params.append('page', request.page.toString());
    if (request.pageSize) params.append('pageSize', request.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/Favorite/admin/all?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy thống kê tổng quan về favorites (Admin only)
   */
  async getStatistics(): Promise<ApiResponse<FavoriteStatisticsDto>> {
    const response = await fetch(`${API_BASE_URL}/Favorite/admin/statistics`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy top bất động sản được yêu thích nhiều nhất (Admin only)
   */
  async getTopProperties(request: GetTopPropertiesRequest = {}): Promise<ApiResponse<TopFavoritePropertyDto[]>> {
    const params = new URLSearchParams();
    
    if (request.limit) params.append('limit', request.limit.toString());

    const response = await fetch(`${API_BASE_URL}/Favorite/admin/top-properties?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy người dùng có nhiều favorites nhất (Admin only)
   */
  async getTopUsers(request: GetTopUsersRequest = {}): Promise<ApiResponse<TopFavoriteUserDto[]>> {
    const params = new URLSearchParams();
    
    if (request.limit) params.append('limit', request.limit.toString());

    const response = await fetch(`${API_BASE_URL}/Favorite/admin/top-users?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy lịch sử favorites theo thời gian (Admin only)
   */
  async getTimeline(request: GetTimelineRequest = {}): Promise<ApiResponse<FavoriteTimelineDto[]>> {
    const params = new URLSearchParams();
    
    if (request.startDate) params.append('startDate', request.startDate);
    if (request.endDate) params.append('endDate', request.endDate);
    if (request.groupBy) params.append('groupBy', request.groupBy);

    const response = await fetch(`${API_BASE_URL}/Favorite/admin/timeline?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy favorites của một người dùng cụ thể (Admin only)
   */
  async getUserFavorites(userId: number): Promise<ApiResponse<FavoriteDto[]>> {
    const response = await fetch(`${API_BASE_URL}/Favorite/admin/user/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Xóa favorite của bất kỳ người dùng nào (Admin only)
   */
  async deleteFavorite(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Favorite/admin/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }
}

export const adminFavoriteService = new AdminFavoriteService();
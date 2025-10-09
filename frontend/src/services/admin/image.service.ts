// my-next-app/src/services/admin/image.service.ts

import {
  ImageOverview,
  PropertyImageStats,
  RoomImageStats,
  ReviewImageStats,
  AvatarStats,
  OrphanedImagesResponse,
  LargestImage,
    ApiResponse
} from '@/types/admin/image';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class ImageService {
  /**
   * Lấy tổng quan toàn bộ hình ảnh
   */
  async getOverview(): Promise<ApiResponse<ImageOverview>> {
    const response = await fetch(`${API_BASE_URL}/ImageStatistics/overview`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * Lấy thống kê hình ảnh khách sạn
   */
  async getPropertyImageStats(): Promise<ApiResponse<PropertyImageStats>> {
    const response = await fetch(`${API_BASE_URL}/ImageStatistics/property`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * Lấy thống kê hình ảnh phòng
   */
  async getRoomImageStats(): Promise<ApiResponse<RoomImageStats>> {
    const response = await fetch(`${API_BASE_URL}/ImageStatistics/room`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * Lấy thống kê hình ảnh đánh giá
   */
  async getReviewImageStats(): Promise<ApiResponse<ReviewImageStats>> {
    const response = await fetch(`${API_BASE_URL}/ImageStatistics/review`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * Lấy thống kê ảnh đại diện người dùng
   */
  async getAvatarStats(): Promise<ApiResponse<AvatarStats>> {
    const response = await fetch(`${API_BASE_URL}/ImageStatistics/avatar`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * Lấy danh sách hình ảnh không tồn tại (orphaned)
   */
  async getOrphanedImages(): Promise<ApiResponse<OrphanedImagesResponse>> {
    const response = await fetch(`${API_BASE_URL}/ImageStatistics/orphaned`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * Lấy danh sách hình ảnh lớn nhất
   * @param limit - Số lượng hình ảnh cần lấy (mặc định 20, tối đa 100)
   */
  async getLargestImages(limit: number = 20): Promise<ApiResponse<LargestImage[]>> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/ImageStatistics/largest?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return await response.json();
  }
}

export const imageService = new ImageService();
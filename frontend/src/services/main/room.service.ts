// services/room.service.ts

import { 
  ApiResponse,
  CreateSingleRoomTypeRequest,
  CreateMultipleRoomTypesRequest,
  RoomTypeResponse,
  HostRoomTypeDetailResponse,
  UploadRoomImageRequest,
  UploadRoomImageResponse,
  UpdateRoomTypeRequest,  
  

} from '@/types/main/hostproperty';
import { RoomDetailResponse
, RoomFilterParams, RoomListResponse
 } from '@/types/main/room'
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class RoomService {
  async createSingleRoomType(request: CreateSingleRoomTypeRequest): Promise<ApiResponse<RoomTypeResponse>> {
    console.log('Creating single room type with request:', request);
    const response = await fetch(`${API_BASE_URL}/Room/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Failed to create room type');
    }

    return await response.json();
  }

  async createMultipleRoomTypes(request: CreateMultipleRoomTypesRequest): Promise<ApiResponse<any>> {
    console.log('Creating multiple room types with request:', request);
    const response = await fetch(`${API_BASE_URL}/Room/create-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Failed to create room types');
    }

    return await response.json();
  }

  async getRoomTypesByProperty(propertyId: number): Promise<ApiResponse<{
    propertyId: number;
    propertyName: string;
    roomTypes: HostRoomTypeDetailResponse[];
    totalCount: number;
  }>> {
    const response = await fetch(`${API_BASE_URL}/Room/property/${propertyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch room types');
    }

    return await response.json();
  }

async getRoomBySlug(slug: string): Promise<ApiResponse<RoomDetailResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Room/slug/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching room detail:', error);
    return {
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết phòng',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
  async updateRoomType(id: number, data: UpdateRoomTypeRequest): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Room/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating room type:', error)
    return {
      success: false,
      message: 'Lỗi khi cập nhật room type',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Upload room images
 */
async uploadRoomImages(roomId: number, formData: FormData): Promise<ApiResponse<any>> {
  try {

    const response = await fetch(`${API_BASE_URL}/Room/${roomId}/upload-images`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error uploading room images:', error)
    return {
      success: false,
      message: 'Lỗi khi upload ảnh room',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete room image
 */
async deleteRoomImage(imageId: number): Promise<ApiResponse<any>> {
  try {

    const response = await fetch(`${API_BASE_URL}/Room/image/${imageId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    console.error('Error deleting room image:', error)
    return {
      success: false,
      message: 'Lỗi khi xóa ảnh room',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Set primary room image
 */
async setPrimaryRoomImage(imageId: number): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Room/image/${imageId}/set-primary`, {
      method: 'PUT',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error setting primary room image:', error)
    return {
      success: false,
      message: 'Lỗi khi đặt ảnh chính cho room',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
async getRoomList(params: RoomFilterParams = {}): Promise<ApiResponse<RoomListResponse>> {
    try {
      const queryParams = new URLSearchParams()
      
      // Pagination
      if (params.Page) queryParams.append('Page', params.Page.toString())
      if (params.PageSize) queryParams.append('PageSize', params.PageSize.toString())
      
      // Basic filters
      if (params.Name) queryParams.append('Name', params.Name)
      if (params.BedType) queryParams.append('BedType', params.BedType)
      
      // Guest filters
      if (params.Adults) queryParams.append('Adults', params.Adults.toString())
      if (params.Children) queryParams.append('Children', params.Children.toString())
      
      // Price filters
      if (params.MinPrice) queryParams.append('MinPrice', params.MinPrice.toString())
      if (params.MaxPrice) queryParams.append('MaxPrice', params.MaxPrice.toString())
      
      // Location filter
      if (params.ProvinceId) queryParams.append('ProvinceId', params.ProvinceId.toString())
      
      // Date filters (for availability check)
      if (params.CheckIn) queryParams.append('CheckIn', params.CheckIn)
      if (params.CheckOut) queryParams.append('CheckOut', params.CheckOut)
      
      // Amenity filters
      if (params.AmenityIds && params.AmenityIds.length > 0) {
        params.AmenityIds.forEach(id => queryParams.append('AmenityIds', id.toString()))
      }

      const url = `${API_BASE_URL}/Room${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Transform API response to match expected format
      return {
        success: result.success,
        message: result.message,
        statusCode: result.statusCode,
        data: result.data ? {
          roomTypes: result.data.roomTypes,
          totalCount: result.data.totalCount,
          page: result.data.page,
          pageSize: result.data.pageSize,
          totalPages: result.data.totalPages
        } : undefined,
        error: result.error
      }
    } catch (error) {
      console.error('Error fetching room list:', error)
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách phòng',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get room by slug
   */
 
}

export const roomService = new RoomService();
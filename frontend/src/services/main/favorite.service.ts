import { 
  ApiResponse, 
  FavoriteDto, 
  AddFavoriteRequest
} from '@/types/main/favorite';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class FavoriteService {
  
  /**
   * Lấy danh sách yêu thích của người dùng
   * GET /api/Favorite
   */
  async getFavorites(): Promise<ApiResponse<FavoriteDto[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Favorite`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Lỗi khi lấy danh sách yêu thích',
          statusCode: response.status,
          error: 'Network error'
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return {
        success: false,
        message: 'Lỗi kết nối mạng',
        statusCode: 500,
        error: 'Network error'
      };
    }
  }

  /**
   * Thêm bất động sản vào danh sách yêu thích
   * POST /api/Favorite
   */
  async addToFavorites(data: AddFavoriteRequest): Promise<ApiResponse<FavoriteDto>> {
    try {
      console.log('Adding to favorites with data:', data);
      const response = await fetch(`${API_BASE_URL}/Favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Lỗi khi thêm vào yêu thích',
          statusCode: response.status,
          error: 'Network error'
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return {
        success: false,
        message: 'Lỗi kết nối mạng',
        statusCode: 500,
        error: 'Network error'
      };
    }
  }

  /**
   * Xóa bất động sản khỏi danh sách yêu thích theo propertyId
   * DELETE /api/Favorite/property/{propertyId}
   */
  async removeFromFavorites(propertyId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Favorite/property/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Lỗi khi xóa khỏi yêu thích',
          statusCode: response.status,
          error: 'Network error'
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return {
        success: false,
        message: 'Lỗi kết nối mạng',
        statusCode: 500,
        error: 'Network error'
      };
    }
  }

  /**
   * Xóa favorite theo favoriteId
   * DELETE /api/Favorite/{id}
   */
  async removeFavoriteById(favoriteId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Favorite/${favoriteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Lỗi khi xóa yêu thích',
          statusCode: response.status,
          error: 'Network error'
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing favorite by id:', error);
      return {
        success: false,
        message: 'Lỗi kết nối mạng',
        statusCode: 500,
        error: 'Network error'
      };
    }
  }

  /**
   * Kiểm tra xem property có trong danh sách yêu thích không
   */
  async isFavorite(propertyId: number): Promise<boolean> {
    try {
      const response = await this.getFavorites();
      
      if (response.success && response.data) {
        return response.data.some(fav => fav.propertyId === propertyId);
      }
      
      return false;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  /**
   * Lấy toàn bộ danh sách yêu thích (cho trang danh sách)
   */
  async getAllFavorites(): Promise<FavoriteDto[]> {
    try {
      const response = await this.getFavorites();
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting all favorites:', error);
      return [];
    }
  }
}

export const favoriteService = new FavoriteService();
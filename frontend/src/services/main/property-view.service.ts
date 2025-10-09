// services/property-view.service.ts

import { 
  ApiResponse, 
  PropertyViewRequest, 
  PropertyViewResponse 
} from '@/types/main/property-view';

// In-memory cache để track views trong session hiện tại
// Key: propertyId, Value: timestamp
const viewCache = new Map<number, number>();

// Thời gian tối thiểu giữa 2 lần view (5 phút = 300000ms)
const VIEW_THROTTLE_TIME = 5 * 60 * 1000;

class PropertyViewService {
  /**
   * Ghi nhận lượt xem property với throttling
   * @param propertyId - ID của property được xem
   * @returns Response từ API hoặc null nếu bị throttle
   */
  async recordView(propertyId: number): Promise<ApiResponse<PropertyViewResponse> | null> {
    try {
      // Kiểm tra xem property này đã được view gần đây chưa
      const lastViewTime = viewCache.get(propertyId);
      const currentTime = Date.now();

      if (lastViewTime && (currentTime - lastViewTime) < VIEW_THROTTLE_TIME) {
       
        return null; // Không gọi API nếu vừa mới view
      }

      const requestData: PropertyViewRequest = {
        propertyId
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/PropertyViews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      // Lưu timestamp vào cache nếu thành công
      if (data.success) {
        viewCache.set(propertyId, currentTime);
       
      }

      return data;
    } catch (error) {
      console.error('Error recording property view:', error);
      return {
        success: false,
        message: 'Không thể ghi nhận lượt xem',
        statusCode: 500
      };
    }
  }

  /**
   * Clear cache cho một property cụ thể (dùng khi cần reset)
   */
  clearPropertyViewCache(propertyId: number): void {
    viewCache.delete(propertyId);
  }

  /**
   * Clear toàn bộ view cache
   */
  clearAllViewCache(): void {
    viewCache.clear();
  }
}

export const propertyViewService = new PropertyViewService();
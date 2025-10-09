// services/address.service.ts
import { Province, Commune, TopProvince, PropertyMapMarker, ApiResponse } from '@/types/main/address';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AddressService {
  
  async getProvinces(): Promise<ApiResponse<Province[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Andress/provinces`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return {
        success: false,
        message: 'Lỗi khi tải danh sách tỉnh/thành phố',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCommunesByProvince(provinceCode: string): Promise<ApiResponse<{ items: Commune[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Andress/communes/by-province/${provinceCode}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching communes:', error);
      return {
        success: false,
        message: 'Lỗi khi tải danh sách quận/huyện',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getTopProvincesWithMostProperties(top: number = 5): Promise<ApiResponse<TopProvince[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Andress/provinces/top-properties?top=${top}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching top provinces:', error);
      return {
        success: false,
        message: 'Lỗi khi tải danh sách tỉnh có nhiều properties',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ✅ Updated API lấy properties cho bản đồ với slug
  async getPropertiesForMap(): Promise<ApiResponse<PropertyMapMarker[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Andress/properties/map`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    
      const result = await response.json();
      
      // ✅ Validate dữ liệu trả về có chứa slug
      if (result.success && result.data) {
        result.data = result.data.map((property: any) => ({
          id: property.id,
          name: property.name,
          slug: property.slug, // ✅ Đảm bảo có slug
          latitude: property.latitude,
          longitude: property.longitude,
          primaryImage: property.primaryImage
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching properties for map:', error);
      return {
        success: false,
        message: 'Lỗi khi tải danh sách properties cho bản đồ',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper method to get province name by ID
  async getProvinceById(provinceId: number): Promise<ApiResponse<Province>> {
    try {
      const provincesResponse = await this.getProvinces();
      if (provincesResponse.success && provincesResponse.data) {
        const province = provincesResponse.data.find(p => p.id === provinceId);
        if (province) {
          return {
            success: true,
            message: 'Tìm thấy tỉnh/thành phố',
            statusCode: 200,
            data: province
          };
        }
      }
      
      return {
        success: false,
        message: 'Không tìm thấy tỉnh/thành phố',
        statusCode: 404
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi khi tìm tỉnh/thành phố',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const addressService = new AddressService();
import { 
  ApiResponse,
  LoginHistoryResponse,
  GetLoginHistoryRequest
} from '@/types/main/loginHistory';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class LoginHistoryService {

  async getMyLoginHistory(request: GetLoginHistoryRequest = {}): Promise<ApiResponse<LoginHistoryResponse>> {
    try {
      const params = new URLSearchParams();
      
      if (request.page) params.append('page', request.page.toString());
      if (request.pageSize) params.append('pageSize', request.pageSize.toString());
      if (request.fromDate) {
        params.append('fromDate', request.fromDate.toISOString());
      }
      if (request.toDate) {
        params.append('toDate', request.toDate.toISOString());
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/Historylogin/my-history${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching login history:', error);
      return {
        success: false,
        message: 'Lỗi khi tải lịch sử đăng nhập',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper method to format device info
  formatDeviceInfo(deviceInfo: string): { browser: string; os: string; device: string } {
    // Parse device info string (assuming format like "Chrome 120.0 on Windows 10")
    const parts = deviceInfo.split(' on ');
    const browser = parts[0] || 'Unknown Browser';
    const osAndDevice = parts[1] || 'Unknown OS';
    
    return {
      browser,
      os: osAndDevice,
      device: 'Desktop' // You can enhance this to detect mobile/tablet
    };
  }

  // Helper method to get location from IP (if you have a service for this)
  async getLocationFromIP(ipAddress: string): Promise<string> {
    // This is a placeholder - you would integrate with a real IP location service
    // like ipapi.com, ipgeolocation.io, etc.
    try {
      // Example implementation (you'd replace with actual service)
      return 'Unknown Location';
    } catch (error) {
      return 'Unknown Location';
    }
  }
}

export const loginHistoryService = new LoginHistoryService();
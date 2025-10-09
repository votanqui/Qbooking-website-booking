import { 
  ApiResponse,
  SearchHistoryResponse,
  SearchHistoryListResponse,
  SearchHistoryFilterRequest,
  CreateSearchHistoryRequest,
  UpdateSearchHistoryRequest,
  UserSearchStatsResponse,
  PopularSearchResponse,
  PopularSearchesRequest
} from '@/types/main/searchhistory';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class SearchHistoryService {

  // GET: Lấy danh sách lịch sử tìm kiếm với filter và phân trang
  async getSearchHistories(request: SearchHistoryFilterRequest): Promise<ApiResponse<SearchHistoryListResponse>> {
    const params = new URLSearchParams();
    
    if (request.userId) params.append('userId', request.userId.toString());
    if (request.sessionId) params.append('sessionId', request.sessionId);
    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);
    params.append('page', request.page.toString());
    params.append('pageSize', request.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/SearchHistory?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // GET: Lấy chi tiết 1 lịch sử tìm kiếm
  async getSearchHistoryById(id: number): Promise<ApiResponse<SearchHistoryResponse>> {
    const response = await fetch(`${API_BASE_URL}/SearchHistory/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // POST: Tạo lịch sử tìm kiếm mới
  async createSearchHistory(data: CreateSearchHistoryRequest): Promise<ApiResponse<SearchHistoryResponse>> {
    const response = await fetch(`${API_BASE_URL}/SearchHistory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  // PUT: Cập nhật lịch sử tìm kiếm
  async updateSearchHistory(id: number, data: UpdateSearchHistoryRequest): Promise<ApiResponse<SearchHistoryResponse>> {
    const response = await fetch(`${API_BASE_URL}/SearchHistory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  // DELETE: Xóa lịch sử tìm kiếm
  async deleteSearchHistory(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/SearchHistory/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // GET: Thống kê tìm kiếm của user
  async getUserSearchStats(userId: number): Promise<ApiResponse<UserSearchStatsResponse>> {
    const response = await fetch(`${API_BASE_URL}/SearchHistory/user/${userId}/stats`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // GET: Danh sách tìm kiếm phổ biến
  async getPopularSearches(request: PopularSearchesRequest): Promise<ApiResponse<PopularSearchResponse[]>> {
    const params = new URLSearchParams();
    
    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);
    params.append('limit', request.limit.toString());

    const response = await fetch(`${API_BASE_URL}/SearchHistory/popular-searches?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // Helper: Lấy IP address của client (nếu cần)
  async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return '';
    }
  }

  // Helper: Lấy User Agent
  getUserAgent(): string {
    return typeof window !== 'undefined' ? window.navigator.userAgent : '';
  }
}

export const searchHistoryService = new SearchHistoryService();
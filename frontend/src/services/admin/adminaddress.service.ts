// services/adminaddress.service.ts

import {
  ApiResponse,
  Province,
  ProvinceStatisticsResponse,
  ProvinceTopUsers,
  ProvinceDetail,
  ProvinceTopProperties,
  Commune,
  CommuneStatisticsResponse,
  CommuneTopProperties,
  CommunePaginationResponse,
  DashboardData,
  PropertyForMap,
  StatusToggleResponse,
  ProvinceSearchParams,
  CommuneSearchParams,
  TopQueryParams,
  PaginationParams,
} from "@/types/admin/adminaddress";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AdminAddressService {
  // ============= PUBLIC APIs (No Auth Required) =============

  /**
   * Get all provinces
   */
  async getAllProvinces(): Promise<ApiResponse<Province[]>> {
    const response = await fetch(`${API_BASE_URL}/Andress/admin/provinces`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return await response.json();
  }

  /**
   * Search provinces
   */
  async searchProvinces(
    params: ProvinceSearchParams
  ): Promise<ApiResponse<Province[]>> {
    const queryParams = new URLSearchParams();

    if (params.name) queryParams.append("name", params.name);
    if (params.code) queryParams.append("code", params.code);
    if (params.region) queryParams.append("region", params.region);

    const response = await fetch(
      `${API_BASE_URL}/Andress/provinces/search?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Get all communes with pagination
   */
  async getAllCommunes(
    params: PaginationParams = {}
  ): Promise<ApiResponse<CommunePaginationResponse>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());

    const response = await fetch(
      `${API_BASE_URL}/Andress/admin/communes?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Get communes by province code
   */
  async getCommunesByProvince(
    provinceCode: string
  ): Promise<ApiResponse<{ items: Commune[] }>> {
    const response = await fetch(
      `${API_BASE_URL}/Andress/communes/by-province/${provinceCode}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Search communes
   */
  async searchCommunes(
    params: CommuneSearchParams
  ): Promise<ApiResponse<CommunePaginationResponse>> {
    const queryParams = new URLSearchParams();

    if (params.name) queryParams.append("name", params.name);
    if (params.code) queryParams.append("code", params.code);
    if (params.provinceCode)
      queryParams.append("provinceCode", params.provinceCode);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());

    const response = await fetch(
      `${API_BASE_URL}/Andress/communes/search?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Get provinces with most properties (public)
   */
  async getProvincesTopProperties(
    params: TopQueryParams = {}
  ): Promise<ApiResponse<ProvinceTopProperties[]>> {
    const queryParams = new URLSearchParams();

    if (params.top) queryParams.append("top", params.top.toString());

    const response = await fetch(
      `${API_BASE_URL}/Andress/provinces/top-properties?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Get properties for map display
   */
  async getPropertiesForMap(): Promise<ApiResponse<PropertyForMap[]>> {
    const response = await fetch(`${API_BASE_URL}/Andress/properties/map`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return await response.json();
  }

  // ============= ADMIN APIs (Auth Required) =============

  /**
   * Get provinces statistics (Admin only)
   */
  async getProvincesStatistics(): Promise<
    ApiResponse<ProvinceStatisticsResponse>
  > {
    const response = await fetch(
      `${API_BASE_URL}/Andress/admin/provinces/statistics`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Get provinces with most users (Admin only)
   */
  async getProvincesTopUsers(
    params: TopQueryParams = {}
  ): Promise<ApiResponse<ProvinceTopUsers[]>> {
    const queryParams = new URLSearchParams();

    if (params.top) queryParams.append("top", params.top.toString());

    const response = await fetch(
      `${API_BASE_URL}/Andress/admin/provinces/top-users?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Get communes statistics (Admin only)
   */
  async getCommunesStatistics(
    provinceCode?: string
  ): Promise<ApiResponse<CommuneStatisticsResponse>> {
    const queryParams = new URLSearchParams();

    if (provinceCode) queryParams.append("provinceCode", provinceCode);

    const response = await fetch(
      `${API_BASE_URL}/Andress/admin/communes/statistics?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Get communes with most properties (Admin only)
   */
  async getCommunesTopProperties(
    params: TopQueryParams = {}
  ): Promise<ApiResponse<CommuneTopProperties[]>> {
    const queryParams = new URLSearchParams();

    if (params.top) queryParams.append("top", params.top.toString());

    const response = await fetch(
      `${API_BASE_URL}/Andress/admin/communes/top-properties?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Get province detail (Admin only)
   */
  async getProvinceDetail(id: number): Promise<ApiResponse<ProvinceDetail>> {
    const response = await fetch(
      `${API_BASE_URL}/Andress/admin/provinces/${id}/detail`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Get admin dashboard data (Admin only)
   */
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    const response = await fetch(`${API_BASE_URL}/Andress/admin/dashboard`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return await response.json();
  }

  /**
   * Toggle province status (Admin only)
   */
  async toggleProvinceStatus(
    id: number
  ): Promise<ApiResponse<StatusToggleResponse>> {
    const response = await fetch(
      `${API_BASE_URL}/Andress/admin/provinces/${id}/toggle-status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  /**
   * Toggle commune status (Admin only)
   */
  async toggleCommuneStatus(
    id: number
  ): Promise<ApiResponse<StatusToggleResponse>> {
    const response = await fetch(
      `${API_BASE_URL}/Andress/admin/communes/${id}/toggle-status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    return await response.json();
  }

  // ============= BATCH OPERATIONS (Admin only) =============

  /**
   * Toggle multiple provinces status
   */
  async toggleMultipleProvinces(
    ids: number[]
  ): Promise<ApiResponse<StatusToggleResponse>[]> {
    const promises = ids.map((id) => this.toggleProvinceStatus(id));
    return Promise.all(promises);
  }

  /**
   * Toggle multiple communes status
   */
  async toggleMultipleCommunes(
    ids: number[]
  ): Promise<ApiResponse<StatusToggleResponse>[]> {
    const promises = ids.map((id) => this.toggleCommuneStatus(id));
    return Promise.all(promises);
  }

  // ============= UTILITY METHODS =============

  /**
   * Get all active provinces only
   */
  async getActiveProvinces(): Promise<Province[]> {
    const response = await this.getAllProvinces();
    return (
      response.data?.filter((province) => province.isActive !== false) || []
    );
  }

  /**
   * Get all active communes by province
   */
  async getActiveCommunesByProvince(provinceCode: string): Promise<Commune[]> {
    const response = await this.getCommunesByProvince(provinceCode);
    return (
      response.data?.items.filter((commune) => commune.isActive !== false) ||
      []
    );
  }

  /**
   * Get province by code
   */
  async getProvinceByCode(code: string): Promise<Province | null> {
    const response = await this.searchProvinces({ code });
    return response.data?.[0] || null;
  }

  /**
   * Get commune by code
   */
  async getCommuneByCode(code: string): Promise<Commune | null> {
    const response = await this.searchCommunes({ code, pageSize: 1 });
    return response.data?.items[0] || null;
  }

  /**
   * Get provinces by region
   */
  async getProvincesByRegion(region: string): Promise<Province[]> {
    const response = await this.searchProvinces({ region });
    return response.data || [];
  }
}

// Export singleton instance
export const adminAddressService = new AdminAddressService();

// Export class for testing or custom instances
export default AdminAddressService;
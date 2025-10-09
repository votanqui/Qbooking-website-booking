import {
  ApiResponse,
  DashboardOverview,
  GetOverviewRequest,
  RevenueChartData,
  GetRevenueChartRequest,
  BookingStatusData,
  TopPropertiesData,
  GetTopPropertiesRequest,
  RecentBookingsData,
  GetRecentBookingsRequest,
  OccupancyRateData,
  GetOccupancyRateRequest,
  CustomerGrowthData,
  GetCustomerGrowthRequest,
  PaymentMethodsData,
  GetPaymentMethodsRequest,
  ReviewsSummaryData,
  GetReviewsSummaryRequest,
} from '@/types/admin/dashboard';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class DashboardService {
  
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Nếu API trả về trực tiếp data (không có wrapper)
    // Chúng ta wrap nó vào structure ApiResponse
    return {
      success: true,
      data: data
    };
  }

  /**
   * Get dashboard overview statistics
   */
  async getOverview(request?: GetOverviewRequest): Promise<ApiResponse<DashboardOverview>> {
    const params = new URLSearchParams();
    
    if (request?.startDate) params.append('startDate', request.startDate);
    if (request?.endDate) params.append('endDate', request.endDate);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/Dashboard/overview${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return this.handleResponse<DashboardOverview>(response);
  }

  /**
   * Get revenue chart data
   */
  async getRevenueChart(request?: GetRevenueChartRequest): Promise<ApiResponse<RevenueChartData>> {
    const params = new URLSearchParams();
    
    if (request?.period) params.append('period', request.period);
    if (request?.startDate) params.append('startDate', request.startDate);
    if (request?.endDate) params.append('endDate', request.endDate);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/Dashboard/revenue-chart${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return this.handleResponse<RevenueChartData>(response);
  }

  /**
   * Get booking status statistics
   */
  async getBookingStatus(): Promise<ApiResponse<BookingStatusData>> {
    const response = await fetch(`${API_BASE_URL}/Dashboard/booking-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return this.handleResponse<BookingStatusData>(response);
  }

  /**
   * Get top performing properties
   */
  async getTopProperties(request?: GetTopPropertiesRequest): Promise<ApiResponse<TopPropertiesData>> {
    const params = new URLSearchParams();
    
    if (request?.limit) params.append('limit', request.limit.toString());
    if (request?.startDate) params.append('startDate', request.startDate);
    if (request?.endDate) params.append('endDate', request.endDate);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/Dashboard/top-properties${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return this.handleResponse<TopPropertiesData>(response);
  }

  /**
   * Get recent bookings
   */
  async getRecentBookings(request?: GetRecentBookingsRequest): Promise<ApiResponse<RecentBookingsData>> {
    const params = new URLSearchParams();
    
    if (request?.limit) params.append('limit', request.limit.toString());

    const queryString = params.toString();
    const url = `${API_BASE_URL}/Dashboard/recent-bookings${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return this.handleResponse<RecentBookingsData>(response);
  }

  /**
   * Get occupancy rate
   */
  async getOccupancyRate(request?: GetOccupancyRateRequest): Promise<ApiResponse<OccupancyRateData>> {
    const params = new URLSearchParams();
    
    if (request?.date) params.append('date', request.date);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/Dashboard/occupancy-rate${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return this.handleResponse<OccupancyRateData>(response);
  }

  /**
   * Get customer growth data
   */
  async getCustomerGrowth(request?: GetCustomerGrowthRequest): Promise<ApiResponse<CustomerGrowthData>> {
    const params = new URLSearchParams();
    
    if (request?.startDate) params.append('startDate', request.startDate);
    if (request?.endDate) params.append('endDate', request.endDate);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/Dashboard/customer-growth${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return this.handleResponse<CustomerGrowthData>(response);
  }

  /**
   * Get payment methods statistics
   */
  async getPaymentMethods(request?: GetPaymentMethodsRequest): Promise<ApiResponse<PaymentMethodsData>> {
    const params = new URLSearchParams();
    
    if (request?.startDate) params.append('startDate', request.startDate);
    if (request?.endDate) params.append('endDate', request.endDate);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/Dashboard/payment-methods${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return this.handleResponse<PaymentMethodsData>(response);
  }

  /**
   * Get reviews summary
   */
  async getReviewsSummary(request?: GetReviewsSummaryRequest): Promise<ApiResponse<ReviewsSummaryData>> {
    const params = new URLSearchParams();
    
    if (request?.startDate) params.append('startDate', request.startDate);
    if (request?.endDate) params.append('endDate', request.endDate);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/Dashboard/reviews-summary${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return this.handleResponse<ReviewsSummaryData>(response);
  }

  /**
   * Helper method to format date to ISO string
   */
  formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Helper method to get date range presets
   */
  getDateRangePresets() {
    const now = new Date();
    const today = new Date();
    
    return {
      today: {
        startDate: this.formatDate(new Date(today.setHours(0, 0, 0, 0))),
        endDate: this.formatDate(new Date(today.setHours(23, 59, 59, 999))),
      },
      yesterday: {
        startDate: this.formatDate(new Date(new Date().setDate(new Date().getDate() - 1))),
        endDate: this.formatDate(new Date(new Date().setHours(23, 59, 59, 999))),
      },
      last7Days: {
        startDate: this.formatDate(new Date(new Date().setDate(new Date().getDate() - 7))),
        endDate: this.formatDate(new Date()),
      },
      last30Days: {
        startDate: this.formatDate(new Date(new Date().setDate(new Date().getDate() - 30))),
        endDate: this.formatDate(new Date()),
      },
      thisMonth: {
        startDate: this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: this.formatDate(new Date()),
      },
      lastMonth: {
        startDate: this.formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        endDate: this.formatDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      },
      thisYear: {
        startDate: this.formatDate(new Date(now.getFullYear(), 0, 1)),
        endDate: this.formatDate(new Date()),
      },
      lastYear: {
        startDate: this.formatDate(new Date(now.getFullYear() - 1, 0, 1)),
        endDate: this.formatDate(new Date(now.getFullYear() - 1, 11, 31)),
      },
    };
  }
}

export const dashboardService = new DashboardService();
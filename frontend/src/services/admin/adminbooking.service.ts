import { 
  ApiResponse,
  AdminBookingListResponse,
  AdminBookingDetailDto,
  AdminBookingStatisticsDto,
  DashboardOverviewDto,
  RevenueChartDto,
  BookingTrendsDto,
  TopPropertyDto,
  TopCustomerDto,
  DashboardAlertsDto,
  UpdateBookingStatusRequest,
  UpdatePaymentStatusRequest,
  AdminCancelBookingRequest,
  ExportBookingsRequest
} from '@/types/admin/adminbooking';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AdminBookingService {
  
  // GET: api/booking/admin/all - Get all bookings with pagination and filters
  async getAllBookings(params: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    customerId?: number;
    hostId?: number;
    propertyId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<AdminBookingListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.customerId) queryParams.append('customerId', params.customerId.toString());
    if (params.hostId) queryParams.append('hostId', params.hostId.toString());
    if (params.propertyId) queryParams.append('propertyId', params.propertyId.toString());
    queryParams.append('page', (params.page || 1).toString());
    queryParams.append('pageSize', (params.pageSize || 50).toString());

    const response = await fetch(`${API_BASE_URL}/Booking/admin/all?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // GET: api/booking/{id}/admin-detail - Get detailed booking info for admin
  async getBookingDetail(id: number): Promise<ApiResponse<AdminBookingDetailDto>> {
    const response = await fetch(`${API_BASE_URL}/Booking/${id}/admin-detail`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // GET: api/booking/admin/statistics - Get booking statistics
  async getStatistics(params: {
    fromDate?: string;
    toDate?: string;
    propertyId?: number;
    hostId?: number;
  }): Promise<ApiResponse<AdminBookingStatisticsDto>> {
    const queryParams = new URLSearchParams();
    
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.propertyId) queryParams.append('propertyId', params.propertyId.toString());
    if (params.hostId) queryParams.append('hostId', params.hostId.toString());

    const response = await fetch(`${API_BASE_URL}/Booking/admin/statistics?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // PUT: api/booking/{id}/admin-cancel - Admin cancel booking
  async cancelBooking(
    id: number, 
    data: AdminCancelBookingRequest
  ): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Booking/${id}/admin-cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  // PUT: api/booking/admin/{id}/update-status - Update booking status
  async updateBookingStatus(
    id: number,
    data: UpdateBookingStatusRequest
  ): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Booking/admin/${id}/update-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  // PUT: api/booking/admin/{id}/update-payment-status - Update payment status
  async updatePaymentStatus(
    id: number,
    data: UpdatePaymentStatusRequest
  ): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Booking/admin/${id}/update-payment-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  // GET: api/booking/admin/export - Export bookings to CSV/Excel
  async exportBookings(params: ExportBookingsRequest): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.customerId) queryParams.append('customerId', params.customerId.toString());
    if (params.hostId) queryParams.append('hostId', params.hostId.toString());
    if (params.propertyId) queryParams.append('propertyId', params.propertyId.toString());
    queryParams.append('format', params.format || 'csv');

    const response = await fetch(`${API_BASE_URL}/Booking/admin/export?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.blob();
  }

  // Dashboard APIs

  // GET: api/booking/admin/dashboard/overview
  async getDashboardOverview(params: {
    fromDate?: string;
    toDate?: string;
  }): Promise<ApiResponse<DashboardOverviewDto>> {
    const queryParams = new URLSearchParams();
    
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);

    const response = await fetch(`${API_BASE_URL}/Booking/admin/dashboard/overview?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // GET: api/booking/admin/dashboard/revenue-chart
  async getRevenueChart(params: {
    fromDate?: string;
    toDate?: string;
    groupBy?: string; // 'day' | 'week' | 'month'
  }): Promise<ApiResponse<RevenueChartDto>> {
    const queryParams = new URLSearchParams();
    
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    queryParams.append('groupBy', params.groupBy || 'month');

    const response = await fetch(`${API_BASE_URL}/Booking/admin/dashboard/revenue-chart?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // GET: api/booking/admin/dashboard/booking-trends
  async getBookingTrends(params: {
    fromDate?: string;
    toDate?: string;
  }): Promise<ApiResponse<BookingTrendsDto>> {
    const queryParams = new URLSearchParams();
    
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);

    const response = await fetch(`${API_BASE_URL}/Booking/admin/dashboard/booking-trends?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // GET: api/booking/admin/dashboard/top-properties
  async getTopProperties(params: {
    fromDate?: string;
    toDate?: string;
    top?: number;
  }): Promise<ApiResponse<TopPropertyDto[]>> {
    const queryParams = new URLSearchParams();
    
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    queryParams.append('top', (params.top || 10).toString());

    const response = await fetch(`${API_BASE_URL}/Booking/admin/dashboard/top-properties?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // GET: api/booking/admin/dashboard/top-customers
  async getTopCustomers(params: {
    fromDate?: string;
    toDate?: string;
    top?: number;
  }): Promise<ApiResponse<TopCustomerDto[]>> {
    const queryParams = new URLSearchParams();
    
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    queryParams.append('top', (params.top || 10).toString());

    const response = await fetch(`${API_BASE_URL}/Booking/admin/dashboard/top-customers?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // GET: api/booking/admin/dashboard/alerts
  async getDashboardAlerts(): Promise<ApiResponse<DashboardAlertsDto>> {
    const response = await fetch(`${API_BASE_URL}/Booking/admin/dashboard/alerts`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }
}

export const adminBookingService = new AdminBookingService();
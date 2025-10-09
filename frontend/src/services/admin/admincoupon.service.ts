//services/admin/admincoupon.service.ts
import { 
  ApiResponse,
  PagedResult,
  AdminCouponResponse,
  CreateCouponRequest,
  UpdateCouponRequest,
  DuplicateCouponRequest,
  CouponOverviewStatisticsResponse,
  CouponDetailStatisticsResponse,
  TopUsedCouponResponse,
  AdminCouponUsageHistoryResponse,
  CouponPerformanceReportResponse,
  ExpiringSoonCouponResponse,
  TopCouponCustomerResponse,
  CodeAvailabilityResponse,
  DiscountTypeResponse,
  ApplicableToTypeResponse,
  GetAllCouponsRequest,
  GetTopUsedCouponsRequest,
  GetUsageHistoryRequest,
  GetPerformanceReportRequest,
  GetTopCustomersRequest,
  ExportCouponsRequest
} from '@/types/admin/admincoupon';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AdminCouponService {
  
  // ==================== CRUD Operations ====================
  
  /**
   * Lấy danh sách tất cả mã giảm giá với phân trang và tìm kiếm
   */
  async getAllCoupons(request: GetAllCouponsRequest): Promise<ApiResponse<PagedResult<AdminCouponResponse>>> {
    const params = new URLSearchParams();
    
    if (request.keyword) params.append('keyword', request.keyword);
    if (request.isFeatured !== undefined) params.append('isFeatured', request.isFeatured.toString());
    if (request.isPublic !== undefined) params.append('isPublic', request.isPublic.toString());
    if (request.isActive !== undefined) params.append('isActive', request.isActive.toString());
    if (request.discountType) params.append('discountType', request.discountType);
    if (request.applicableTo) params.append('applicableTo', request.applicableTo);
    params.append('page', request.page.toString());
    params.append('pageSize', request.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/Coupons?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy thông tin mã giảm giá theo ID
   */
  async getCouponById(id: number): Promise<ApiResponse<AdminCouponResponse>> {
    const response = await fetch(`${API_BASE_URL}/Coupons/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Tạo mã giảm giá mới
   */
  async createCoupon(data: CreateCouponRequest): Promise<ApiResponse<AdminCouponResponse>> {
    const response = await fetch(`${API_BASE_URL}/Coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  /**
   * Cập nhật mã giảm giá
   */
  async updateCoupon(id: number, data: UpdateCouponRequest): Promise<ApiResponse<AdminCouponResponse>> {
    const response = await fetch(`${API_BASE_URL}/Coupons/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  /**
   * Xóa mã giảm giá
   */
  async deleteCoupon(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Coupons/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Bật/tắt trạng thái mã giảm giá
   */
  async toggleCouponStatus(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Coupons/${id}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Sao chép coupon
   */
  async duplicateCoupon(id: number, data: DuplicateCouponRequest): Promise<ApiResponse<AdminCouponResponse>> {
    const response = await fetch(`${API_BASE_URL}/Coupons/${id}/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  // ==================== Statistics & Reports ====================

  /**
   * Lấy thống kê tổng quan về coupon
   */
  async getCouponOverviewStatistics(): Promise<ApiResponse<CouponOverviewStatisticsResponse>> {
    const response = await fetch(`${API_BASE_URL}/Coupons/statistics/overview`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy thống kê chi tiết của một coupon
   */
  async getCouponDetailStatistics(id: number): Promise<ApiResponse<CouponDetailStatisticsResponse>> {
    const response = await fetch(`${API_BASE_URL}/Coupons/${id}/statistics`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy top coupon được sử dụng nhiều nhất
   */
  async getTopUsedCoupons(request: GetTopUsedCouponsRequest): Promise<ApiResponse<TopUsedCouponResponse[]>> {
    const params = new URLSearchParams();
    
    params.append('limit', request.limit.toString());
    if (request.startDate) params.append('startDate', request.startDate.toISOString());
    if (request.endDate) params.append('endDate', request.endDate.toISOString());

    const response = await fetch(`${API_BASE_URL}/Coupons/statistics/top-used?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy lịch sử sử dụng coupon của tất cả khách hàng
   */
  async getAllCouponUsageHistory(request: GetUsageHistoryRequest): Promise<ApiResponse<PagedResult<AdminCouponUsageHistoryResponse>>> {
    const params = new URLSearchParams();
    
    if (request.couponId) params.append('couponId', request.couponId.toString());
    if (request.customerId) params.append('customerId', request.customerId.toString());
    if (request.customerEmail) params.append('customerEmail', request.customerEmail);
    if (request.startDate) params.append('startDate', request.startDate.toISOString());
    if (request.endDate) params.append('endDate', request.endDate.toISOString());
    params.append('page', request.page.toString());
    params.append('pageSize', request.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/Coupons/usage-history?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy báo cáo hiệu quả coupon theo thời gian
   */
  async getCouponPerformanceReport(request: GetPerformanceReportRequest): Promise<ApiResponse<CouponPerformanceReportResponse>> {
    const params = new URLSearchParams();
    
    if (request.startDate) params.append('startDate', request.startDate.toISOString());
    if (request.endDate) params.append('endDate', request.endDate.toISOString());
    if (request.groupBy) params.append('groupBy', request.groupBy);

    const response = await fetch(`${API_BASE_URL}/Coupons/statistics/performance-report?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy danh sách coupon sắp hết hạn
   */
  async getExpiringSoonCoupons(days: number = 7): Promise<ApiResponse<ExpiringSoonCouponResponse[]>> {
    const params = new URLSearchParams();
    params.append('days', days.toString());

    const response = await fetch(`${API_BASE_URL}/Coupons/expiring-soon?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy danh sách customer sử dụng coupon nhiều nhất
   */
  async getTopCouponCustomers(request: GetTopCustomersRequest): Promise<ApiResponse<TopCouponCustomerResponse[]>> {
    const params = new URLSearchParams();
    
    params.append('limit', request.limit.toString());
    if (request.startDate) params.append('startDate', request.startDate.toISOString());
    if (request.endDate) params.append('endDate', request.endDate.toISOString());

    const response = await fetch(`${API_BASE_URL}/Coupons/statistics/top-customers?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Xuất báo cáo coupon ra CSV
   */
  async exportCouponsToCSV(request: ExportCouponsRequest): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (request.startDate) params.append('startDate', request.startDate.toISOString());
    if (request.endDate) params.append('endDate', request.endDate.toISOString());

    const response = await fetch(`${API_BASE_URL}/Coupons/export/csv?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.blob();
  }

  // ==================== Helper Functions ====================

  /**
   * Kiểm tra tính khả dụng của mã code
   */
  async checkCodeAvailability(code: string): Promise<ApiResponse<CodeAvailabilityResponse>> {
    const response = await fetch(`${API_BASE_URL}/Coupons/check-availability/${code}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy danh sách các loại discount hợp lệ
   */
  async getDiscountTypes(): Promise<ApiResponse<DiscountTypeResponse[]>> {
    const response = await fetch(`${API_BASE_URL}/Coupons/discount-types`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy danh sách các loại ApplicableTo hợp lệ
   */
  async getApplicableToTypes(): Promise<ApiResponse<ApplicableToTypeResponse[]>> {
    const response = await fetch(`${API_BASE_URL}/Coupons/applicable-to-types`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }
}

export const adminCouponService = new AdminCouponService();
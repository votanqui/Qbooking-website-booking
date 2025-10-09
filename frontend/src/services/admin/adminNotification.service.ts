import {
  ApiResponse,
  NotificationStatisticsResponse,
  UserNotificationStatisticsResponse,
  NotificationReportResponse,
  NotificationReportRequest,
  PaginatedNotificationsResponse,
  AdminNotificationFilterRequest,
  AdminSendNotificationRequest,
  AdminSendToAllNotificationRequest,
  AdminBroadcastNotificationRequest,
  SendNotificationResponse,
  SendAllNotificationResponse,
  BroadcastNotificationResponse,
} from '@/types/admin/adminNotification';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AdminNotificationService {
  /**
   * Lấy thống kê tổng quan về thông báo
   * GET: /api/notification/admin/statistics
   */
  async getStatistics(): Promise<ApiResponse<NotificationStatisticsResponse>> {
    const response = await fetch(`${API_BASE_URL}/Notification/admin/statistics`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy thống kê thông báo của một user cụ thể
   * GET: /api/notification/admin/user-statistics/{userId}
   */
  async getUserStatistics(userId: number): Promise<ApiResponse<UserNotificationStatisticsResponse>> {
    const response = await fetch(`${API_BASE_URL}/Notification/admin/user-statistics/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy báo cáo thông báo theo khoảng thời gian
   * GET: /api/notification/admin/report
   */
  async getReport(request: NotificationReportRequest): Promise<ApiResponse<NotificationReportResponse[]>> {
    const params = new URLSearchParams();
    
    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);
    params.append('groupBy', request.groupBy);

    const response = await fetch(`${API_BASE_URL}/Notification/admin/report?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy danh sách thông báo với filter và phân trang
   * GET: /api/notification/admin
   */
  async getNotificationsWithFilter(
    filter: AdminNotificationFilterRequest
  ): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    const params = new URLSearchParams();
    
    if (filter.type) params.append('type', filter.type);
    if (filter.priority) params.append('priority', filter.priority);
    if (filter.isRead !== undefined) params.append('isRead', filter.isRead.toString());
    if (filter.userId) params.append('userId', filter.userId.toString());
    if (filter.fromDate) params.append('fromDate', filter.fromDate);
    if (filter.toDate) params.append('toDate', filter.toDate);
    params.append('pageNumber', filter.pageNumber.toString());
    params.append('pageSize', filter.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/Notification/admin?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Gửi thông báo cho một user cụ thể
   * POST: /api/notification/admin/send
   */
  async sendNotification(
    request: AdminSendNotificationRequest
  ): Promise<ApiResponse<SendNotificationResponse>> {
    const response = await fetch(`${API_BASE_URL}/Notification/admin/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    return await response.json();
  }

  /**
   * Gửi thông báo cho tất cả user đang hoạt động
   * POST: /api/notification/admin/send-all
   */
  async sendNotificationToAll(
    request: AdminSendToAllNotificationRequest
  ): Promise<ApiResponse<SendAllNotificationResponse>> {
    const response = await fetch(`${API_BASE_URL}/Notification/admin/send-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    return await response.json();
  }

  /**
   * Gửi thông báo broadcast cho nhiều user
   * POST: /api/notification/admin/broadcast
   */
  async broadcastNotification(
    request: AdminBroadcastNotificationRequest
  ): Promise<ApiResponse<BroadcastNotificationResponse>> {
    const response = await fetch(`${API_BASE_URL}/Notification/admin/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    return await response.json();
  }
}

export const adminNotificationService = new AdminNotificationService();
// Base API Response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  error: string | null;
}

// Notification Model
export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  priority: string;
  relatedType?: string;
  relatedId?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  emailTo?: string;
  emailSent: boolean;
  emailRetryCount: number;
  maxEmailRetries: number;
}

// Statistics Response
export interface NotificationStatisticsResponse {
  totalNotifications: number;
  totalSent: number;
  totalRead: number;
  totalUnread: number;
  totalEmailSent: number;
  totalEmailFailed: number;
  readRate: number;
  emailSuccessRate: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

// User Statistics Response
export interface UserNotificationStatisticsResponse {
  userId: number;
  userName: string;
  userEmail: string;
  totalReceived: number;
  totalRead: number;
  totalUnread: number;
  totalEmailSent: number;
  lastNotificationDate?: string;
  readRate: number;
  byType: Record<string, number>;
}

// Report Response
export interface NotificationReportResponse {
  period: string;
  date: string;
  totalSent: number;
  totalRead: number;
  totalEmailSent: number;
  byType: Record<string, number>;
}

// Paginated Response
export interface PaginatedNotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Request Models
export interface AdminNotificationFilterRequest {
  type?: string;
  priority?: string;
  isRead?: boolean;
  userId?: number;
  fromDate?: string;
  toDate?: string;
  pageNumber: number;
  pageSize: number;
}

export interface NotificationReportRequest {
  fromDate?: string;
  toDate?: string;
  groupBy: 'day' | 'week' | 'month';
}

export interface AdminSendNotificationRequest {
  userId: number;
  type: string;
  title: string;
  content: string;
  priority: string;
  relatedType?: string;
  relatedId?: number;
  sendEmail: boolean;
}

export interface AdminSendToAllNotificationRequest {
  type: string;
  title: string;
  content: string;
  priority: string;
  relatedType?: string;
  relatedId?: number;
  sendEmail: boolean;
}

export interface AdminBroadcastNotificationRequest {
  userIds: number[];
  type: string;
  title: string;
  content: string;
  priority: string;
  sendEmail: boolean;
}

// Send Response
export interface SendNotificationResponse {
  notificationId: number;
  realtimeSent: boolean;
  emailQueued: boolean;
}

export interface SendAllNotificationResponse {
  totalSent: number;
  realtimeSent: boolean;
  emailQueued: boolean;
}

export interface BroadcastNotificationResponse {
  totalSent: number;
  realtimeSent: boolean;
  emailQueued: boolean;
}
// types/main/notification.ts

export interface Notification {
  id: number
  userId: number
  type: string
  title: string
  content: string
  priority: string
  isRead: boolean
  createdAt: string
  relatedId?: number
  relatedType?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  statusCode: number
  data: T
}

export interface SendNotificationToGuestRequest {
  userId: number
  type: string
  title: string
  content: string
  priority: string
  relatedType?: string
  relatedId?: number
  sendEmail?: boolean
}

export interface HostNotificationFilter {
  type?: string
  priority?: string
  isRead?: boolean
  userId?: number
  fromDate?: string
  toDate?: string
  pageNumber?: number
  pageSize?: number
}

export interface PaginatedNotifications {
  notifications: Notification[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface UnreadCountData {
  count: number
}
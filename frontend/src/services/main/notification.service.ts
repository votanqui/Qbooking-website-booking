// services/main/notification.service.ts
import * as signalR from '@microsoft/signalr'
import type {
  Notification,
  ApiResponse,

  UnreadCountData
} from '@/types/main/notification'

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`

class NotificationService {
  private connection: signalR.HubConnection | null = null
  private callbacks: ((notification: Notification) => void)[] = []
  private readCallbacks: ((notificationId: number) => void)[] = []
  private userId: number | null = null

  // ============= SignalR Methods =============
  
  async startConnection(userId: number) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return
    }

    this.userId = userId

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hubs/notification`, {
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: () => 3000
      })
      .configureLogging(signalR.LogLevel.Information)
      .build()

    // Listen for new notifications
    this.connection.on('ReceiveNotification', (notification: Notification) => {
      console.log('📩 Received notification:', notification)
      this.callbacks.forEach(callback => callback(notification))
    })

    // Listen for notification marked as read
    this.connection.on('NotificationMarkedAsRead', (notificationId: number) => {
      console.log('✅ Notification marked as read:', notificationId)
      this.readCallbacks.forEach(callback => callback(notificationId))
    })

    // Handle reconnection
    this.connection.onreconnecting(() => {
      console.log('🔄 SignalR Reconnecting...')
    })

    this.connection.onreconnected(async () => {
      console.log('✅ SignalR Reconnected')
      if (this.userId) {
        await this.connection!.invoke('RegisterUser', this.userId)
      }
    })

    this.connection.onclose(() => {
      console.log('❌ SignalR Disconnected')
    })

    try {
      await this.connection.start()
      console.log('✅ SignalR Connected')
      
      // Register user to receive notifications
      await this.connection.invoke('RegisterUser', userId)
      console.log('✅ User registered:', userId)
    } catch (err) {
      console.error('❌ SignalR Connection Error:', err)
      setTimeout(() => this.startConnection(userId), 5000)
    }
  }

  async stopConnection() {
    if (this.connection) {
      await this.connection.stop()
      this.connection = null
      this.userId = null
    }
  }

  onNotification(callback: (notification: Notification) => void) {
    this.callbacks.push(callback)
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback)
    }
  }

  onNotificationRead(callback: (notificationId: number) => void) {
    this.readCallbacks.push(callback)
    return () => {
      this.readCallbacks = this.readCallbacks.filter(cb => cb !== callback)
    }
  }

  // ============= API Methods =============

  async getNotifications(unreadOnly: boolean = false): Promise<ApiResponse<Notification[]>> {
    const response = await fetch(
      `${API_BASE_URL}/notification?unreadOnly=${unreadOnly}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )

    return await response.json()
  }

  async getUnreadCount(): Promise<ApiResponse<UnreadCountData>> {
    const response = await fetch(
      `${API_BASE_URL}/notification/unread-count`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )

    return await response.json()
  }

  async markAsRead(notificationId: number): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${API_BASE_URL}/notification/${notificationId}/read`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )

    return await response.json()
  }

  async markAllAsRead(): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${API_BASE_URL}/notification/mark-all-read`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )

    return await response.json()
  }

  async deleteNotification(notificationId: number): Promise<ApiResponse<any>> {
    const response = await fetch(
      `${API_BASE_URL}/notification/${notificationId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )

    return await response.json()
  }
}

export const notificationService = new NotificationService()
// contexts/NotificationContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { notificationService } from '@/services/main/notification.service'
import type { Notification } from '@/types/main/notification'
import { useAuth } from './AuthContext'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (notificationId: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: number) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      initializeNotifications()
      
      // Setup SignalR connection
      notificationService.startConnection(user.id)

      // Listen for new notifications
      const unsubscribe = notificationService.onNotification((notification) => {
        setNotifications(prev => [notification, ...prev])
        if (!notification.isRead) {
          setUnreadCount(prev => prev + 1)
        }
      })

      return () => {
        unsubscribe()
        notificationService.stopConnection()
      }
    }
  }, [isAuthenticated, user?.id])

  const initializeNotifications = async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Not authenticated, skipping notifications')
      return
    }
    
    console.log('🔄 Loading notifications for user:', user?.id)
    setIsLoading(true)
    
    try {
      const [notifsResponse, countResponse] = await Promise.all([
        notificationService.getNotifications(false),
        notificationService.getUnreadCount()
      ])
      
    
      
      // Handle ApiResponse<Notification[]>
      const notificationsArray = notifsResponse.success && Array.isArray(notifsResponse.data) 
        ? notifsResponse.data 
        : []
      
      // Handle ApiResponse<{ count: number }>
      const unreadNumber = countResponse.success && countResponse.data?.count 
        ? countResponse.data.count 
        : 0
      
      setNotifications(notificationsArray)
      setUnreadCount(unreadNumber)        
    } catch (error) {
      console.error('❌ Failed to load notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await notificationService.markAsRead(notificationId)
      
      if (response.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead()
      
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await notificationService.deleteNotification(notificationId)
      
      if (response.success) {
        const notification = notifications.find(n => n.id === notificationId)
        
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const refreshNotifications = async () => {
    await initializeNotifications()
  }

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
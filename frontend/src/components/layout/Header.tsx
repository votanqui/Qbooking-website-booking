// components/layout/Header.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { useNotifications } from '@/contexts/NotificationContext'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuContentRef = useRef<HTMLDivElement>(null)
  const notificationMenuRef = useRef<HTMLDivElement>(null)
  
  const { user, isLoading, logout } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus when clicking outside
  

  // Listen for new notifications and show toast
  useEffect(() => {
    if (notifications.length > 0 && !notifications[0].isRead) {
      // Show toast for the latest unread notification
      const latestNotification = notifications[0]
      if (latestNotification && !latestNotification.isRead) {
        showToast('Bạn có thông báo mới', 'info')
      }
    }
  }, [notifications.length]) 

  useEffect(() => {
    if (isMenuOpen || selectedNotification) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen, selectedNotification])

  const handleLogout = async () => {
    try {
      await logout()
      showToast('Đã đăng xuất thành công', 'success')
      setIsProfileMenuOpen(false)
      setIsMenuOpen(false)
      router.push('/')
    } catch (error) {
      showToast('Đăng xuất thành công', 'success')
      setIsProfileMenuOpen(false)
      setIsMenuOpen(false)
      router.push('/')
    }
  }

  const formatContent = (content: any) => {
    try {
      if (typeof content === 'object' && content !== null) {
        const entries = Object.entries(content)
          .filter(([key, value]) => {
            return (
              value !== null &&
              value !== undefined &&
              typeof value !== 'object' &&
              String(value).trim().length > 0
            )
          })
          .slice(0, 3)
          .map(([_, value]) => String(value))

        return entries.length > 0 ? entries.join(' - ') : JSON.stringify(content)
      }

      if (typeof content === 'string') {
        try {
          const data = JSON.parse(content)
          return formatContent(data)
        } catch {
          return content
        }
      }

      return String(content)
    } catch {
      return String(content)
    }
  }

  const formatDetailContent = (content: any) => {
    try {
      if (typeof content === 'object' && content !== null) {
        return Object.entries(content)
          .filter(([key, value]) => {
            return (
              value !== null &&
              value !== undefined &&
              typeof value !== 'object' &&
              String(value).trim().length > 0
            )
          })
          .map(([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value)
          }))
      }

      if (typeof content === 'string') {
        try {
          const data = JSON.parse(content)
          return formatDetailContent(data)
        } catch {
          return [{ label: 'Nội dung', value: content }]
        }
      }

      return [{ label: 'Nội dung', value: String(content) }]
    } catch {
      return [{ label: 'Nội dung', value: String(content) }]
    }
  }

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification)
    setIsNotificationOpen(false)
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
  }

  const getNotificationIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'medium':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
    }
  }

  const getAvatarUrl = (avatar: string | undefined) => {
    if (!avatar) return null
    return avatar.startsWith('http') ? avatar : `https://localhost:7257${avatar}`
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBasedMenuItems = () => {
    const items = []
    
    if (user?.role === 'admin') {
      items.push(
        <Link
          key="admin"
          href="/admin/dashboard"
          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-purple-50/80 hover:text-pink-600 transition-all duration-200 rounded-lg"
          onClick={() => {
            setIsProfileMenuOpen(false)
            setIsMenuOpen(false)
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="font-medium">Trang Quản Trị</span>
        </Link>
      )
    }
    
    if (user?.role === 'host') {
      items.push(
        <Link
          key="booking-manager"
          href="/host/bookingmanager"
          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-green-50/80 hover:to-teal-50/80 hover:text-green-600 transition-all duration-200 rounded-lg"
          onClick={() => {
            setIsProfileMenuOpen(false)
            setIsMenuOpen(false)
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h12l4 12H0l4-12h12zm0 0v5a2 2 0 002 2h2a2 2 0 002-2V7h4" />
          </svg>
          <span className="font-medium">Quản Lý Đặt Phòng</span>
        </Link>
      )
      
      items.push(
        <Link
          key="properties-manager"
          href="/host/propertiesmanager"
          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-pink-50/80 hover:text-purple-600 transition-all duration-200 rounded-lg"
          onClick={() => {
            setIsProfileMenuOpen(false)
            setIsMenuOpen(false)
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="font-medium">Quản lý bài đăng</span>
        </Link>
      )

      items.push(
        <Link
          key="review-manager"
          href="/host/reviewmanager"
          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-cyan-50/80 hover:text-blue-600 transition-all duration-200 rounded-lg"
          onClick={() => {
            setIsProfileMenuOpen(false)
            setIsMenuOpen(false)
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="font-medium">Quản lý đánh giá</span>
        </Link>
      )
    }
    
    return items
  }

  const shouldShowMyReviews = () => {
    return user && user.role === 'customer'
  }

  const closeMobileMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-pink-200/30' 
          : 'bg-white/90 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group shrink-0">
              <div className="relative">
                <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200 shadow-lg">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  QBooking
                </span>
                <div className="text-xs text-pink-500 -mt-1 hidden lg:block">Kỳ nghỉ trong mơ của bạn</div>
              </div>
              <div className="sm:hidden">
                <span className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                 QBooking
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link 
                href="/properties" 
                className="px-4 py-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50/50 rounded-lg transition-all duration-200 font-medium"
              >
                Khám phá
              </Link>
              <Link 
                href="/rooms" 
                className="px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50/50 rounded-lg transition-all duration-200 font-medium"
              >
                Phòng
              </Link>
              {user && (
                <Link 
                  href="/my-bookings" 
                  className="px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50/50 rounded-lg transition-all duration-200 font-medium"
                >
                  Đặt phòng của tôi
                </Link>
              )}
              <Link 
                href="/aboutUs"
                className="px-4 py-2 text-gray-600 hover:text-pink-500 hover:bg-pink-50/50 rounded-lg transition-all duration-200 font-medium"
              >
                Về chúng tôi
              </Link>
              <Link 
                href="/Policy" 
                className="px-4 py-2 text-gray-600 hover:text-purple-500 hover:bg-purple-50/50 rounded-lg transition-all duration-200 font-medium"
              >
                Điều khoản
              </Link>
            </nav>

            {/* Desktop Notification & Profile */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Notification Bell - Desktop */}
              {user && (
                <div className="relative" ref={notificationMenuRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 rounded-xl hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-purple-50/80 transition-all duration-200 group"
                  >
                    <svg className="w-6 h-6 text-gray-600 group-hover:text-pink-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-96 max-h-[32rem] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-pink-200/50 z-20">
                      <div className="px-4 py-3 border-b border-pink-100/50 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md">
                      
                        <h3 className="font-semibold text-gray-900">Thông báo</h3>
                          {unreadCount > 0 && (
                          <span className="text-xs text-pink-600 font-medium bg-pink-50 px-2.5 py-1 rounded-full">
                            {unreadCount} mới
                          </span>
                        )}
<Link
  href="/notification"
  onClick={() => setIsNotificationOpen(false)}
  className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-lg transition-all duration-200 text-sm font-medium text-purple-600 hover:text-purple-700 hover:shadow-sm"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
  Tất cả Thông Báo
</Link>
                      
                      </div>

                      <div className="py-2">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-12 text-center text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-sm font-medium">Không có thông báo nào</p>
                            <p className="text-xs text-gray-400 mt-1">Các thông báo mới sẽ hiển thị ở đây</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-purple-50/80 transition-all duration-200 border-l-4 ${
                                notification.isRead 
                                  ? 'border-transparent bg-white' 
                                  : 'border-pink-500 bg-pink-50/30'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                  notification.priority === 'high' ? 'bg-red-100' :
                                  notification.priority === 'medium' ? 'bg-yellow-100' :
                                  'bg-blue-100'
                                }`}>
                                  <svg className={`w-5 h-5 ${
                                    notification.priority === 'high' ? 'text-red-600' :
                                    notification.priority === 'medium' ? 'text-yellow-600' :
                                    'text-blue-600'
                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {formatContent(notification.content)}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <div className="flex-shrink-0 w-2 h-2 bg-pink-500 rounded-full mt-1"></div>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Section */}
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 animate-pulse bg-gray-200 rounded-full"></div>
                  <div className="w-20 h-4 animate-pulse bg-gray-200 rounded"></div>
                </div>
              ) : user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-pink-50/50 transition-all duration-200 group"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent bg-gradient-to-r from-pink-500 to-purple-600 p-0.5">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                          {getAvatarUrl(user.avatar) ? (
                            <img
                              src={getAvatarUrl(user.avatar)!}
                              alt={user.fullName}
                              className="w-full h-full object-cover"
                              key={user.avatar}
                            />
                          ) : (
                            <span className="text-pink-600 text-sm font-semibold">
                              {getInitials(user.fullName)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">{user.fullName}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {user.role === 'host' ? 'Host' : user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                      </div>
                    </div>
                    
                    <svg className={`w-4 h-4 text-pink-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-pink-200/30 py-2 z-20">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-pink-100/50">
                        <div className="flex items-center space-x-3">
                          
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 bg-gradient-to-r from-pink-500 to-purple-600 p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                              {getAvatarUrl(user.avatar) ? (
                                <img
                                  src={getAvatarUrl(user.avatar)!}
                                  alt={user.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-pink-600 text-sm font-semibold">
                                  {getInitials(user.fullName)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.fullName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'host' ? 'bg-purple-100 text-purple-800' :
                              'bg-pink-100 text-pink-800'
                            }`}>
                              {user.role === 'host' ? 'Host' : user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-purple-50/80 hover:text-pink-600 transition-all duration-200 rounded-lg mx-2"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Thông tin cá nhân</span>
                        </Link>

                        <Link
                          href="/my-bookings"
                          className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-indigo-50/80 hover:text-purple-600 transition-all duration-200 rounded-lg mx-2"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h12l4 12H0l4-12h12zm0 0v5a2 2 0 002 2h2a2 2 0 002-2V7h4" />
                          </svg>
                          <span>Đặt phòng của tôi</span>
                        </Link>

                        <Link
                          href="/favorite"
                          className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-red-50/80 hover:to-pink-50/80 hover:text-red-600 transition-all duration-200 rounded-lg mx-2"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>Yêu thích</span>
                        </Link>
                        
                        <Link
                          href="/discount"
                          className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-orange-50/80 hover:to-pink-50/80 hover:text-orange-600 transition-all duration-200 rounded-lg mx-2"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M3 11l8.485-8.485a2 2 0 012.828 0L21 9.172a2 2 0 010 2.828L12.515 20.485a2 2 0 01-2.828 0L3 13.828a2 2 0 010-2.828z" />
                          </svg>
                          <span>Danh Sách Giảm Giá</span>
                        </Link>

                        {shouldShowMyReviews() && (
                          <Link
                            href="/my-reviews"
                            className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-yellow-50/80 hover:to-amber-50/80 hover:text-yellow-600 transition-all duration-200 rounded-lg mx-2"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            <span>Đánh giá của tôi</span>
                          </Link>
                        )}

                        {getRoleBasedMenuItems()}

                        <div className="border-t border-pink-100/50 my-2 mx-2"></div>

                        <Link
                          href="/aboutUs"
                          className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-purple-50/80 hover:text-pink-600 transition-all duration-200 rounded-lg mx-2"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Về chúng tôi</span>
                        </Link>

                        <Link
                          href="/Policy"
                          className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-indigo-50/80 hover:text-purple-600 transition-all duration-200 rounded-lg mx-2"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Điều khoản</span>
                        </Link>
                        
                        <div className="border-t border-pink-100/50 my-2 mx-2"></div>
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-3 text-pink-600 hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-red-50/80 hover:text-pink-700 transition-all duration-200 rounded-lg mx-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-600 hover:text-pink-600 hover:bg-pink-50/50 font-medium"
                  >
                    <Link href="/auth/login">Đăng nhập</Link>
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Link href="/auth/register">Đăng ký</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Right Section - Notification + Menu Button */}
            <div className="flex lg:hidden items-center space-x-2">
              {/* Mobile Notification Bell */}
              {user && (
                <div className="relative" ref={notificationMenuRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 rounded-lg hover:bg-pink-50/50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Mobile Notification Dropdown */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-pink-200/50 z-50">
                      <div className="px-3 py-2.5 border-b border-pink-100/50 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md">
                        <h3 className="font-semibold text-sm text-gray-900">Thông báo</h3>
                                       {unreadCount > 0 && (
                          <span className="text-xs text-pink-600 font-medium bg-pink-50 px-2.5 py-1 rounded-full">
                            {unreadCount} mới
                          </span>
                        )}
<Link
  href="/notification"
  onClick={() => setIsNotificationOpen(false)}
  className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-lg transition-all duration-200 text-sm font-medium text-purple-600 hover:text-purple-700 hover:shadow-sm"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
  Tất cả Thông Báo
</Link>
                          

                          
                      </div>

                      <div className="py-1">
                        {notifications.length === 0 ? (
                          <div className="px-3 py-8 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-xs font-medium">Không có thông báo</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left px-3 py-2.5 hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-purple-50/80 transition-all duration-200 border-l-3 ${
                                notification.isRead 
                                  ? 'border-transparent bg-white' 
                                  : 'border-pink-500 bg-pink-50/30'
                              }`}
                            >
                              <div className="flex items-start space-x-2">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                  notification.priority === 'high' ? 'bg-red-100' :
                                  notification.priority === 'medium' ? 'bg-yellow-100' :
                                  'bg-blue-100'
                                }`}>
                                  <svg className={`w-4 h-4 ${
                                    notification.priority === 'high' ? 'text-red-600' :
                                    notification.priority === 'medium' ? 'text-yellow-600' :
                                    'text-blue-600'
                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                                    {formatContent(notification.content)}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    {new Date(notification.createdAt).toLocaleString('vi-VN', { 
                                      day: '2-digit', 
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <div className="flex-shrink-0 w-1.5 h-1.5 bg-pink-500 rounded-full mt-1"></div>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-pink-50/50 transition-colors"
                data-mobile-menu-button
              >
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
                  
      {/* Notification Detail Modal - Fixed for Mobile */}
      {selectedNotification && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
            onClick={() => setSelectedNotification(null)}
          />
          
          {/* Modal - Responsive for Mobile */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-lg mx-auto max-h-[90vh] lg:max-h-[85vh] overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-4 lg:px-6 py-6 lg:py-8">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="absolute top-3 right-3 lg:top-4 lg:right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                >
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-start space-x-3 lg:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      {getNotificationIcon(selectedNotification.priority)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg lg:text-2xl font-bold text-white mb-2 break-words">
                      {selectedNotification.title}
                    </h2>
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-1 lg:space-y-0 lg:space-x-2">
                      <span className={`inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedNotification.priority === 'high' ? 'bg-red-500/90 text-white' :
                        selectedNotification.priority === 'medium' ? 'bg-yellow-500/90 text-white' :
                        'bg-blue-500/90 text-white'
                      }`}>
                        {selectedNotification.priority === 'high' ? 'Quan trọng' :
                         selectedNotification.priority === 'medium' ? 'Bình thường' :
                         'Thông tin'}
                      </span>
                      <span className="text-white/90 text-xs lg:text-sm">
                        {new Date(selectedNotification.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 lg:p-6 overflow-y-auto max-h-[calc(90vh-180px)] lg:max-h-[calc(85vh-180px)]">
                <div className="space-y-3 lg:space-y-4">
                  {Array.isArray(formatDetailContent(selectedNotification.content)) ? (
                    formatDetailContent(selectedNotification.content).map((item: any, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-pink-50/50 to-purple-50/50 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-pink-100/50">
                        <div className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-1">
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-800 font-medium break-words">
                          {item.value}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gradient-to-r from-pink-50/50 to-purple-50/50 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-pink-100/50">
                      <div className="text-sm text-gray-800 leading-relaxed break-words">
                        {formatContent(selectedNotification.content)}
                      </div>
                    </div>
                  )}

                  {selectedNotification.relatedType && selectedNotification.relatedId && (
                    <div className="pt-3 lg:pt-4 border-t border-pink-100">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between text-xs text-gray-500 space-y-1 lg:space-y-0">
                        <span>Loại: {selectedNotification.relatedType}</span>
                        <span>ID: {selectedNotification.relatedId}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 lg:px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-3 lg:justify-end">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 lg:px-6 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-lg lg:rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm lg:text-base order-2 lg:order-1"
                >
                  Đóng
                </button>
                {!selectedNotification.isRead && (
                  <button
                    onClick={() => {
                      markAsRead(selectedNotification.id)
                      setSelectedNotification(null)
                    }}
                    className="px-4 lg:px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg lg:rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-sm lg:text-base order-1 lg:order-2"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
                
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Slide Panel */}
      <div 
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl flex flex-col ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-pink-200/30 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              QBooking
            </span>
          </div>
          <button
            onClick={closeMobileMenu}
            className="p-2 rounded-lg hover:bg-pink-50/50 transition-colors"
          >
            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Content */}
        <div ref={mobileMenuContentRef} className="flex-1 overflow-y-auto">
          {/* User Section */}
          {user && (
            <div className="p-4 bg-gradient-to-r from-pink-50/50 to-purple-50/50 border-b border-pink-200/30">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink-500">
                  {getAvatarUrl(user.avatar) ? (
                    <img
                      src={getAvatarUrl(user.avatar)!}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {getInitials(user.fullName)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{user.fullName}</div>
                  <div className="text-sm text-gray-600 truncate">{user.email}</div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'host' ? 'bg-purple-100 text-purple-800' :
                    'bg-pink-100 text-pink-800'
                  }`}>
                    {user.role === 'host' ? 'Host' : user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4">
            <div className="space-y-2">
              <Link 
                href="/properties" 
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-pink-50/50 hover:text-pink-600 transition-all duration-200 rounded-lg font-medium"
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Khám phá</span>
              </Link>

              <Link 
                href="/rooms" 
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-50/50 hover:text-purple-600 transition-all duration-200 rounded-lg font-medium"
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Phòng</span>
              </Link>

              {user && (
                <Link 
                  href="/my-bookings" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-50/50 hover:text-purple-600 transition-all duration-200 rounded-lg font-medium"
                  onClick={closeMobileMenu}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h12l4 12H0l4-12h12zm0 0v5a2 2 0 002 2h2a2 2 0 002-2V7h4" />
                  </svg>
                  <span>Đặt phòng của tôi</span>
                </Link>
              )}

              {user && (
                <Link 
                  href="/favorite" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-red-50/50 hover:text-red-600 transition-all duration-200 rounded-lg font-medium"
                  onClick={closeMobileMenu}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>Yêu thích</span>
                </Link>
              )}

              {user && (
                <Link 
                  href="/discount" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-orange-50/50 hover:text-orange-600 transition-all duration-200 rounded-lg font-medium"
                  onClick={closeMobileMenu}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M3 11l8.485-8.485a2 2 0 012.828 0L21 9.172a2 2 0 010 2.828L12.515 20.485a2 2 0 01-2.828 0L3 13.828a2 2 0 010-2.828z" />
                  </svg>
                  <span>Danh Sách Giảm Giá</span>
                </Link>
              )}

              {user && shouldShowMyReviews() && (
                <Link 
                  href="/my-reviews" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-yellow-50/50 hover:text-yellow-600 transition-all duration-200 rounded-lg font-medium"
                  onClick={closeMobileMenu}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span>Đánh giá của tôi</span>
                </Link>
              )}

              {(!user || user.role === 'customer') && (
                <Link 
                  href="/become-host" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-indigo-50/50 hover:text-indigo-600 transition-all duration-200 rounded-lg font-medium"
                  onClick={closeMobileMenu}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Trở thành Host</span>
                </Link>
              )}

              <Link 
                href="/aboutUs" 
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-pink-50/50 hover:text-pink-600 transition-all duration-200 rounded-lg font-medium"
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Về chúng tôi</span>
              </Link>

              <Link 
                href="/Policy" 
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-50/50 hover:text-purple-600 transition-all duration-200 rounded-lg font-medium"
                onClick={closeMobileMenu}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Điều khoản</span>
              </Link>

              {user && (
                <>
                  <div className="border-t border-pink-200/30 my-4"></div>
                  
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-pink-50/50 hover:text-pink-600 transition-all duration-200 rounded-lg font-medium"
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Thông tin cá nhân</span>
                  </Link>

                  {getRoleBasedMenuItems()}
                </>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-pink-200/30 p-4 shrink-0 bg-white">
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-pink-600 hover:bg-pink-50/50 hover:text-pink-700 transition-all duration-200 rounded-lg font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          ) : (
            <div className="space-y-3">
              <Link href="/auth/login" onClick={closeMobileMenu}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-center font-medium border-pink-300 text-pink-600 hover:bg-pink-50/50"
                >
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/auth/register" onClick={closeMobileMenu}>
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium justify-center"
                >
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
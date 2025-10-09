'use client'

import { useState, useEffect, JSX } from 'react'
import { Bell, Check, Trash2, Search, X, Mail, Clock, CheckCheck, Loader2, User, Phone, MapPin, Calendar, CreditCard, Home, Bed, DollarSign, Users } from 'lucide-react'
import { notificationService } from '@/services/main/notification.service'
import type { Notification } from '@/types/main/notification'

const NotificationPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showMobileModal, setShowMobileModal] = useState(false)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
    
    const unsubscribe = notificationService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationService.getNotifications(filter === 'unread')
      if (response.success) {
        setNotifications(response.data)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount()
      if (response.success) {
        setUnreadCount(response.data.count)
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await notificationService.markAsRead(notificationId)
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification)
    
    // Trên mobile, hiển thị modal
    if (window.innerWidth < 1024) { // lg breakpoint
      setShowMobileModal(true)
    }
    
    // Đánh dấu đã đọc nếu chưa đọc
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
  }

  const closeMobileModal = () => {
    setShowMobileModal(false)
    // Giữ selectedNotification để khi mở lại trên desktop vẫn hiển thị
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      booking: 'bg-purple-100 text-purple-700 border-purple-200',
      payment: 'bg-green-100 text-green-700 border-green-200',
      review: 'bg-pink-100 text-pink-700 border-pink-200',
      system: 'bg-blue-100 text-blue-700 border-blue-200'
    }
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      booking: 'Đặt phòng',
      payment: 'Thanh toán',
      review: 'Đánh giá',
      system: 'Hệ thống'
    }
    return labels[type] || type
  }

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, JSX.Element> = {
      high: <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Cao</span>,
      normal: <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Bình thường</span>,
      low: <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">Thấp</span>
    }
    return badges[priority] || badges.normal
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
            value: String(value),
            key: key
          }))
      }

      if (typeof content === 'string') {
        try {
          const data = JSON.parse(content)
          return formatDetailContent(data)
        } catch {
          return [{ label: 'Nội dung', value: content, key: 'content' }]
        }
      }

      return [{ label: 'Nội dung', value: String(content), key: 'content' }]
    } catch {
      return [{ label: 'Nội dung', value: String(content), key: 'content' }]
    }
  }

  const getFieldIcon = (key: string) => {
    const iconMap: Record<string, any> = {
      hostname: User,
      guestname: User,
      guestphone: Phone,
      guestemail: Mail,
      bookingcode: CreditCard,
      checkin: Calendar,
      checkout: Calendar,
      nights: Clock,
      adults: Users,
      children: Users,
      roomscount: Bed,
      totalamount: DollarSign,
      roomprice: DollarSign,
      discountamount: DollarSign,
      taxamount: DollarSign,
      servicefee: DollarSign,
      propertyname: Home,
      roomtypename: Bed,
      propertyaddress: MapPin,
    }
    const Icon = iconMap[key.toLowerCase()]
    return Icon ? <Icon className="w-4 h-4" /> : null
  }

  const getFieldLabel = (key: string) => {
    const labelMap: Record<string, string> = {
      hostname: 'Chủ nhà',
      guestname: 'Khách hàng',
      guestphone: 'Số điện thoại',
      guestemail: 'Email',
      bookingcode: 'Mã đặt phòng',
      checkin: 'Nhận phòng',
      checkout: 'Trả phòng',
      nights: 'Số đêm',
      adults: 'Người lớn',
      children: 'Trẻ em',
      roomscount: 'Số phòng',
      totalamount: 'Tổng tiền',
      roomprice: 'Giá phòng',
      discountpercent: 'Giảm giá (%)',
      discountamount: 'Số tiền giảm',
      taxamount: 'Thuế',
      servicefee: 'Phí dịch vụ',
      specialrequests: 'Yêu cầu đặc biệt',
      propertyname: 'Khách sạn',
      roomtypename: 'Loại phòng',
      propertyaddress: 'Địa chỉ',
      bookedat: 'Thời gian đặt',
      paymenturl: 'Link thanh toán'
    }
    return labelMap[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1)
  }

  const formatFieldValue = (key: string, value: string) => {
    const lowerKey = key.toLowerCase()
    
    if (lowerKey.includes('amount') || lowerKey.includes('price') || lowerKey.includes('fee')) {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
      }
    }
    
    if (lowerKey.includes('date') || lowerKey === 'checkin' || lowerKey === 'checkout' || lowerKey === 'bookedat') {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('vi-VN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: lowerKey === 'bookedat' ? '2-digit' : undefined,
            minute: lowerKey === 'bookedat' ? '2-digit' : undefined
          })
        }
      } catch {}
    }
    
    return value
  }

  const renderDetailContent = (notification: Notification) => {
    const details = formatDetailContent(notification.content)
    
    return (
      <div className="space-y-2">
        {details.map((item, index) => {
          const icon = getFieldIcon(item.key)
          const label = getFieldLabel(item.key)
          const value = formatFieldValue(item.key, item.value)
          
          return (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              {icon && (
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-purple-600 mt-0.5">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.isRead) return false
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !n.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Component cho Detail Panel (dùng chung cho cả desktop và mobile)
  const DetailPanel = ({ notification, onClose, isMobile = false }: { 
    notification: Notification, 
    onClose?: () => void,
    isMobile?: boolean 
  }) => (
    <div className={`bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-purple-200 overflow-hidden ${isMobile ? 'h-full' : ''}`}>
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 text-xs font-medium rounded-full backdrop-blur-sm">
            {getTypeLabel(notification.type)}
          </span>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <h2 className="text-lg sm:text-xl font-bold">{notification.title}</h2>
      </div>
      <div className="p-4 sm:p-6 space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-gray-500 mb-3">Chi tiết</h4>
          {renderDetailContent(notification)}
        </div>
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-500">Mức độ ưu tiên</span>
            {getPriorityBadge(notification.priority)}
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-500">Trạng thái</span>
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
              notification.isRead
                ? 'bg-gray-100 text-gray-700'
                : 'bg-pink-100 text-pink-700'
            }`}>
              {notification.isRead ? 'Đã đọc' : 'Chưa đọc'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-500">Thời gian</span>
            <span className="text-gray-700 font-medium text-xs sm:text-sm">{formatDate(notification.createdAt)}</span>
          </div>
          {notification.relatedId && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-500">Liên quan đến</span>
              <span className="text-purple-600 font-medium">#{notification.relatedId}</span>
            </div>
          )}
        </div>
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
          {!notification.isRead && (
            <button
              onClick={() => handleMarkAsRead(notification.id)}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Đánh dấu đã đọc
            </button>
          )}
        
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Thông Báo</h1>
                <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã được đọc'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-purple-100">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-xl font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  filter === 'unread'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Chưa đọc
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* List - Luôn chiếm toàn bộ width trên mobile, chỉ chiếm 2/3 trên desktop */}
          <div className={`${selectedNotification && !showMobileModal ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-3`}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-purple-100">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Không có thông báo</h3>
                <p className="text-sm text-gray-500">Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer border-2 ${
                    selectedNotification?.id === notification.id && !showMobileModal
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : notification.isRead
                      ? 'border-transparent'
                      : 'border-pink-200'
                  }`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium rounded-full border ${getTypeColor(notification.type)}`}>
                            {getTypeLabel(notification.type)}
                          </span>
                          {getPriorityBadge(notification.priority)}
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <h3 className={`text-base sm:text-lg font-semibold mb-1 ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-3">
                          {formatContent(notification.content)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                     
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Panel - Chỉ hiển thị trên desktop khi có selectedNotification */}
          {selectedNotification && !showMobileModal && (
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-4 sm:top-6">
                <DetailPanel notification={selectedNotification} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Modal */}
      {showMobileModal && selectedNotification && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobileModal}
          />
          
          {/* Modal Content */}
          <div className="absolute inset-0 bg-white flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <DetailPanel 
                notification={selectedNotification} 
                onClose={closeMobileModal}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationPage
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Calendar, Users, Bed, AlertCircle, Loader2, Tag, ArrowRight } from 'lucide-react'
import { bookingService } from '@/services/main/booking.service'
import { discountService } from '@/services/main/discount.service'
import { useToast } from '@/components/ui/Toast'
import { BookingDetailDto } from '@/types/main/booking'

export default function ApplyCouponPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const bookingCode = params.code as string
  
  const [loading, setLoading] = useState(true)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [booking, setBooking] = useState<BookingDetailDto | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [toastShown, setToastShown] = useState(false)

  useEffect(() => {
    if (bookingCode) {
      fetchBookingDetail()
    }
  }, [bookingCode])

  const fetchBookingDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      setAccessDenied(false)
      setToastShown(false)
      
      const response = await bookingService.getBookingByCode(bookingCode)
      
      if (response.success && response.data) {
        setBooking(response.data)
        // Check if coupon already applied
        if (response.data.couponDiscountAmount && response.data.couponDiscountAmount > 0) {
          setAppliedCoupon({
            couponCode: 'APPLIED',
            couponName: 'Mã giảm giá đã áp dụng',
            discountAmount: response.data.couponDiscountAmount
          })
        }
      } else {
        // Check if it's an access denied error
        if (response.statusCode === 404 && response.message?.includes('không có quyền truy cập')) {
          setAccessDenied(true)
          setError('Bạn không có quyền truy cập vào đặt phòng này')
          if (!toastShown) {
            showToast('Bạn không có quyền truy cập vào đặt phòng này', 'error')
            setToastShown(true)
          }
        } else {
          setError(response.message || 'Không thể tải thông tin đặt phòng')
        }
      }
    } catch (err: any) {
      console.error('Error fetching booking:', err)
      
      // Handle specific HTTP errors
      if (err.message?.includes('404')) {
        setAccessDenied(true)
        setError('Đặt phòng không tồn tại hoặc bạn không có quyền truy cập')
        if (!toastShown) {
          showToast('Đặt phòng không tồn tại hoặc bạn không có quyền truy cập', 'error')
          setToastShown(true)
        }
      } else if (err.message?.includes('401')) {
        setAccessDenied(true)
        setError('Vui lòng đăng nhập để truy cập đặt phòng này')
        if (!toastShown) {
          showToast('Vui lòng đăng nhập để truy cập đặt phòng này', 'error')
          setToastShown(true)
        }
      } else {
        setError('Lỗi khi tải thông tin. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showToast('Vui lòng nhập mã giảm giá', 'warning')
      return
    }

    setApplyingCoupon(true)
    try {
      const result = await discountService.applyCouponByCode(couponCode, bookingCode)

      if (result.success && result.data) {
        setAppliedCoupon(result.data)
        showToast(result.message || 'Áp dụng mã giảm giá thành công!', 'success')
        // Refresh booking data to get updated prices
        await fetchBookingDetail()
        setCouponCode('')
      } else {
        showToast(result.message || 'Không thể áp dụng mã giảm giá', 'error')
      }
    } catch (err: any) {
      console.error('Error applying coupon:', err)
      showToast('Đã xảy ra lỗi khi áp dụng mã giảm giá', 'error')
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleCancelCoupon = async () => {
    try {
      const result = await discountService.cancelCouponByCode(bookingCode)

      if (result.success) {
        setAppliedCoupon(null)
        showToast('Đã hủy mã giảm giá', 'success')
        await fetchBookingDetail()
      } else {
        showToast(result.message || 'Không thể hủy mã giảm giá', 'error')
      }
    } catch (err: any) {
      console.error('Error canceling coupon:', err)
      showToast('Đã xảy ra lỗi khi hủy mã giảm giá', 'error')
    }
  }

  const handleProceedToPayment = () => {
    if (booking) {
      router.push(`/booking/${bookingCode}/payment`)
    }
  }

  const handleGoToMyBookings = () => {
    router.push('/my-bookings')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        {/* Soft mystical background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 via-purple-100/50 to-indigo-100/50 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-pink-600/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-purple-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-indigo-600/20 rounded-full blur-xl animate-bounce delay-700"></div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-pink-600 to-purple-600 mx-auto mb-4 relative">
              <div className="absolute inset-2 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 rounded-full"></div>
            </div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-pink-600/50 mx-auto"></div>
          </div>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-lg font-medium animate-pulse">
            Đang kiểm tra quyền truy cập...
          </p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        {/* Soft mystical background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/30 via-purple-100/30 to-indigo-100/30 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl animate-pulse delay-300"></div>
        
        <div className="text-center relative z-10 backdrop-blur-sm bg-white/80 p-12 rounded-3xl border border-pink-600/20 shadow-2xl max-w-md mx-4">
          <div className="relative mb-8">
            <div className="text-8xl mb-4 animate-pulse">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
                🔮
              </span>
            </div>
            <div className="absolute inset-0 animate-ping opacity-30">
              <span className="text-8xl text-pink-600/50">
                🔮
              </span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
            Vùng Cấm Địa
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Chỉ những <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 font-semibold">Chủ Nhân Đích Thực</span> mới có thể truy cập vào đặt phòng này...
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleGoToMyBookings}
              className="group relative w-full px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full hover:from-pink-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              <span className="relative z-10 font-semibold">📋 Xem Đặt Phòng Của Tôi</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-600/50 via-purple-600/50 to-indigo-600/50 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="group relative w-full px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-gray-500/25"
            >
              <span className="relative z-10 font-semibold">🏠 Về Trang Chủ</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-600/50 via-gray-600/50 to-gray-700/50 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
            </button>
          </div>
          
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse delay-200"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse delay-400"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
        {/* Soft mystical background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/30 via-purple-100/30 to-indigo-100/30 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        
        <div className="text-center relative z-10 backdrop-blur-sm bg-white/80 p-12 rounded-3xl border border-pink-600/20 shadow-2xl max-w-md mx-4">
          <div className="relative mb-8">
            <div className="text-8xl mb-4 animate-pulse">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
                ⚠️
              </span>
            </div>
            <div className="absolute inset-0 animate-ping opacity-30">
              <span className="text-8xl text-pink-600/50">
                ⚠️
              </span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
            Có Lỗi Xảy Ra
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            {error || 'Không tìm thấy thông tin đặt phòng'}
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="group relative w-full px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full hover:from-pink-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              <span className="relative z-10 font-semibold">↩️ Quay Lại</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-600/50 via-purple-600/50 to-indigo-600/50 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
            </button>
            
            <button
              onClick={handleGoToMyBookings}
              className="group relative w-full px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-gray-500/25"
            >
              <span className="relative z-10 font-semibold">📋 Xem Đặt Phòng Của Tôi</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-600/50 via-gray-600/50 to-gray-700/50 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
            </button>
          </div>
          
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse delay-200"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse delay-400"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Xác nhận & Áp dụng mã giảm giá
          </h1>
          <p className="text-gray-600">Mã đặt phòng: <span className="font-semibold">{booking.bookingCode}</span></p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin đặt phòng</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Khách sạn</p>
                  <p className="font-semibold text-gray-900">{booking.propertyName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Loại phòng</p>
                  <p className="font-semibold text-gray-900">{booking.roomTypeName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600">Nhận phòng</p>
                      <p className="font-medium text-gray-900 text-sm">{formatDate(booking.checkIn)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600">Trả phòng</p>
                      <p className="font-medium text-gray-900 text-sm">{formatDate(booking.checkOut)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-pink-500" />
                    <span className="font-medium text-gray-900">{booking.roomsCount} phòng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-pink-500" />
                    <span className="text-gray-700">{booking.adults} người lớn, {booking.children} trẻ em</span>
                  </div>
                  <span className="text-gray-600">{booking.nights} đêm</span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Tên khách</p>
                  <p className="font-medium text-gray-900">{booking.guestName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-medium text-gray-900">{booking.guestEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Số điện thoại</p>
                    <p className="font-medium text-gray-900">{booking.guestPhone}</p>
                  </div>
                </div>

                {booking.specialRequests && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Yêu cầu đặc biệt</p>
                    <p className="text-gray-700">{booking.specialRequests}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Apply Coupon */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-pink-500" />
                Mã giảm giá
              </h2>
              
              {appliedCoupon ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Tag className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-900">{appliedCoupon.couponName}</p>
                        <p className="text-sm text-green-700">Mã: {appliedCoupon.couponCode}</p>
                        <p className="text-sm text-green-700 mt-1">
                          Giảm: {bookingService.formatCurrency(appliedCoupon.discountAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelCoupon}
                    className="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-all border border-red-200 flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Hủy mã giảm giá
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã giảm giá"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    disabled={applyingCoupon}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {applyingCoupon ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang áp dụng...
                      </>
                    ) : (
                      'Áp dụng'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-200 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Chi tiết giá</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiền phòng ({booking.nights} đêm)</span>
                  <span className="font-medium">{bookingService.formatCurrency(booking.roomPrice)}</span>
                </div>

                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá phòng ({booking.discountPercent.toFixed(0)}%)</span>
                    <span>-{bookingService.formatCurrency(booking.discountAmount)}</span>
                  </div>
                )}

                {booking.couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Mã giảm giá ({(booking.couponDiscountPercent * 100).toFixed(0)}%)</span>
                    <span>-{bookingService.formatCurrency(booking.couponDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thuế</span>
                  <span className="font-medium">{bookingService.formatCurrency(booking.taxAmount)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí dịch vụ</span>
                  <span className="font-medium">{bookingService.formatCurrency(booking.serviceFee)}</span>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {bookingService.formatCurrency(booking.totalAmount)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToPayment}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Tiếp tục thanh toán
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-xs text-center text-gray-500 mt-4">
                  Bạn sẽ không bị tính phí cho đến khi hoàn tất thanh toán
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
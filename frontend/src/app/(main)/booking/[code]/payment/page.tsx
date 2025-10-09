'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CreditCard, Building2, Wallet, QrCode, CheckCircle, AlertCircle, ArrowLeft, Shield, Copy, Check, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { bookingService } from '@/services/main/booking.service'
import { userService } from '@/services/main/user.service'
import { BookingData } from '@/types/main/booking'

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const bookingCode = params.code as string
  
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600)
  const [isExpired, setIsExpired] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownToast = useRef(false)
  const authChecked = useRef(false)

  // Kiểm tra authentication một lần duy nhất
  useEffect(() => {
    if (authChecked.current) return
    authChecked.current = true

    const checkAuth = async () => {
      try {
        const result = await userService.getProfile()
        
        if (!result.success || result.statusCode === 401 || result.statusCode === 403) {
          setAccessDenied(true)
          setError('Vui lòng đăng nhập để truy cập trang thanh toán')
          setLoading(false)
          
          if (!hasShownToast.current) {
            showToast('Vui lòng đăng nhập để tiếp tục', 'error')
            hasShownToast.current = true
          }
          
          setTimeout(() => router.push('/auth/login'), 2000)
          return
        }
        
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth check error:', error)
        setAccessDenied(true)
        setError('Vui lòng đăng nhập để truy cập trang thanh toán')
        setLoading(false)
        setTimeout(() => router.push('/auth/login'), 2000)
      }
    }

    checkAuth()
  }, []) // Chỉ chạy một lần khi mount

  // Fetch booking data một lần khi đã authenticated
 useEffect(() => {
    if (!isAuthenticated || !bookingCode) return

    const fetchBookingData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await bookingService.getPaymentQRCode(bookingCode)
        
        if (result.success && result.data) {
          // Kiểm tra nếu đã thanh toán thì chuyển về trang bookings
          if (result.data.paymentStatus === 'paid') {
            if (!hasShownToast.current) {
              showToast('Đặt phòng này đã được thanh toán', 'info')
              hasShownToast.current = true
            }
            setTimeout(() => router.push('/my-bookings'), 1500)
            return
          }
          setBookingData(result.data)
        } else {
          if ((result.statusCode === 401 || result.statusCode === 403) && 
              (result.message?.includes('không có quyền truy cập') || 
               result.message?.includes('Không phải chủ sở hữu'))) {
            setAccessDenied(true)
            setError(result.message || 'Bạn không có quyền truy cập vào đặt phòng này')
            
            if (!hasShownToast.current) {
              showToast(result.message || 'Bạn không có quyền truy cập vào đặt phòng này', 'error')
              hasShownToast.current = true
            }
            return
          } else {
            setError(result.message || 'Không thể tải thông tin đặt phòng')
            showToast(result.message || 'Không thể tải thông tin đặt phòng', 'error')
          }
        }
      } catch (error) {
        console.error('Error fetching booking data:', error)
        setError('Có lỗi xảy ra khi tải thông tin đặt phòng')
        showToast('Có lỗi xảy ra khi tải thông tin đặt phòng', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingData()
  }, [isAuthenticated, bookingCode])// Chỉ phụ thuộc vào isAuthenticated và bookingCode

  // Countdown timer
  useEffect(() => {
    if (selectedMethod === 'bank_transfer' && !isExpired && bookingData) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsExpired(true)
            clearInterval(timer)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
            }
            showToast('Đã hết thời gian thanh toán', 'warning')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [selectedMethod, isExpired, bookingData])

  const checkPaymentStatus = useCallback(async () => {
    if (!bookingData || isExpired || accessDenied || !isAuthenticated) return

    try {
      setCheckingStatus(true)
      const result = await bookingService.getBookingPaymentStatus(bookingData.bookingCode)
      
      if (result.statusCode === 401 || result.statusCode === 403) {
        if (result.message?.includes('chưa đăng nhập') || result.message?.includes('không được xác thực')) {
          setAccessDenied(true)
          setIsAuthenticated(false)
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại')
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          
          if (!hasShownToast.current) {
            showToast('Phiên đăng nhập đã hết hạn', 'error')
            hasShownToast.current = true
          }
          
          setTimeout(() => router.push('/auth/login'), 2000)
          return
        }
        
        if (result.message?.includes('không có quyền truy cập') || 
            result.message?.includes('Không phải chủ sở hữu')) {
          setAccessDenied(true)
          setError(result.message || 'Bạn không có quyền truy cập vào đặt phòng này')
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          
          if (!hasShownToast.current) {
            showToast(result.message || 'Bạn không có quyền truy cập vào đặt phòng này', 'error')
            hasShownToast.current = true
          }
          return
        }
      }
      
      if (result.success && result.data && result.data.paymentStatus === 'paid') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        
        showToast('Thanh toán thành công!', 'success')
        router.push('/my-bookings')
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }, [bookingData, isExpired, accessDenied, isAuthenticated])

  // Polling payment status
  useEffect(() => {
    if (selectedMethod === 'bank_transfer' && bookingData && !isExpired && !accessDenied && isAuthenticated) {
      intervalRef.current = setInterval(() => {
        checkPaymentStatus()
      }, 10000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [selectedMethod, bookingData, isExpired, accessDenied, isAuthenticated, checkPaymentStatus])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Thẻ tín dụng/Ghi nợ',
      icon: CreditCard,
      description: 'Visa, Mastercard, JCB',
      available: false
    },
    {
      id: 'bank_transfer',
      name: 'Chuyển khoản ngân hàng',
      icon: Building2,
      description: 'Quét mã QR hoặc chuyển khoản',
      available: true
    },
    {
      id: 'e_wallet',
      name: 'Ví điện tử',
      icon: Wallet,
      description: 'MoMo, ZaloPay, VNPay',
      available: false
    },
    {
      id: 'qr_code',
      name: 'Quét mã QR',
      icon: QrCode,
      description: 'Quét mã thanh toán',
      available: false
    }
  ]

  const handleCopyContent = () => {
    if (bookingData) {
      navigator.clipboard.writeText(bookingData.bookingCode)
      setCopied(true)
      showToast('Đã sao chép mã đặt phòng', 'success')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGoToMyBookings = () => {
    router.push('/my-bookings')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = end.getTime() - start.getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-pink-600 text-lg font-medium">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-3xl border border-pink-200 shadow-xl max-w-md mx-4">
          <div className="text-8xl mb-4">
            {error?.includes('đăng nhập') ? '🔐' : '🔮'}
          </div>
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {error?.includes('đăng nhập') ? 'Yêu Cầu Đăng Nhập' : 'Vùng Cấm Địa'}
          </h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="space-y-4">
            {error?.includes('đăng nhập') ? (
              <>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full hover:from-pink-700 hover:to-purple-700 transition-all font-semibold"
                >
                  Đăng Nhập Ngay
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-8 py-4 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all font-semibold"
                >
                  Về Trang Chủ
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleGoToMyBookings}
                  className="w-full px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full hover:from-pink-700 hover:to-purple-700 transition-all font-semibold"
                >
                  Xem Đặt Phòng Của Tôi
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-8 py-4 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all font-semibold"
                >
                  Về Trang Chủ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-3xl border border-pink-200 shadow-xl max-w-md mx-4">
          <div className="text-8xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Có Lỗi Xảy Ra
          </h2>
          <p className="text-gray-600 mb-8">{error || 'Không tìm thấy thông tin đặt phòng'}</p>
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="w-full px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full hover:from-pink-700 hover:to-purple-700 transition-all font-semibold"
            >
              Quay Lại
            </button>
            <button
              onClick={handleGoToMyBookings}
              className="w-full px-8 py-4 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all font-semibold"
            >
              Xem Đặt Phòng Của Tôi
            </button>
          </div>
        </div>
      </div>
    )
  }

  const nights = calculateNights(bookingData.checkIn, bookingData.checkOut)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Thanh toán
          </h1>
          <p className="text-gray-600">Mã đặt phòng: <span className="font-semibold">{bookingData.bookingCode}</span></p>
        </div>

        {selectedMethod === 'bank_transfer' && (
          <div className={`mb-6 p-4 rounded-2xl border-2 flex items-center justify-between ${
            isExpired ? 'bg-red-50 border-red-300' : timeLeft <= 120 ? 'bg-orange-50 border-orange-300' : 'bg-blue-50 border-blue-300'
          }`}>
            <div className="flex items-center gap-3">
              <Clock className={`w-6 h-6 ${isExpired ? 'text-red-600' : timeLeft <= 120 ? 'text-orange-600' : 'text-blue-600'}`} />
              <div>
                <p className={`font-semibold ${isExpired ? 'text-red-900' : timeLeft <= 120 ? 'text-orange-900' : 'text-blue-900'}`}>
                  {isExpired ? 'Hết thời gian thanh toán' : 'Thời gian còn lại'}
                </p>
              </div>
            </div>
            <div className={`text-3xl font-bold ${isExpired ? 'text-red-600' : timeLeft <= 120 ? 'text-orange-600' : 'text-blue-600'}`}>
              {isExpired ? '00:00' : formatTime(timeLeft)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Thanh toán an toàn</p>
                <p className="text-sm text-blue-700">Thông tin thanh toán của bạn được mã hóa và bảo mật</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Chọn phương thức thanh toán</h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
                        if (method.available && !isExpired) {
                          setSelectedMethod(method.id)
                          if (method.id === 'bank_transfer') {
                            showToast('Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới', 'info')
                          }
                        } else if (!method.available) {
                          showToast('Phương thức thanh toán này sẽ sớm được hỗ trợ', 'info')
                        }
                      }}
                      disabled={!method.available || isExpired}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedMethod === method.id
                          ? 'border-pink-500 bg-pink-50'
                          : method.available && !isExpired
                          ? 'border-gray-200 hover:border-pink-300'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedMethod === method.id ? 'bg-pink-500' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${selectedMethod === method.id ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${selectedMethod === method.id ? 'text-pink-900' : 'text-gray-900'}`}>
                            {method.name}
                          </p>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedMethod === 'bank_transfer' && bookingData.qrCodeUrl && !isExpired && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quét mã QR để thanh toán</h2>
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <img src={bookingData.qrCodeUrl} alt="QR Code" className="w-64 h-64 rounded-xl border-2 border-pink-200" />
                    <p className="text-sm text-gray-600 mt-4 text-center">Quét mã QR bằng ứng dụng ngân hàng</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Hoặc chuyển khoản thủ công:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Số tiền:</span>
                        <span className="font-medium text-pink-600">{formatCurrency(bookingData.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Nội dung CK:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-pink-600">{bookingData.bookingCode}</span>
                          <button onClick={handleCopyContent} className="p-1.5 hover:bg-gray-200 rounded-lg">
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={checkPaymentStatus}
                    disabled={checkingStatus}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {checkingStatus ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Kiểm tra trạng thái thanh toán
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center">Hệ thống tự động kiểm tra mỗi 10 giây</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-200 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt đặt phòng</h2>
              <div className="space-y-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Khách sạn</p>
                  <p className="font-semibold text-gray-900">{bookingData.propertyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Loại phòng</p>
                  <p className="font-medium text-gray-900">{bookingData.roomTypeName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Nhận phòng</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(bookingData.checkIn)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Trả phòng</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(bookingData.checkOut)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{nights} đêm</p>
                </div>
              </div>
              <div className="py-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Tổng thanh toán</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(bookingData.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
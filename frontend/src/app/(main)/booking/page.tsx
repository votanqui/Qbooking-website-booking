
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Users, Bed, AlertCircle, CheckCircle, Loader2, MapPin, Star } from 'lucide-react'
import { bookingService } from '@/services/main/booking.service'
import { propertyService } from '@/services/main/property.service'
import { useToast } from '@/components/ui/Toast'
import { PriceQuoteResult } from '@/types/main/booking'
import { PropertyForBooking, RoomTypeForBooking } from '@/types/main/property'

export default function BookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [property, setProperty] = useState<PropertyForBooking | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<RoomTypeForBooking | null>(null)
  const [priceQuote, setPriceQuote] = useState<PriceQuoteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const propertyId = parseInt(searchParams.get('propertyId') || '0')
  const roomTypeId = parseInt(searchParams.get('roomTypeId') || '0')
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const roomsCount = parseInt(searchParams.get('roomsCount') || '1')
  const adults = parseInt(searchParams.get('adults') || '1')
  const children = parseInt(searchParams.get('children') || '0')

  const utmSource = searchParams.get('utm_source') || ''
  const utmCampaign = searchParams.get('utm_campaign') || ''
  const utmMedium = searchParams.get('utm_medium') || ''

  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestIdNumber: '',
    specialRequests: '',
    bookingSource: 'website'
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!propertyId || !roomTypeId || !checkIn || !checkOut) {
      setError('Thiếu thông tin đặt phòng. Vui lòng quay lại và chọn lại.')
      setLoading(false)
      return
    }

    fetchData()
  }, [propertyId, roomTypeId, checkIn, checkOut, roomsCount])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [propertyRes, quoteRes] = await Promise.all([
        propertyService.getPropertyByIdForBooking(propertyId),
        bookingService.getPriceQuote({
          propertyId,
          roomTypeId,
          checkIn,
          checkOut,
          roomsCount
        })
      ])

      if (propertyRes.success && propertyRes.data) {
        setProperty(propertyRes.data)
        
        // Tìm phòng đã chọn trong danh sách roomTypes
        const room = propertyRes.data.roomTypes.find(rt => rt.id === roomTypeId)
        if (room) {
          setSelectedRoom(room)
        } else {
          setError('Không tìm thấy loại phòng đã chọn')
        }
      } else {
        setError('Không thể tải thông tin khách sạn')
      }

      if (quoteRes.success && quoteRes.data) {
        setPriceQuote(quoteRes.data)
      } else {
        setError(quoteRes.message || 'Không thể tải báo giá')
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError('Lỗi khi tải thông tin. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.guestName.trim()) {
      newErrors.guestName = 'Vui lòng nhập họ tên'
    } else if (formData.guestName.trim().length < 3) {
      newErrors.guestName = 'Họ tên phải có ít nhất 3 ký tự'
    }

    if (!formData.guestPhone.trim()) {
      newErrors.guestPhone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{10,11}$/.test(formData.guestPhone.replace(/\s/g, ''))) {
      newErrors.guestPhone = 'Số điện thoại không hợp lệ (10-11 số)'
    }

    if (!formData.guestEmail.trim()) {
      newErrors.guestEmail = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestEmail)) {
      newErrors.guestEmail = 'Email không hợp lệ'
    }

    if (formData.guestIdNumber && !/^[0-9]{9,12}$/.test(formData.guestIdNumber.replace(/\s/g, ''))) {
      newErrors.guestIdNumber = 'Số CMND/CCCD không hợp lệ'
    }

    setValidationErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Vui lòng kiểm tra lại thông tin', 'warning')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const bookingData = {
        propertyId,
        roomTypeId,
        checkIn,
        checkOut,
        adults,
        children,
        roomsCount,
        guestName: formData.guestName.trim(),
        guestPhone: formData.guestPhone.trim(),
        guestEmail: formData.guestEmail.trim(),
        guestIdNumber: formData.guestIdNumber.trim() || undefined,
        specialRequests: formData.specialRequests.trim() || undefined,
        bookingSource: formData.bookingSource,
        utmSource: utmSource || 'direct',
        utmCampaign: utmCampaign || 'organic',
        utmMedium: utmMedium || 'website'
      }

      const response = await bookingService.createBookingFull(bookingData)

      if (response.success && response.data) {
        showToast(`Đặt phòng thành công! Mã đặt phòng: ${response.data.bookingCode}`, 'success')
        router.push(`/booking/${response.data.bookingCode}/apply-coupon`)
      } else {
        const errorMsg = response.message || 'Không thể tạo đặt phòng'
        setError(errorMsg)
        showToast(errorMsg, 'error')
      }
    } catch (err: any) {
      console.error('Error creating booking:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Đã xảy ra lỗi'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/placeholder-hotel.jpg'
    if (imageUrl.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}${imageUrl}`
    }
    return imageUrl
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-purple-600 font-medium">Đang tải thông tin đặt phòng...</p>
        </div>
      </div>
    )
  }

  if (error && !priceQuote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Xác nhận đặt phòng
          </h1>
          <p className="text-gray-600">Vui lòng kiểm tra thông tin và hoàn tất đặt phòng</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin khách sạn */}
            {property && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin khách sạn</h2>
                <div className="flex gap-4">
                  <img
                    src={getImageUrl(property.mainImage)}
                    alt={property.name}
                    className="w-32 h-32 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{property.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(property.starRating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">({property.starRating} sao)</span>
                    </div>
                    <div className="flex items-start text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{property.addressDetail}, {property.commune}, {property.province}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Nhận phòng:</span> {property.checkInTime}
                      </div>
                      <div>
                        <span className="font-medium">Trả phòng:</span> {property.checkOutTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin phòng đã chọn */}
            {selectedRoom && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Loại phòng đã chọn</h2>
                <div className="flex gap-4">
                  <img
                    src={getImageUrl(selectedRoom.roomImage)}
                    alt={selectedRoom.name}
                    className="w-32 h-32 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{selectedRoom.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Bed className="w-4 h-4 text-pink-500" />
                        <span className="text-gray-700">{selectedRoom.bedType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-pink-500" />
                        <span className="text-gray-700">
                          Tối đa: {selectedRoom.maxAdults} người lớn, {selectedRoom.maxChildren} trẻ em
                          {selectedRoom.maxGuests > 0 && ` (${selectedRoom.maxGuests} khách)`}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-gray-600">Giá cơ bản: </span>
                        <span className="text-lg font-bold text-pink-600">
                          {bookingService.formatCurrency(selectedRoom.basePrice)}/đêm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chi tiết đặt phòng */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Chi tiết đặt phòng</h2>
              
              {priceQuote && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Nhận phòng</p>
                        <p className="font-medium text-gray-900 text-sm">{formatDate(checkIn)}</p>
                        <p className="text-xs text-gray-500">{property?.checkInTime}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Trả phòng</p>
                        <p className="font-medium text-gray-900 text-sm">{formatDate(checkOut)}</p>
                        <p className="text-xs text-gray-500">{property?.checkOutTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Bed className="w-5 h-5 text-pink-500" />
                        <span className="font-medium text-gray-900">{priceQuote.roomTypeName}</span>
                      </div>
                      <span className="text-gray-600">×{roomsCount} phòng</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-pink-500" />
                        <span className="text-gray-700">{adults} người lớn, {children} trẻ em</span>
                      </div>
                      <span className="text-gray-600">{priceQuote.nights} đêm</span>
                    </div>
                  </div>

                  {priceQuote.dailyBreakdown && priceQuote.dailyBreakdown.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="font-semibold mb-3 text-gray-900">Chi tiết giá theo ngày:</h3>
                      <div className="space-y-2">
                        {priceQuote.dailyBreakdown.map((day: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm p-2 hover:bg-gray-50 rounded-lg">
                            <span className="text-gray-600">
                              {day.dayOfWeek}, {new Date(day.date).toLocaleDateString('vi-VN')}
                              {day.priceType === 'weekend' && (
                                <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                                  Cuối tuần
                                </span>
                              )}
                            </span>
                            <span className="font-medium text-gray-900">{bookingService.formatCurrency(day.pricePerRoom)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form thông tin khách hàng */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin khách hàng</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.guestName}
                    onChange={(e) => handleInputChange('guestName', e.target.value)}
                    className={`w-full px-4 py-2 border ${validationErrors.guestName ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
                    placeholder="Nguyễn Văn A"
                  />
                  {validationErrors.guestName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.guestName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.guestPhone}
                      onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                      className={`w-full px-4 py-2 border ${validationErrors.guestPhone ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
                      placeholder="0912345678"
                    />
                    {validationErrors.guestPhone && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.guestPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                      className={`w-full px-4 py-2 border ${validationErrors.guestEmail ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
                      placeholder="email@example.com"
                    />
                    {validationErrors.guestEmail && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.guestEmail}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số CMND/CCCD (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={formData.guestIdNumber}
                    onChange={(e) => handleInputChange('guestIdNumber', e.target.value)}
                    className={`w-full px-4 py-2 border ${validationErrors.guestIdNumber ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500`}
                    placeholder="001234567890"
                  />
                  {validationErrors.guestIdNumber && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.guestIdNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yêu cầu đặc biệt (Tùy chọn)
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Ví dụ: Tầng cao, giường đôi, không hút thuốc..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar tổng thanh toán */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-200 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tổng thanh toán</h2>
              
              {priceQuote && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tiền phòng ({priceQuote.nights} đêm)</span>
                    <span className="font-medium">{bookingService.formatCurrency(priceQuote.roomPrice)}</span>
                  </div>

                  {priceQuote.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá ({priceQuote.discountPercent}%)</span>
                      <span>-{bookingService.formatCurrency(priceQuote.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Thuế ({priceQuote.taxPercent}%)</span>
                    <span className="font-medium">{bookingService.formatCurrency(priceQuote.taxAmount)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí dịch vụ</span>
                    <span className="font-medium">{bookingService.formatCurrency(priceQuote.serviceFee)}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {bookingService.formatCurrency(priceQuote.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full mt-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Xác nhận đặt phòng
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-4">
                    Bằng cách đặt phòng, bạn đồng ý với điều khoản và chính sách của chúng tôi
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
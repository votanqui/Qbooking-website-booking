import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { DatePickerModal } from '@/components/ui/DatePickerModal'
import { AvailableDatesModal } from '@/components/modals/AvailableDatesModal'
import { useToast } from '@/components/ui/Toast'
import { Users, Bed, Calendar, Shield, CheckCircle, XCircle, Plus, Minus } from 'lucide-react'
import { RoomType } from '@/types/main/property-detail'
import { RoomDetailResponse } from '@/types/main/room'
import { roomService } from '@/services/main/room.service'
import { bookingService } from '@/services/main/booking.service'

interface RoomDetailModalProps {
  isOpen: boolean
  onClose: () => void
  room: RoomType | null
  propertyId?: number
  propertyCheckInTime: string
  propertyCheckOutTime: string
  propertyCancellationPolicy: string
}

export function RoomDetailModal({
  isOpen,
  onClose,
  room,
  propertyId,
  propertyCheckInTime,
  propertyCheckOutTime,
  propertyCancellationPolicy
}: RoomDetailModalProps) {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [roomDetail, setRoomDetail] = useState<RoomDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [roomsCount, setRoomsCount] = useState(1)
  const [showCheckInPicker, setShowCheckInPicker] = useState(false)
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false)
  const [showAvailableDatesModal, setShowAvailableDatesModal] = useState(false)
  const [availableDatesData, setAvailableDatesData] = useState<any>(null)
  const [availableDatesLoading, setAvailableDatesLoading] = useState(false)
  const [availableDatesMonth, setAvailableDatesMonth] = useState(new Date().getMonth() + 1)
  const [availableDatesYear, setAvailableDatesYear] = useState(new Date().getFullYear())
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  useEffect(() => {
    const fetchRoomDetail = async () => {
      if (!room?.slug) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await roomService.getRoomBySlug(room.slug)
        
        if (response.success && response.data) {
          setRoomDetail(response.data)
        } else {
          setError(response.message || 'Không thể tải thông tin chi tiết phòng')
        }
      } catch (err) {
        setError('Lỗi khi tải thông tin phòng')
        console.error('Error fetching room detail:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && room) {
      fetchRoomDetail()
    }
  }, [isOpen, room?.slug])

  useEffect(() => {
    if (!isOpen) {
      setRoomDetail(null)
      setError(null)
      setCheckIn('')
      setCheckOut('')
      setAdults(1)
      setChildren(0)
      setRoomsCount(1)
    }
  }, [isOpen])

  const handleViewAvailableDates = async () => {
    if (!room || !propertyId) return

    setShowAvailableDatesModal(true)
    await fetchAvailableDates(availableDatesYear, availableDatesMonth)
  }

  const fetchAvailableDates = async (year: number, month: number) => {
    if (!room || !propertyId) return

    setAvailableDatesLoading(true)
    try {
      const response = await bookingService.getAvailableDates({
        propertyId,
        roomTypeId: room.id,
        year,
        month,
        roomsCount
      })

      if (response.success && response.data) {
        setAvailableDatesData(response.data)
        setAvailableDatesMonth(month)
        setAvailableDatesYear(year)
      } else {
        showToast(response.message || 'Không thể tải lịch phòng trống', 'error')
      }
    } catch (err) {
      console.error('Error fetching available dates:', err)
      showToast('Lỗi khi tải lịch phòng trống', 'error')
    } finally {
      setAvailableDatesLoading(false)
    }
  }

  const handleCheckAvailabilityAndBook = async () => {
    if (!room || !propertyId) {
      showToast('Thông tin phòng không hợp lệ', 'error')
      return
    }

    if (!checkIn || !checkOut) {
      showToast('Vui lòng chọn ngày nhận và trả phòng', 'warning')
      return
    }

    setCheckingAvailability(true)
    try {
      const totalGuests = adults + children
      const response = await bookingService.checkAvailability({
        propertyId,
        roomTypeId: room.id,
        checkIn,
        checkOut,
        roomsCount,
        totalGuests,
        adults,
        children
      })

      if (response.success && response.data) {
        const availabilityData = response.data
        
        if (availabilityData.available) {
          showToast('Phòng còn trống! Đang chuyển đến trang đặt phòng...', 'success')
          
          onClose()
          
          const bookingParams = new URLSearchParams({
            propertyId: propertyId.toString(),
            roomTypeId: room.id.toString(),
            checkIn,
            checkOut,
            roomsCount: roomsCount.toString(),
            adults: adults.toString(),
            children: children.toString()
          })
          
          router.push(`/booking?${bookingParams.toString()}`)
        } else {
          showToast(
            `Không đủ phòng trống. Chỉ còn ${availabilityData.availableRooms} phòng trong khoảng thời gian này.`,
            'error'
          )
        }
      } else {
        showToast(response.message || 'Không thể kiểm tra tình trạng phòng', 'error')
      }
    } catch (err: any) {
      console.error('Error checking availability:', err)
      showToast(err.response?.data?.message || 'Lỗi khi kiểm tra tình trạng phòng', 'error')
    } finally {
      setCheckingAvailability(false)
    }
  }

  if (!isOpen || !room) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}${imageUrl}`
    }
    return imageUrl
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const handleGuestChange = (type: 'adults' | 'children', increment: boolean) => {
    const maxAdults = roomDetail?.maxAdults || room.maxAdults
    const maxChildren = roomDetail?.maxChildren || room.maxChildren

    if (type === 'adults') {
      if (increment && adults < maxAdults) {
        setAdults(prev => prev + 1)
      } else if (!increment && adults > 1) {
        setAdults(prev => prev - 1)
      }
    } else {
      if (increment && children < maxChildren) {
        setChildren(prev => prev + 1)
      } else if (!increment && children > 0) {
        setChildren(prev => prev - 1)
      }
    }
  }

  const handleRoomsCountChange = (increment: boolean) => {
    const maxRooms = roomDetail?.totalRooms || room.totalRooms
    
    if (increment && roomsCount < maxRooms) {
      setRoomsCount(prev => prev + 1)
    } else if (!increment && roomsCount > 1) {
      setRoomsCount(prev => prev - 1)
    }
  }

  const totalGuests = adults + children
  const currentRoom = roomDetail || room

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-3xl z-10">
            <div className="flex justify-between items-center p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {currentRoom.name}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-pink-50 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loading />
                  <p className="mt-4 text-purple-600 font-medium">Đang tải thông tin phòng...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  Thử lại
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roomDetail?.images && roomDetail.images.length > 0 ? roomDetail.images.map((image, index) => (
                      <div key={`detail-${index}`} className="relative h-48 md:h-64 rounded-2xl overflow-hidden shadow-lg">
                        <img
                          src={getImageUrl(image.imageUrl)}
                          alt={`${currentRoom.name} - ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        {image.isPrimary && (
                          <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                            Ảnh chính
                          </div>
                        )}
                      </div>
                    )) : room.images && room.images.length > 0 ? room.images.map((image, index) => (
                      <div key={`room-${index}`} className="relative h-48 md:h-64 rounded-2xl overflow-hidden shadow-lg">
                        <img
                          src={getImageUrl(image.imageUrl)}
                          alt={`${currentRoom.name} - ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    )) : (
                      <div className="col-span-2 relative h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        <span className="text-gray-500 text-lg">Không có hình ảnh</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Thông tin phòng</h3>
                    
                    {roomDetail?.description && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Mô tả</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{roomDetail.description}</p>
                        {roomDetail.shortDescription && roomDetail.shortDescription !== roomDetail.description && (
                          <p className="text-gray-600 text-xs mt-2">{roomDetail.shortDescription}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-pink-100">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-pink-500 mr-3" />
                          <span className="text-gray-700 text-sm md:text-base">Số khách tối đa</span>
                        </div>
                        <span className="font-medium text-purple-600">{currentRoom.maxGuests || (currentRoom.maxAdults + currentRoom.maxChildren)} khách</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-pink-100">
                        <div className="flex items-center">
                          <span className="text-pink-500 mr-3 text-lg">👥</span>
                          <span className="text-gray-700 text-sm md:text-base">Người lớn</span>
                        </div>
                        <span className="font-medium text-purple-600">{currentRoom.maxAdults} người</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-pink-100">
                        <div className="flex items-center">
                          <span className="text-pink-500 mr-3 text-lg">🧒</span>
                          <span className="text-gray-700 text-sm md:text-base">Trẻ em</span>
                        </div>
                        <span className="font-medium text-purple-600">{currentRoom.maxChildren} trẻ</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-pink-100">
                        <div className="flex items-center">
                          <Bed className="w-5 h-5 text-pink-500 mr-3" />
                          <span className="text-gray-700 text-sm md:text-base">Loại giường</span>
                        </div>
                        <span className="font-medium text-purple-600">{currentRoom.bedType}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-pink-100">
                        <div className="flex items-center">
                          <span className="text-pink-500 mr-3 text-lg">📐</span>
                          <span className="text-gray-700 text-sm md:text-base">Diện tích</span>
                        </div>
                        <span className="font-medium text-purple-600">{currentRoom.roomSize}m²</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-pink-100">
                        <div className="flex items-center">
                          <span className="text-pink-500 mr-3 text-lg">🏠</span>
                          <span className="text-gray-700 text-sm md:text-base">Số phòng có sẵn</span>
                        </div>
                        <span className="font-medium text-purple-600">{currentRoom.totalRooms} phòng</span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Tiện nghi trong phòng</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roomDetail?.amenities && roomDetail.amenities.length > 0 ? (
                          roomDetail.amenities.map((amenity) => (
                            <div key={amenity.id} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-pink-500 mr-2 flex-shrink-0" />
                              <span>{amenity.name}</span>
                              {amenity.quantity && amenity.quantity > 1 && (
                                <span className="ml-1 text-purple-600 font-medium">({amenity.quantity})</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-pink-500 mr-2 flex-shrink-0" />
                              <span>Điều hòa không khí</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-pink-500 mr-2 flex-shrink-0" />
                              <span>Wifi miễn phí</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-pink-500 mr-2 flex-shrink-0" />
                              <span>Tivi màn hình phẳng</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-pink-500 mr-2 flex-shrink-0" />
                              <span>Phòng tắm riêng</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-4 md:p-6 border border-pink-200">
                      <div className="text-center mb-6">
                        <div className="space-y-2">
                          <div>
                            <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                              {formatPrice(currentRoom.basePrice)}
                            </span>
                            <span className="text-gray-600 ml-2">/ đêm (thường)</span>
                          </div>
                          
                          {roomDetail && (
                            <>
                              {roomDetail.weekendPrice !== roomDetail.basePrice && (
                                <p className="text-lg font-semibold text-purple-600">
                                  {formatPrice(roomDetail.weekendPrice)} / cuối tuần
                                </p>
                              )}
                              {roomDetail.holidayPrice !== roomDetail.basePrice && (
                                <p className="text-lg font-semibold text-pink-600">
                                  {formatPrice(roomDetail.holidayPrice)} / ngày lễ
                                </p>
                              )}
                              
                              {(roomDetail.weeklyDiscountPercent > 0 || roomDetail.monthlyDiscountPercent > 0) && (
                                <div className="text-sm text-green-600 space-y-1">
                                  {roomDetail.weeklyDiscountPercent > 0 && (
                                    <p>Giảm {roomDetail.weeklyDiscountPercent}% cho thuê tuần</p>
                                  )}
                                  {roomDetail.monthlyDiscountPercent > 0 && (
                                    <p>Giảm {roomDetail.monthlyDiscountPercent}% cho thuê tháng</p>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nhận phòng
                            </label>
                            <button
                              onClick={() => setShowCheckInPicker(true)}
                              className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-left bg-white hover:border-pink-300 transition-colors text-sm"
                            >
                              {checkIn ? formatDate(checkIn) : 'Chọn ngày'}
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Trả phòng
                            </label>
                            <button
                              onClick={() => setShowCheckOutPicker(true)}
                              className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-left bg-white hover:border-pink-300 transition-colors text-sm"
                            >
                              {checkOut ? formatDate(checkOut) : 'Chọn ngày'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Số phòng
                          </label>
                          <div className="bg-white rounded-lg p-3 border border-pink-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bed className="w-4 h-4 text-pink-600" />
                                <span className="text-sm font-medium text-pink-700">Số lượng phòng</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleRoomsCountChange(false)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={roomsCount <= 1}
                                >
                                  <Minus className="w-4 h-4 text-pink-600" />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold text-pink-700">
                                  {roomsCount}
                                </span>
                                <button
                                  onClick={() => handleRoomsCountChange(true)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={roomsCount >= currentRoom.totalRooms}
                                >
                                  <Plus className="w-4 h-4 text-pink-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Số khách
                          </label>
                          <div className="bg-white rounded-lg p-3 border border-pink-200">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-pink-600" />
                                  <span className="text-sm font-medium text-pink-700">Người lớn</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleGuestChange('adults', false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={adults <= 1}
                                  >
                                    <Minus className="w-4 h-4 text-pink-600" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-semibold text-pink-700">
                                    {adults}
                                  </span>
                                  <button
                                    onClick={() => handleGuestChange('adults', true)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={adults >= currentRoom.maxAdults}
                                  >
                                    <Plus className="w-4 h-4 text-pink-600" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-pink-600 mr-1 text-lg">🧒</span>
                                  <span className="text-sm font-medium text-pink-700">Trẻ em</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleGuestChange('children', false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={children <= 0}
                                  >
                                    <Minus className="w-4 h-4 text-pink-600" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-semibold text-pink-700">
                                    {children}
                                  </span>
                                  <button
                                    onClick={() => handleGuestChange('children', true)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full border border-pink-300 hover:bg-pink-50/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={children >= currentRoom.maxChildren}
                                  >
                                    <Plus className="w-4 h-4 text-pink-600" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="text-center text-xs text-pink-600 bg-pink-100/50 py-2 rounded-lg">
                                Tổng cộng: {totalGuests} khách
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <Button 
                          onClick={handleCheckAvailabilityAndBook}
                          disabled={checkingAvailability || !checkIn || !checkOut}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                          size="lg"
                        >
                          {checkingAvailability ? (
                            <>
                              <Loading />
                              <span className="ml-2">Đang kiểm tra...</span>
                            </>
                          ) : (
                            'Đặt phòng ngay'
                          )}
                        </Button>

                        <Button
                          onClick={handleViewAvailableDates}
                          disabled={!propertyId}
                          variant="outline"
                          className="w-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          size="lg"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Xem ngày trống
                        </Button>
                      </div>

                      <div className="text-center">
                        <p className="text-xs md:text-sm text-gray-600">
                          Miễn phí hủy phòng trong 24h
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Chính sách phòng</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-pink-500 flex-shrink-0" />
                          <span>Check-in: {propertyCheckInTime}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-pink-500 flex-shrink-0" />
                          <span>Check-out: {propertyCheckOutTime}</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-pink-500 flex-shrink-0" />
                          <span>Hủy {propertyCancellationPolicy === 'flexible' ? 'linh hoạt' : propertyCancellationPolicy}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AvailableDatesModal
        isOpen={showAvailableDatesModal}
        onClose={() => setShowAvailableDatesModal(false)}
        calendar={availableDatesData?.calendar || null}
        summary={availableDatesData?.summary || null}
        roomTypeName={availableDatesData?.roomTypeName || room?.name || ''}
        year={availableDatesYear}
        month={availableDatesMonth}
        monthName={availableDatesData?.monthName || ''}
        roomsCount={roomsCount}
        totalRooms={availableDatesData?.totalRooms || room?.totalRooms || 0}
        loading={availableDatesLoading}
        onMonthChange={fetchAvailableDates}
      />

      <DatePickerModal
        isOpen={showCheckInPicker}
        onClose={() => setShowCheckInPicker(false)}
        selectedDate={checkIn}
        onDateSelect={setCheckIn}
        minDate={new Date().toISOString().split('T')[0]}
        title="Chọn ngày nhận phòng"
        type="checkin"
      />

      <DatePickerModal
        isOpen={showCheckOutPicker}
        onClose={() => setShowCheckOutPicker(false)}
        selectedDate={checkOut}
        onDateSelect={setCheckOut}
        minDate={checkIn || new Date().toISOString().split('T')[0]}
        title="Chọn ngày trả phòng"
        type="checkout"
      />
    </>
  )
}
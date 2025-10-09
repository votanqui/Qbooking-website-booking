'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { DatePickerModal } from '@/components/ui/DatePickerModal'
import { RoomDetailModal } from '@/components/modals/RoomDetailModal'
import { AvailableDatesModal } from '@/components/modals/AvailableDatesModal'
import { useToast } from '@/components/ui/Toast'
import { Star, MapPin, Users, Bed, Calendar, Wifi, Car, Coffee, Shield, Heart, Share2, CheckCircle, Plus, Minus, X, Phone, Mail, User, Facebook, Twitter, Link } from 'lucide-react'
import { propertyService } from '@/services/main/property.service'
import { favoriteService } from '@/services/main/favorite.service'
import { propertyViewService } from '@/services/main/property-view.service'
import { bookingService } from '@/services/main/booking.service'
import { PropertyDetail, RoomType } from '@/types/main/property-detail'
import { reviewService } from '@/services/main/review.service'
import { ReviewListResponse } from '@/types/main/review'
import { PropertyApiResponse } from '@/types/main/property'


const PropertyDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { showToast } = useToast()
  
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [roomsCount, setRoomsCount] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [modalRoomType, setModalRoomType] = useState<RoomType | null>(null)
  const [showCheckInPicker, setShowCheckInPicker] = useState(false)
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showAvailableDatesModal, setShowAvailableDatesModal] = useState(false)
  const [availableDatesData, setAvailableDatesData] = useState<any>(null)
  const [availableDatesLoading, setAvailableDatesLoading] = useState(false)
  const [availableDatesMonth, setAvailableDatesMonth] = useState(new Date().getMonth() + 1)
  const [availableDatesYear, setAvailableDatesYear] = useState(new Date().getFullYear())
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [reviews, setReviews] = useState<ReviewListResponse | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsPageSize] = useState(5)
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null)
    
  const [similarProperties, setSimilarProperties] = useState<PropertyApiResponse[]>([])
  const [similarPropertiesLoading, setSimilarPropertiesLoading] = useState(false)
  const hasRecordedView = useRef(false)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true)
        const response = await propertyService.getPropertyBySlug(slug)
        
        if (response.success && response.data) {
          setProperty(response.data)
          if (response.data.roomTypes.length > 0) {
            setSelectedRoomType(response.data.roomTypes[0])
          }
          
          checkFavoriteStatus(response.data.id)
          
          if (!hasRecordedView.current) {
            recordPropertyView(response.data.id)
            hasRecordedView.current = true
          }
        } else {
          setError(response.message || 'Không tìm thấy thông tin property')
        }
      } catch (err) {
        setError('Lỗi khi tải thông tin property')
        console.error('Error fetching property:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProperty()
    }
  }, [slug])
  useEffect(() => {
  const fetchSimilarProperties = async () => {
    if (!property?.id) return

    setSimilarPropertiesLoading(true)
    try {
      const response = await propertyService.getSimilarProperties(property.id, 10)
      
      if (response.success && response.data) {
        setSimilarProperties(response.data.properties)
      }
    } catch (err) {
      console.error('Error fetching similar properties:', err)
    } finally {
      setSimilarPropertiesLoading(false)
    }
  }

  if (property?.id) {
    fetchSimilarProperties()
  }
}, [property?.id])
  useEffect(() => {
    if (property && !mapLoaded) {
      initializeMap()
      setMapLoaded(true)
    }
  }, [property, mapLoaded])
useEffect(() => {
  const fetchReviews = async () => {
    if (!property) return

    setReviewsLoading(true)
    try {
      const response = await reviewService.getPropertyReviews(property.id, {
        page: reviewsPage,
        pageSize: reviewsPageSize,
        minRating: selectedRatingFilter || undefined,
        sortBy: 'CreatedAt',
        sortOrder: 'desc'
      })

      if (response.success && response.data) {
        setReviews(response.data)
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setReviewsLoading(false)
    }
  }

  if (property?.id) {
    fetchReviews()
  }
}, [property?.id, reviewsPage, reviewsPageSize, selectedRatingFilter])
  const initializeMap = () => {
    if (!property || !mapRef.current) return

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
    script.async = true
    script.onload = () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
      document.head.appendChild(link)

      setTimeout(() => {
        if (window.L && mapRef.current) {
          const map = window.L.map(mapRef.current).setView([property.latitude, property.longitude], 15)
          
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map)

          const marker = window.L.marker([property.latitude, property.longitude]).addTo(map)
          marker.bindPopup(`<b>${property.name}</b><br>${property.addressDetail}`)
        }
      }, 100)
    }
    document.body.appendChild(script)
  }

  const recordPropertyView = async (propertyId: number) => {
    try {
      await propertyViewService.recordView(propertyId)
      console.log('Property view recorded successfully')
    } catch (err) {
      console.error('Error recording property view:', err)
    }
  }

  const checkFavoriteStatus = async (propertyId: number) => {
    try {
      const isFav = await favoriteService.isFavorite(propertyId)
      setIsFavorite(isFav)
    } catch (err) {
      console.error('Error checking favorite status:', err)
    }
  }

  const handleToggleFavorite = async () => {
    if (!property) return

    setIsFavoriteLoading(true)
    
    try {
      if (isFavorite) {
        const response = await favoriteService.removeFromFavorites(property.id)
        
        if (response.success) {
          setIsFavorite(false)
          showToast('Đã xóa khỏi danh sách yêu thích', 'success')
        } else {
          showToast(response.message || 'Không thể xóa khỏi danh sách yêu thích', 'error')
        }
      } else {
        const response = await favoriteService.addToFavorites({
          propertyId: property.id
        })
        
        if (response.success) {
          setIsFavorite(true)
          showToast('Đã thêm vào danh sách yêu thích', 'success')
        } else {
          if (response.statusCode === 401) {
            showToast('Vui lòng đăng nhập để thêm vào yêu thích', 'warning')
          } else if (response.statusCode === 400) {
            showToast('Bất động sản đã có trong danh sách yêu thích', 'info')
          } else {
            showToast(response.message || 'Không thể thêm vào danh sách yêu thích', 'error')
          }
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      showToast('Đã xảy ra lỗi, vui lòng thử lại', 'error')
    } finally {
      setIsFavoriteLoading(false)
    }
  }
  const SimilarPropertiesSection = () => {
  if (similarPropertiesLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm mt-5 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-pink-100">
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Khách sạn tương tự
        </h2>
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      </div>
    )
  }

  if (!similarProperties || similarProperties.length === 0) {
    return null
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl mt-5 md:rounded-3xl p-4 md:p-6 shadow-sm border border-pink-100">
      <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-6">
        Khách sạn tương tự
      </h2>
      
      {/* Desktop: Horizontal scroll */}
      <div className="hidden md:block overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-4" style={{ width: 'max-content' }}>
          {similarProperties.map((item) => (
            <div
              key={item.id}
              className="w-80 flex-shrink-0 bg-white rounded-xl border border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
              onClick={() => router.push(`/properties/${item.slug}`)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.images[0] ? getImageUrl(item.images[0]) : '/placeholder-hotel.jpg'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                
                {item.isFeatured && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    ⭐ Nổi bật
                  </div>
                )}
                
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-purple-600">
                  {item.type}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-pink-600 transition-colors">
                  {item.name}
                </h3>
                
                <div className="flex items-start text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mr-1 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{item.addressDetail}, {item.province}</span>
                </div>
                
                {item.averageRating && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(item.averageRating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({item.totalReviews} đánh giá)
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {formatPrice(item.priceFrom)}
                    </p>
                    <p className="text-xs text-gray-500">/ đêm</p>
                  </div>
                  
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/properties/${item.slug}`)
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Horizontal scroll with snap */}
      <div className="md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        <div className="flex gap-4 pb-4">
          {similarProperties.map((item) => (
            <div
              key={item.id}
              className="w-72 flex-shrink-0 snap-center bg-white rounded-xl border border-pink-100 hover:border-pink-300 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => router.push(`/properties/${item.slug}`)}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={item.images[0] ? getImageUrl(item.images[0]) : '/placeholder-hotel.jpg'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                
                {item.isFeatured && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    ⭐ Nổi bật
                  </div>
                )}
                
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-purple-600">
                  {item.type}
                </div>
              </div>
              
              <div className="p-3">
                <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-1">
                  {item.name}
                </h3>
                
                <div className="flex items-start text-xs text-gray-600 mb-2">
                  <MapPin className="w-3 h-3 mr-1 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{item.addressDetail}</span>
                </div>
                
                {item.averageRating && (
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.round(item.averageRating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">
                      ({item.totalReviews})
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {formatPrice(item.priceFrom)}
                    </p>
                    <p className="text-xs text-gray-500">/ đêm</p>
                  </div>
                  
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-3 py-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/properties/${item.slug}`)
                    }}
                  >
                    Xem
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicator for mobile */}
      <div className="md:hidden text-center mt-2">
        <p className="text-xs text-gray-500">← Vuốt để xem thêm →</p>
      </div>
    </div>
  )
}
  const handleViewAvailableDates = async () => {
    if (!property || !selectedRoomType) return

    setShowAvailableDatesModal(true)
    await fetchAvailableDates(availableDatesYear, availableDatesMonth)
  }

  const fetchAvailableDates = async (year: number, month: number) => {
    if (!property || !selectedRoomType) return

    setAvailableDatesLoading(true)
    try {
      const response = await bookingService.getAvailableDates({
        propertyId: property.id,
        roomTypeId: selectedRoomType.id,
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
  if (!property || !selectedRoomType) {
    showToast('Vui lòng chọn loại phòng', 'warning')
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
      propertyId: property.id,
      roomTypeId: selectedRoomType.id,
      checkIn,
      checkOut,
      roomsCount,
      totalGuests,
      adults,
      children
    })

    if (response.success && response.data) {
      if (response.data.available) {
        const bookingParams = new URLSearchParams({
          propertyId: property.id.toString(),
          roomTypeId: selectedRoomType.id.toString(),
          checkIn,
          checkOut,
          roomsCount: roomsCount.toString(),
          adults: adults.toString(),
          children: children.toString()
        })
        
        router.push(`/booking?${bookingParams.toString()}`)
      } else {
        showToast(
          `Không đủ phòng trống. Chỉ còn ${response.data.availableRooms} phòng.`,
          'error'
        )
      }
    }
  } catch (err: any) {
    showToast('Lỗi khi kiểm tra tình trạng phòng', 'error')
  } finally {
    setCheckingAvailability(false)
  }
}
  const handleCallHost = () => {
    if (property?.host?.phone) {
      window.location.href = `tel:${property.host.phone}`
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const shareOnFacebook = () => {
    const url = window.location.href
    const text = `Check out ${property?.name} - ${property?.description?.substring(0, 100)}...`
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const shareOnTwitter = () => {
    const url = window.location.href
    const text = `Check out ${property?.name}`
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Đã sao chép link vào clipboard', 'success')
      setShowShareModal(false)
    } catch (err) {
      showToast('Không thể sao chép link', 'error')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getAmenityIcon = (name: string) => {
    const icons: { [key: string]: any } = {
      'Điều hòa không khí': <Coffee className="w-5 h-5 text-pink-500" />,
      'Wifi miễn phí': <Wifi className="w-5 h-5 text-pink-500" />,
      'Wifi': <Wifi className="w-5 h-5 text-pink-500" />,
      'Đưa đón sân bay': <Car className="w-5 h-5 text-pink-500" />,
      'Hồ bơi': <Shield className="w-5 h-5 text-pink-500" />,
      'Gym & Spa': <CheckCircle className="w-5 h-5 text-pink-500" />,
      'Nhà hàng': <Coffee className="w-5 h-5 text-pink-500" />,
      'Tủ lạnh': <CheckCircle className="w-5 h-5 text-pink-500" />,
      'default': <CheckCircle className="w-5 h-5 text-pink-500" />
    }
    return icons[name] || icons['default']
  }

  const openRoomModal = (room: RoomType) => {
    setModalRoomType(room)
    setShowRoomModal(true)
  }

  const closeRoomModal = () => {
    setShowRoomModal(false)
    setModalRoomType(null)
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
    if (type === 'adults') {
      if (increment && adults < (selectedRoomType?.maxAdults || 10)) {
        setAdults(prev => prev + 1)
      } else if (!increment && adults > 1) {
        setAdults(prev => prev - 1)
      }
    } else {
      if (increment && children < (selectedRoomType?.maxChildren || 8)) {
        setChildren(prev => prev + 1)
      } else if (!increment && children > 0) {
        setChildren(prev => prev - 1)
      }
    }
  }

  const handleRoomsCountChange = (increment: boolean) => {
    if (increment && roomsCount < (selectedRoomType?.totalRooms || 10)) {
      setRoomsCount(prev => prev + 1)
    } else if (!increment && roomsCount > 1) {
      setRoomsCount(prev => prev - 1)
    }
  }

  const totalGuests = adults + children

  const ImageGalleryModal = () => {
    if (!showImageGallery || !property) return null

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-3xl z-10">
            <div className="flex justify-between items-center p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Hình ảnh {property.name}
              </h2>
              <button
                onClick={() => setShowImageGallery(false)}
                className="p-2 hover:bg-pink-50 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => {
                    setSelectedImageIndex(index)
                    setShowImageGallery(false)
                  }}
                >
                  <img
                    src={getImageUrl(image.imageUrl)}
                    alt={`${property.name} - ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ShareModal = () => {
    if (!showShareModal || !property) return null

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Chia sẻ {property.name}
            </h2>
            <button
              onClick={() => setShowShareModal(false)}
              className="p-2 hover:bg-pink-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={shareOnFacebook}
                className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all duration-200 border border-blue-200 group"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Facebook className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-blue-700">Facebook</span>
              </button>

              <button
                onClick={shareOnTwitter}
                className="flex flex-col items-center p-4 bg-sky-50 hover:bg-sky-100 rounded-2xl transition-all duration-200 border border-sky-200 group"
              >
                <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Twitter className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-sky-700">Twitter</span>
              </button>

              <button
                onClick={copyLink}
                className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-all duration-200 border border-purple-200 group"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Link className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-purple-700">Copy Link</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input
                type="text"
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
              />
              <Button
                onClick={copyLink}
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                <Link className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-purple-600 font-medium">Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Không tìm thấy thông tin property
          </h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Button 
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <nav className="text-xs md:text-sm text-purple-600">
            <span className="hover:text-pink-600 cursor-pointer">Trang chủ</span>
            <span className="mx-2">/</span>
            <span className="hover:text-pink-600 cursor-pointer">{property.productType.name}</span>
            <span className="mx-2">/</span>
            <span className="hover:text-pink-600 cursor-pointer">{property.province}</span>
            <span className="mx-2">/</span>
            <span className="text-gray-600">{property.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                {property.name}
              </h1>
              <div className="flex items-start text-gray-600 mb-3">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2 text-pink-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm md:text-base">{property.addressDetail}, {property.commune}, {property.province}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 md:w-5 md:h-5 ${
                        i < property.starRating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm md:text-base text-gray-600">{property.starRating} sao</span>
                </div>
                <span className="text-xs md:text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-2 md:px-3 py-1 rounded-full border border-green-200">
                  {property.status === 'approved' ? 'Đã xác nhận' : property.status}
                </span>
                <span className="text-xs md:text-sm bg-gradient-to-r from-pink-100 to-purple-100 text-purple-800 px-2 md:px-3 py-1 rounded-full border border-purple-200">
                  {property.productType.name}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                disabled={isFavoriteLoading}
                className={`${isFavorite 
                  ? 'text-pink-500 bg-pink-50 hover:bg-pink-100' 
                  : 'text-gray-500 hover:bg-pink-50 hover:text-pink-500'
                } transition-all duration-200 ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`w-4 h-4 md:w-5 md:h-5 mr-1 ${isFavorite ? 'fill-current' : ''}`} />
                <span className="hidden md:inline">
                  {isFavoriteLoading ? 'Đang xử lý...' : (isFavorite ? 'Đã thích' : 'Yêu thích')}
                </span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleShare}
                className="text-gray-500 hover:bg-purple-50 hover:text-purple-500 transition-all duration-200"
              >
                <Share2 className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                <span className="hidden md:inline">Chia sẻ</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 md:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4 h-80 md:h-96">
            <div className="lg:col-span-2 relative rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group">
              <img
                src={property.images.length > 0 ? getImageUrl(property.images[selectedImageIndex]?.imageUrl) : '/placeholder-hotel.jpg'}
                alt={property.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {selectedImageIndex + 1} / {property.images.length}
              </div>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-2 gap-3 md:gap-4 h-full">
              {property.images
                .map((image, originalIndex) => ({ image, originalIndex }))
                .filter(({ originalIndex }) => originalIndex !== selectedImageIndex)
                .slice(0, 4)
                .map(({ image, originalIndex }, displayIndex) => (
                  <div
                    key={image.id}
                    className="relative rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group h-full border-2 border-transparent hover:border-pink-200 transition-all duration-200"
                    onClick={() => setSelectedImageIndex(originalIndex)}
                  >
                    <img
                      src={getImageUrl(image.imageUrl)}
                      alt={`${property.name} - ${originalIndex + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    
                    {displayIndex === 3 && property.images.length > 5 && (
                      <div 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold backdrop-blur-sm cursor-pointer hover:bg-black/70 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowImageGallery(true);
                        }}
                      >
                        <div className="text-center">
                          <span className="text-xl md:text-2xl font-bold">+{property.images.length - 5}</span>
                          <br />
                          <span className="text-sm">ảnh</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              }
              
              {property.images.length <= 4 && 
                [...Array(Math.max(0, 4 - (property.images.length - 1)))].map((_, emptyIndex) => (
                  <div 
                    key={`empty-${emptyIndex}`} 
                    className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl md:rounded-3xl border border-pink-100 flex items-center justify-center h-full"
                  >
                    <span className="text-pink-300 text-sm">Không có ảnh</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Mô tả
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-sm md:text-base">{property.description}</p>
              <p className="text-gray-600 text-sm md:text-base">{property.shortDescription}</p>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 text-pink-500" />
                  <span>Thành lập: {property.establishedYear}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 text-pink-500" />
                  <span>Tổng: {property.totalRooms} phòng</span>
                </div>
                <div className="flex items-center">
                  <span>Tối thiểu: {property.minStayNights} đêm</span>
                </div>
                <div className="flex items-center">
                  <span>Tối đa: {property.maxStayNights} đêm</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Vị trí
              </h2>
              <div className="mb-4">
                <p className="text-gray-700 text-sm md:text-base mb-2">
                  <MapPin className="inline w-4 h-4 mr-1 text-pink-500" />
                  {property.addressDetail}, {property.commune}, {property.province}
                </p>
              </div>
              <div 
                ref={mapRef} 
                className="w-full h-64 rounded-xl border-2 border-pink-100"
                style={{ zIndex: 1 }}
              ></div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Tiện nghi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {property.amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-start p-3 md:p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl md:rounded-2xl border border-pink-100 hover:border-pink-200 transition-all duration-200">
                    <div className="flex-shrink-0 mt-0.5">
                      {getAmenityIcon(amenity.name)}
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm md:text-base">{amenity.name}</p>
                      {amenity.isFree && (
                        <p className="text-xs md:text-sm text-green-600 font-medium">Miễn phí</p>
                      )}
                      {amenity.additionalInfo && (
                        <p className="text-xs md:text-sm text-gray-500 mt-1">{amenity.additionalInfo}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Loại phòng
              </h2>
              <div className="space-y-4">
                {property.roomTypes.map((room) => (
                  <div
                    key={room.id}
                    className={`border-2 rounded-xl md:rounded-2xl p-4 md:p-6 cursor-pointer transition-all duration-200 ${
                      selectedRoomType?.id === room.id
                        ? 'border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-pink-200 hover:shadow-md bg-white/50'
                    }`}
                    onClick={() => setSelectedRoomType(room)}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg md:text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                          {room.name}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-4">
                          <div className="flex items-center text-gray-600">
                            <span className="text-pink-500 mr-1 text-sm">👥</span>
                            <span className="text-xs md:text-sm">{room.maxAdults} người lớn</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <span className="text-pink-500 mr-1 text-sm">🧒</span>
                            <span className="text-xs md:text-sm">{room.maxChildren} trẻ</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Bed className="w-3 h-3 md:w-4 md:h-4 mr-1 text-pink-500" />
                            <span className="text-xs md:text-sm">{room.bedType}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <span className="text-pink-500 mr-1 text-sm">📐</span>
                            <span className="text-xs md:text-sm">{room.roomSize}m²</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <span className="text-pink-500 mr-1 text-sm">🏠</span>
                            <span className="text-xs md:text-sm">{room.totalRooms} phòng</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openRoomModal(room)
                          }}
                          className="border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300"
                        >
                          Xem chi tiết phòng
                        </Button>
                      </div>
                      <div className="text-right md:text-left lg:text-right">
                        <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                          {formatPrice(room.basePrice)}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500">/ đêm(Ngày thường)</p>
                      </div>
                    </div>
                  </div>
                ))}
                
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-pink-100">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
    <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 md:mb-0">
      Đánh giá từ khách hàng
    </h2>
    
    {reviews && reviews.totalCount > 0 && (
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-full border border-yellow-200">
          <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
          <span className="font-bold text-gray-900">
            {(reviews.reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.reviews.length).toFixed(1)}
          </span>
          <span className="text-gray-500 ml-1 text-sm">({reviews.totalCount} đánh giá)</span>
        </div>
      </div>
    )}
  </div>

  {/* Rating Filter */}
  <div className="flex flex-wrap gap-2 mb-6">
    <button
      onClick={() => setSelectedRatingFilter(null)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        selectedRatingFilter === null
          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      Tất cả
    </button>
    {[5, 4, 3, 2, 1].map((rating) => (
      <button
        key={rating}
        onClick={() => setSelectedRatingFilter(rating)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
          selectedRatingFilter === rating
            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Star className="w-4 h-4 fill-current" />
        {rating}
      </button>
    ))}
  </div>

  {reviewsLoading ? (
  <div className="flex justify-center py-8">
    <Loading />
  </div>
) : reviews && reviews.reviews.length > 0 ? (
  <>
    <div className="space-y-4 mb-6">
      {reviews.reviews.map((review) => (
        <div 
          key={review.id} 
          className={`
            border rounded-xl p-4 transition-all duration-200
            ${review.isFeatured 
              ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-lg hover:shadow-xl' 
              : 'border-gray-200 bg-white/50 hover:border-pink-200'
            }
          `}
        >
          {/* Featured Badge */}
          {review.isFeatured && (
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-semibold">Đánh giá nổi bật</span>
            </div>
          )}
          
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-full overflow-hidden flex items-center justify-center
                ${review.isFeatured 
                  ? 'bg-gradient-to-br from-amber-100 to-yellow-100 ring-2 ring-amber-200' 
                  : 'bg-gradient-to-br from-pink-100 to-purple-100'
                }
              `}>
                {review.customer?.avatar ? (
                  <img
                    src={getImageUrl(review.customer.avatar)}
                    alt={review.customer.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className={`w-5 h-5 ${review.isFeatured ? 'text-amber-500' : 'text-pink-400'}`} />
                )}
              </div>
              <div>
                <p className={`font-semibold ${review.isFeatured ? 'text-gray-900' : 'text-gray-900'}`}>
                  {review.customer?.fullName || 'Ẩn danh'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(review.createdAt || '').toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.overallRating
                      ? review.isFeatured 
                        ? 'text-amber-400 fill-current' 
                        : 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {review.title && (
            <h4 className={`font-semibold mb-2 ${review.isFeatured ? 'text-gray-900 text-lg' : 'text-gray-900'}`}>
              {review.title}
            </h4>
          )}

          {review.reviewText && (
            <p className={`text-sm mb-3 ${review.isFeatured ? 'text-gray-800' : 'text-gray-700'}`}>
              {review.reviewText}
            </p>
          )}

          {/* Rating breakdown */}
          {(review.cleanlinessRating || review.locationRating || review.serviceRating) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {review.cleanlinessRating && (
                <div className={`text-xs ${review.isFeatured ? 'text-gray-700' : 'text-gray-600'}`}>
                  <span className="font-medium">Vệ sinh:</span> {review.cleanlinessRating}/5
                </div>
              )}
              {review.locationRating && (
                <div className={`text-xs ${review.isFeatured ? 'text-gray-700' : 'text-gray-600'}`}>
                  <span className="font-medium">Vị trí:</span> {review.locationRating}/5
                </div>
              )}
              {review.serviceRating && (
                <div className={`text-xs ${review.isFeatured ? 'text-gray-700' : 'text-gray-600'}`}>
                  <span className="font-medium">Dịch vụ:</span> {review.serviceRating}/5
                </div>
              )}
            </div>
          )}

          {/* Review images */}
          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {review.images.map((image) => (
                <div 
                  key={image.id} 
                  className={`
                    flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border
                    ${review.isFeatured ? 'border-amber-200' : 'border-gray-200'}
                  `}
                >
                  <img
                    src={getImageUrl(image.imageUrl)}
                    alt="Review"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Host reply */}
          {review.hostReply && (
            <div className={`
              mt-3 ml-6 p-3 rounded-lg border
              ${review.isFeatured 
                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' 
                : 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100'
              }
            `}>
              <p className={`text-xs font-semibold mb-1 ${review.isFeatured ? 'text-amber-600' : 'text-pink-600'}`}>
                Phản hồi từ chủ nhà
              </p>
              <p className="text-sm text-gray-700">{review.hostReply}</p>
              {review.hostRepliedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(review.hostRepliedAt).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          )}

          {review.isVerified && (
            <div className={`flex items-center gap-1 text-xs mt-2 ${
              review.isFeatured ? 'text-green-700' : 'text-green-600'
            }`}>
              <CheckCircle className="w-3 h-3" />
              <span>Đã xác minh đặt phòng</span>
            </div>
          )}
        </div>
      ))}
    </div>

    {/* Pagination */}
    {reviews.totalPages > 1 && (
      <div className="flex justify-center items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setReviewsPage(p => Math.max(1, p - 1))}
          disabled={!reviews.hasPreviousPage}
          className="border-pink-200 text-pink-600 hover:bg-pink-50"
        >
          Trước
        </Button>
        <span className="text-sm text-gray-600">
          Trang {reviews.page} / {reviews.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setReviewsPage(p => p + 1)}
          disabled={!reviews.hasNextPage}
          className="border-pink-200 text-pink-600 hover:bg-pink-50"
        >
          Sau
        </Button>
      </div>
    )}
  </>
) : (
  <div className="text-center py-8">
    <p className="text-gray-500">Chưa có đánh giá nào</p>
  </div>
)}
</div>

</div>

          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg border border-pink-200">
                <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  Thông tin chủ nhà
                </h2>
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-pink-200 mb-3">
                    {property.host.avatar ? (
                      <img 
                        src={getImageUrl(property.host.avatar)} 
                        alt={property.host.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        <User className="w-10 h-10 text-pink-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{property.host.fullName}</h3>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 bg-pink-50 p-2 rounded-lg">
                    <Mail className="w-4 h-4 mr-2 text-pink-500 flex-shrink-0" />
                    <a href={`mailto:${property.host.email}`} className="hover:text-pink-600 transition-colors truncate">
                      {property.host.email}
                    </a>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 bg-pink-50 p-2 rounded-lg">
                    <Phone className="w-4 h-4 mr-2 text-pink-500 flex-shrink-0" />
                    <span>{property.host.phone}</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleCallHost}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Gọi trực tiếp
                </Button>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg sticky top-20 border border-pink-200">
                <div className="mb-6">
                  <div className="text-center mb-2">
                    <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {formatPrice(selectedRoomType?.basePrice || property.priceFrom)}
                    </span>
                    <span className="text-gray-500 ml-2 text-sm md:text-base">/ đêm</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 text-center">
                    Giá từ {formatPrice(property.priceFrom)} - {property.totalRooms} phòng
                  </p>
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
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 border border-pink-200">
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
                            disabled={roomsCount >= (selectedRoomType?.totalRooms || 10)}
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
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 border border-pink-200">
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
                              disabled={adults >= (selectedRoomType?.maxAdults || 10)}
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
                              disabled={children >= (selectedRoomType?.maxChildren || 8)}
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
                    disabled={checkingAvailability || !checkIn || !checkOut || !selectedRoomType}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                    size="lg"
                  >
                    {checkingAvailability ? (
                      <>
                        <Loading />
                        <span className="ml-2">Đang kiểm tra...</span>
                      </>
                    ) : (
                      'Đặt ngay'
                    )}
                  </Button>

                  <Button
                    onClick={handleViewAvailableDates}
                    disabled={!selectedRoomType}
                    variant="outline"
                    className="w-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Xem ngày trống
                  </Button>
                </div>

                <div className="text-center text-xs md:text-sm text-gray-600 mb-4">
                  Bạn chưa bị tính phí
                </div>

                <div className="border-t border-pink-100 pt-4 space-y-2">
                  <div className="flex items-center text-xs md:text-sm text-gray-600">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-2 text-pink-500" />
                    <span>Nhận phòng: {property.checkInTime}</span>
                  </div>
                  <div className="flex items-center text-xs md:text-sm text-gray-600">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-2 text-pink-500" />
                    <span>Trả phòng: {property.checkOutTime}</span>
                  </div>
                  <div className="flex items-center text-xs md:text-sm text-gray-600">
                    <Shield className="w-3 h-3 md:w-4 md:h-4 mr-2 text-pink-500" />
                    <span>Chính sách hủy: {property.cancellationPolicy === 'flexible' ? 'Linh hoạt' : property.cancellationPolicy}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SimilarPropertiesSection />
      </div>

      <ImageGalleryModal />
      <ShareModal />
      
      <RoomDetailModal
  isOpen={showRoomModal}
  onClose={closeRoomModal}
  room={modalRoomType}
  propertyId={property.id}  // Thêm prop này
  propertyCheckInTime={property.checkInTime}
  propertyCheckOutTime={property.checkOutTime}
  propertyCancellationPolicy={property.cancellationPolicy}
/>

      <AvailableDatesModal
        isOpen={showAvailableDatesModal}
        onClose={() => setShowAvailableDatesModal(false)}
        calendar={availableDatesData?.calendar || null}
        summary={availableDatesData?.summary || null}
        roomTypeName={availableDatesData?.roomTypeName || selectedRoomType?.name || ''}
        year={availableDatesYear}
        month={availableDatesMonth}
        monthName={availableDatesData?.monthName || ''}
        roomsCount={roomsCount}
        totalRooms={availableDatesData?.totalRooms || selectedRoomType?.totalRooms || 0}
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
    </div>
  )
}

export default PropertyDetailPage
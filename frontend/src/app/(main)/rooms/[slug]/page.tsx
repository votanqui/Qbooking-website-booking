'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { DatePickerModal } from '@/components/ui/DatePickerModal'
import { useToast } from '@/components/ui/Toast'
import { Star, MapPin, Users, Bed, Calendar, Wifi, Car, Coffee, Shield, Heart, Share2, CheckCircle, Plus, Minus, X, Phone, Mail, User, Facebook, Twitter, Link } from 'lucide-react'
import { roomService } from '@/services/main/room.service'
import { bookingService } from '@/services/main/booking.service'
import { favoriteService } from '@/services/main/favorite.service'
import { RoomDetailResponse } from '@/types/main/room'
import { reviewService } from '@/services/main/review.service'
import { ReviewListResponse } from '@/types/main/review'

const RoomDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { showToast } = useToast()
  
  const [room, setRoom] = useState<RoomDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [roomsCount, setRoomsCount] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [showCheckInPicker, setShowCheckInPicker] = useState(false)
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [reviews, setReviews] = useState<ReviewListResponse | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsPageSize] = useState(5)
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null)
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true)
        const response = await roomService.getRoomBySlug(slug)
        
        if (response.success && response.data) {
          setRoom(response.data)
          checkFavoriteStatus(response.data.propertyId)
        } else {
          setError(response.message || 'Không tìm thấy thông tin phòng')
        }
      } catch (err) {
        setError('Lỗi khi tải thông tin phòng')
        console.error('Error fetching room:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchRoom()
    }
  }, [slug])

  const checkFavoriteStatus = async (propertyId: number) => {
    try {
      const isFav = await favoriteService.isFavorite(propertyId)
      setIsFavorite(isFav)
    } catch (err) {
      console.error('Error checking favorite status:', err)
    }
  }
  useEffect(() => {
    const fetchReviews = async () => {
      if (!room) return

      setReviewsLoading(true)
      try {
        const response = await reviewService.getPropertyReviews(room.propertyId, {
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

    if (room?.propertyId) {
      fetchReviews()
    }
  }, [room?.propertyId, reviewsPage, reviewsPageSize, selectedRatingFilter])
  const handleToggleFavorite = async () => {
    if (!room) return

    setIsFavoriteLoading(true)
    
    try {
      if (isFavorite) {
        const response = await favoriteService.removeFromFavorites(room.propertyId)
        
        if (response.success) {
          setIsFavorite(false)
          showToast('Đã xóa khỏi danh sách yêu thích', 'success')
        } else {
          showToast(response.message || 'Không thể xóa khỏi danh sách yêu thích', 'error')
        }
      } else {
        const response = await favoriteService.addToFavorites({
          propertyId: room.propertyId
        })
        
        if (response.success) {
          setIsFavorite(true)
          showToast('Đã thêm vào danh sách yêu thích', 'success')
        } else {
          if (response.statusCode === 401) {
            showToast('Vui lòng đăng nhập để thêm vào yêu thích', 'warning')
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

  const handleCheckAvailabilityAndBook = async () => {
    if (!room) return

    if (!checkIn || !checkOut) {
      showToast('Vui lòng chọn ngày nhận và trả phòng', 'warning')
      return
    }

    setCheckingAvailability(true)
    try {
      const totalGuests = adults + children
      const response = await bookingService.checkAvailability({
        propertyId: room.propertyId,
        roomTypeId: room.id,
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
            propertyId: room.propertyId.toString(),
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

  const handleShare = () => {
    setShowShareModal(true)
  }

  const shareOnFacebook = () => {
    const url = window.location.href
    const text = `Check out ${room?.name} - ${room?.description?.substring(0, 100)}...`
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const shareOnTwitter = () => {
    const url = window.location.href
    const text = `Check out ${room?.name}`
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
      'Tủ lạnh': <CheckCircle className="w-5 h-5 text-pink-500" />,
      'default': <CheckCircle className="w-5 h-5 text-pink-500" />
    }
    return icons[name] || icons['default']
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
      if (increment && adults < (room?.maxAdults || 10)) {
        setAdults(prev => prev + 1)
      } else if (!increment && adults > 1) {
        setAdults(prev => prev - 1)
      }
    } else {
      if (increment && children < (room?.maxChildren || 8)) {
        setChildren(prev => prev + 1)
      } else if (!increment && children > 0) {
        setChildren(prev => prev - 1)
      }
    }
  }

  const handleRoomsCountChange = (increment: boolean) => {
    if (increment && roomsCount < (room?.totalRooms || 10)) {
      setRoomsCount(prev => prev + 1)
    } else if (!increment && roomsCount > 1) {
      setRoomsCount(prev => prev - 1)
    }
  }

  const totalGuests = adults + children

  const ImageGalleryModal = () => {
    if (!showImageGallery || !room) return null

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-3xl z-10">
            <div className="flex justify-between items-center p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Hình ảnh {room.name}
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
              {room.images.map((image, index) => (
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
                    alt={`${room.name} - ${index + 1}`}
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
    if (!showShareModal || !room) return null

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Chia sẻ {room.name}
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

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Không tìm thấy thông tin phòng
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
            <span className="hover:text-pink-600 cursor-pointer">Phòng</span>
            <span className="mx-2">/</span>
            <span className="hover:text-pink-600 cursor-pointer">{room.propertyName}</span>
            <span className="mx-2">/</span>
            <span className="text-gray-600">{room.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                {room.name}
              </h1>
              <div className="flex items-start text-gray-600 mb-3">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2 text-pink-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm md:text-base">{room.propertyName}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs md:text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-2 md:px-3 py-1 rounded-full border border-green-200">
                  {room.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
                <span className="text-xs md:text-sm bg-gradient-to-r from-pink-100 to-purple-100 text-purple-800 px-2 md:px-3 py-1 rounded-full border border-purple-200">
                  {room.totalRooms} phòng có sẵn
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
                src={room.images.length > 0 ? getImageUrl(room.images[selectedImageIndex]?.imageUrl) : '/placeholder-hotel.jpg'}
                alt={room.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {selectedImageIndex + 1} / {room.images.length}
              </div>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-2 gap-3 md:gap-4 h-full">
              {room.images
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
                      alt={`${room.name} - ${originalIndex + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    
                    {displayIndex === 3 && room.images.length > 5 && (
                      <div 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold backdrop-blur-sm cursor-pointer hover:bg-black/70 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowImageGallery(true);
                        }}
                      >
                        <div className="text-center">
                          <span className="text-xl md:text-2xl font-bold">+{room.images.length - 5}</span>
                          <br />
                          <span className="text-sm">ảnh</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              }
              
              {room.images.length <= 4 && 
                [...Array(Math.max(0, 4 - (room.images.length - 1)))].map((_, emptyIndex) => (
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
                Mô tả phòng
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-sm md:text-base">{room.description}</p>
              <p className="text-gray-600 text-sm md:text-base">{room.shortDescription}</p>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 text-pink-500" />
                  <span>Tối đa: {room.maxGuests} khách</span>
                </div>
                <div className="flex items-center">
                  <Bed className="w-3 h-3 md:w-4 md:h-4 mr-1 text-pink-500" />
                  <span>{room.bedType}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-pink-500 mr-1">📐</span>
                  <span>{room.roomSize}m²</span>
                </div>
                <div className="flex items-center">
                  <span className="text-pink-500 mr-1">🏠</span>
                  <span>{room.totalRooms} phòng</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Thông tin sức chứa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                  <div className="flex items-center mb-2">
                    <Users className="w-5 h-5 text-pink-500 mr-2" />
                    <span className="text-sm text-gray-600">Người lớn</span>
                  </div>
                  <p className="text-2xl font-bold text-pink-600">{room.maxAdults}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                  <div className="flex items-center mb-2">
                    <span className="text-pink-500 mr-2 text-xl">🧒</span>
                    <span className="text-sm text-gray-600">Trẻ em</span>
                  </div>
                  <p className="text-2xl font-bold text-pink-600">{room.maxChildren}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                  <div className="flex items-center mb-2">
                    <Users className="w-5 h-5 text-pink-500 mr-2" />
                    <span className="text-sm text-gray-600">Tổng khách</span>
                  </div>
                  <p className="text-2xl font-bold text-pink-600">{room.maxGuests}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Giá phòng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-pink-500 mr-2" />
                    <span className="text-sm text-gray-600">Ngày thường</span>
                  </div>
                  <p className="text-lg font-bold text-pink-600">{formatPrice(room.basePrice)}</p>
                  <p className="text-xs text-gray-500 mt-1">/ đêm</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-pink-500 mr-2" />
                    <span className="text-sm text-gray-600">Cuối tuần</span>
                  </div>
                  <p className="text-lg font-bold text-pink-600">{formatPrice(room.weekendPrice)}</p>
                  <p className="text-xs text-gray-500 mt-1">/ đêm</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-pink-500 mr-2" />
                    <span className="text-sm text-gray-600">Ngày lễ</span>
                  </div>
                  <p className="text-lg font-bold text-pink-600">{formatPrice(room.holidayPrice)}</p>
                  <p className="text-xs text-gray-500 mt-1">/ đêm</p>
                </div>
              </div>
              {(room.weeklyDiscountPercent > 0 || room.monthlyDiscountPercent > 0) && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-1">Ưu đãi đặc biệt:</p>
                  <div className="space-y-1">
                    {room.weeklyDiscountPercent > 0 && (
                      <p className="text-xs text-green-700">
                        • Giảm {room.weeklyDiscountPercent}% cho đặt từ 7 đêm
                      </p>
                    )}
                    {room.monthlyDiscountPercent > 0 && (
                      <p className="text-xs text-green-700">
                        • Giảm {room.monthlyDiscountPercent}% cho đặt từ 30 đêm
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-pink-100">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Tiện nghi phòng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {room.amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-start p-3 md:p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl md:rounded-2xl border border-pink-100 hover:border-pink-200 transition-all duration-200">
                    <div className="flex-shrink-0 mt-0.5">
                      {getAmenityIcon(amenity.name)}
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm md:text-base">{amenity.name}</p>
                      {amenity.quantity && (
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Số lượng: {amenity.quantity}</p>
                      )}
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
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg sticky top-20 border border-pink-200">
              <div className="mb-6">
                <div className="text-center mb-2">
                  <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(room.basePrice)}
                  </span>
                  <span className="text-gray-500 ml-2 text-sm md:text-base">/ đêm</span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 text-center">
                  {room.totalRooms} phòng có sẵn
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
                          disabled={roomsCount >= room.totalRooms}
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
                            disabled={adults >= room.maxAdults}
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
                            disabled={children >= room.maxChildren}
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
                    'Đặt ngay'
                  )}
                </Button>
              </div>

              <div className="text-center text-xs md:text-sm text-gray-600 mb-4">
                Bạn chưa bị tính phí
              </div>

              <div className="border-t border-pink-100 pt-4 space-y-2">
                <div className="flex items-center text-xs md:text-sm text-gray-600">
                  <Bed className="w-3 h-3 md:w-4 md:h-4 mr-2 text-pink-500" />
                  <span>Loại giường: {room.bedType}</span>
                </div>
                <div className="flex items-center text-xs md:text-sm text-gray-600">
                  <span className="text-pink-500 mr-2">📐</span>
                  <span>Diện tích: {room.roomSize}m²</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageGalleryModal />
      <ShareModal />

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

export default RoomDetailPage
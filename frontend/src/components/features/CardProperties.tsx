'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { 
  HeartIcon, 
  MapPinIcon,
  UserGroupIcon,
  HomeIcon,
  WifiIcon,
  TruckIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Property } from '@/types/main/property'
import { favoriteService } from '@/services/main/favorite.service'

interface PropertyCardProps {
  property: Property
  showFullDetails?: boolean
}

export function PropertyCard({ property, showFullDetails = false }: PropertyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [hasCheckedFavorite, setHasCheckedFavorite] = useState(false)
  const { showToast } = useToast()

  // Kiểm tra trạng thái yêu thích khi component mount - chỉ check một lần
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      // Chỉ check nếu chưa check lần nào
      if (hasCheckedFavorite) return
      
      try {
        const isFav = await favoriteService.isFavorite(Number(property.id))
        setIsFavorited(isFav)
        setHasCheckedFavorite(true)
      } catch (err) {
        console.error('Error checking favorite status:', err)
        setHasCheckedFavorite(true) // Đánh dấu đã check dù có lỗi
      }
    }

    checkFavoriteStatus()
  }, [property.id, hasCheckedFavorite])

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsFavoriteLoading(true)
    
    try {
      if (isFavorited) {
        // Xóa khỏi danh sách yêu thích
        const response = await favoriteService.removeFromFavorites(Number(property.id))
        
        if (response.success) {
          setIsFavorited(false)
          showToast('Đã xóa khỏi danh sách yêu thích', 'success')
        } else {
          showToast(response.message || 'Không thể xóa khỏi danh sách yêu thích', 'error')
        }
      } else {
        // Thêm vào danh sách yêu thích
        const response = await favoriteService.addToFavorites({
          propertyId: Number(property.id)
        })
        
        if (response.success) {
          setIsFavorited(true)
          showToast('Đã thêm vào danh sách yêu thích', 'success')
        } else {
          if (response.statusCode === 401) {
            showToast('Vui lòng đăng nhập để thêm vào yêu thích', 'warning')
            // Không reset trạng thái favorite khi chưa login
            return
          } else if (response.statusCode === 400) {
            // Nếu đã có trong danh sách, cập nhật UI
            setIsFavorited(true)
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

  const formatPrice = (amount: number, currency: string) => {
    if (currency === 'VND') {
      const fullAmount = amount * 1000
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(fullAmount)
    }
    return `$${amount.toLocaleString()}`
  }

  const getPropertyTypeIcon = (type: Property['propertyType']) => {
    switch (type) {
      case 'villa':
        return <HomeIcon className="w-4 h-4" />
      case 'apartment':
        return <BuildingOfficeIcon className="w-4 h-4" />
      case 'hotel':
        return <BuildingStorefrontIcon className="w-4 h-4" />
      case 'resort':
        return <BuildingStorefrontIcon className="w-4 h-4" />
      case 'homestay':
        return <HomeIcon className="w-4 h-4" />
      case 'house':
        return <HomeIcon className="w-4 h-4" />
      default:
        return <HomeIcon className="w-4 h-4" />
    }
  }

  const getPropertyTypeDisplayName = (type: Property['propertyType']) => {
    const typeMap = {
      'villa': 'Biệt thự',
      'apartment': 'Căn hộ',
      'hotel': 'Khách sạn', 
      'resort': 'Resort',
      'homestay': 'Homestay',
      'house': 'Nhà ở'
    }
    return typeMap[type] || type
  }

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase()
    
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) {
      return <WifiIcon className="w-3 h-3" />
    }
    if (amenityLower.includes('điều hòa') || amenityLower.includes('air conditioning') || amenityLower.includes('máy lạnh')) {
      return <div className="w-3 h-3 flex items-center justify-center text-pink-400">❄️</div>
    }
    if (amenityLower.includes('đậu xe') || amenityLower.includes('parking') || amenityLower.includes('garage') || amenityLower.includes('chỗ đậu')) {
      return <TruckIcon className="w-3 h-3" />
    }
    if (amenityLower.includes('bàn') || amenityLower.includes('desk') || amenityLower.includes('workspace')) {
      return <div className="w-3 h-3 flex items-center justify-center">🗂️</div>
    }
    if (amenityLower.includes('tủ lạnh') || amenityLower.includes('fridge') || amenityLower.includes('refrigerator')) {
      return <div className="w-3 h-3 flex items-center justify-center">🧊</div>
    }
    if (amenityLower.includes('báo khói') || amenityLower.includes('smoke') || amenityLower.includes('detector')) {
      return <div className="w-3 h-3 flex items-center justify-center">🔥</div>
    }
    if (amenityLower.includes('bồn tắm') || amenityLower.includes('bathtub') || amenityLower.includes('jacuzzi')) {
      return <div className="w-3 h-3 flex items-center justify-center">🛁</div>
    }
    if (amenityLower.includes('bể bơi') || amenityLower.includes('pool') || amenityLower.includes('swimming')) {
      return <div className="w-3 h-3 flex items-center justify-center">🏊</div>
    }
    if (amenityLower.includes('gym') || amenityLower.includes('fitness') || amenityLower.includes('thể dục')) {
      return <div className="w-3 h-3 flex items-center justify-center">💪</div>
    }
    
    return <SparklesIcon className="w-3 h-3" />
  }

 

  // Hiển thị đánh giá
  const renderRating = (rating: number, reviewCount: number) => {
    if (reviewCount === 0) return null;

    return (
      <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
        <span className="text-white text-sm font-bold">
          ⭐ {rating.toFixed(1)}
        </span>
        <span className="text-white/80 text-xs">({reviewCount})</span>
      </div>
    );
  };

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 border border-pink-200/50 shadow-lg hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 transform hover:-translate-y-1 rounded-2xl backdrop-blur-sm">
      {/* Mystical glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-purple-500/0 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden rounded-t-2xl">
        {!imageError && property.thumbnail ? (
          <div className="relative w-full h-full">
            <img
              src={property.thumbnail}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              onError={() => setImageError(true)}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/30 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <div className="text-center text-pink-400">
              <HomeIcon className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Hình ảnh không có sẵn</p>
            </div>
          </div>
        )}
        
        {/* Rating - Hiển thị trên ảnh */}
        <div className="absolute top-3 left-3">
          {renderRating(property.rating, property.reviewCount)}
        </div>
        
        {/* Favorite button - Đã tích hợp API */}
        <button
          onClick={handleToggleFavorite}
          disabled={isFavoriteLoading}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 border ${
            isFavorited 
              ? 'bg-pink-50/95 border-pink-200' 
              : 'bg-white/95 border-pink-200/30 hover:border-pink-300'
          } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isFavorited ? (
            <HeartSolidIcon className="w-5 h-5 text-pink-500" />
          ) : (
            <HeartIcon className="w-5 h-5 text-gray-600 hover:text-pink-500" />
          )}
        </button>

        {/* Badges */}
        <div className="absolute top-12 left-3 flex flex-col gap-2">
          {property.isVerified && (
            <span className="px-2 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm border border-white/20">
              ✓ Xác minh
            </span>
          )}
          {property.isSuperhost && (
            <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm border border-white/20">
              ⭐ Nổi bật
            </span>
          )}
        </div>

        {/* Property Type Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-pink-700 text-xs font-semibold border border-pink-200/50 shadow-lg">
            {getPropertyTypeIcon(property.propertyType)}
            <span className="ml-1">{getPropertyTypeDisplayName(property.propertyType)}</span>
          </span>
        </div>

        {/* Quick action button on hover - Sử dụng slug */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Link href={`/properties/${property.slug}`}>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl border border-white/20 backdrop-blur-sm rounded-lg"
            >
              Xem chi tiết
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 relative">
        {/* Location - Hiển thị rõ ràng */}
        <div className="flex items-center text-gray-700 text-sm mb-2">
          <MapPinIcon className="w-4 h-4 mr-1.5 flex-shrink-0 text-pink-500" />
          <span className="font-medium truncate">
            {property.location.district && `${property.location.district}, `}
            {property.location.city}
          </span>
        </div>

        {/* Title - Sử dụng slug trong link */}
        <Link href={`/properties/${property.slug}`} className="block mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-pink-700 transition-colors duration-200 leading-tight text-base">
            {property.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
          {property.description}
        </p>

        {/* Property details for full view */}
        {showFullDetails && property.capacity && (
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 p-2 bg-pink-50/50 rounded-lg border border-pink-100">
            <div className="flex items-center">
              <UserGroupIcon className="w-4 h-4 mr-1 text-pink-500" />
              <span>{property.capacity.guests} khách</span>
            </div>
            <div className="flex items-center">
              {getPropertyTypeIcon(property.propertyType)}
              <span className="ml-1">{property.capacity.bedrooms} phòng ngủ</span>
            </div>
            <div className="flex items-center">
              <span>{property.capacity.bathrooms} phòng tắm</span>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <EyeIcon className="w-3 h-3 text-pink-400" />
              <span>{property.totalViews.toLocaleString('vi-VN')} lượt xem</span>
            </div>
            <div className="flex items-center gap-1">
              <ChatBubbleLeftRightIcon className="w-3 h-3 text-pink-400" />
              <span>{property.reviewCount} đánh giá</span>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          {property.amenities.slice(0, showFullDetails ? 4 : 3).map((amenity, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-pink-100/80 to-purple-100/80 text-pink-700 text-xs font-medium border border-pink-200/50 backdrop-blur-sm"
            >
              {getAmenityIcon(amenity)}
              <span className="ml-1 max-w-16 truncate">{amenity}</span>
            </span>
          ))}
          {property.amenities.length > (showFullDetails ? 4 : 3) && (
            <span className="text-xs text-pink-500 font-medium">
              +{property.amenities.length - (showFullDetails ? 4 : 3)} khác
            </span>
          )}
        </div>

        {/* Price & Book Section - Sử dụng slug trong link */}
        <div className="flex items-center justify-between pt-3 border-t border-pink-100/50">
          <div className="text-left">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {formatPrice(property.price.amount, property.price.currency)}
              </span>
              <span className="text-gray-500 text-sm">/đêm</span>
            </div>
          </div>
          
          <Link href={`/properties/${property.slug}`}>
            <Button 
              size="sm"
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 font-semibold rounded-lg px-4"
            >
              Đặt ngay
            </Button>
          </Link>
        </div>
      </div>

      {/* Mystical border glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none -z-10 blur-sm" />
    </Card>
  )
}
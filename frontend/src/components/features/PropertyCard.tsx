'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  HeartIcon, 
  StarIcon, 
  MapPinIcon,
  UserGroupIcon,
  HomeIcon,
  WifiIcon,
  TruckIcon
  
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { Property } from '@/types/main/property'

interface PropertyCardProps {
  property: Property
  showFullDetails?: boolean
}

export function PropertyCard({ property, showFullDetails = false }: PropertyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatPrice = (amount: number, currency: string) => {
    if (currency === 'VND') {
      // If amount is already in thousands, multiply back to get full VND amount
      const fullAmount = amount * 1000
      return `${fullAmount.toLocaleString('vi-VN')} ₫`
    }
    return `$${amount}`
  }

  const getPropertyTypeIcon = (type: Property['propertyType']) => {
    switch (type) {
      case 'villa':
        return <HomeIcon className="w-4 h-4" />
      case 'apartment':
        return <HomeIcon className="w-4 h-4" />
      case 'hotel':
        return <HomeIcon className="w-4 h-4" />
      case 'resort':
        return <HomeIcon className="w-4 h-4" />
      case 'homestay':
        return <HomeIcon className="w-4 h-4" />
      default:
        return <HomeIcon className="w-4 h-4" />
    }
  }

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase()
    
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) {
      return <WifiIcon className="w-4 h-4" />
    }
    if (amenityLower.includes('điều hòa') || amenityLower.includes('air conditioning')) {
      return <div className="w-4 h-4 flex items-center justify-center text-blue-500">❄️</div>
    }
    if (amenityLower.includes('đậu xe') || amenityLower.includes('parking') || amenityLower.includes('garage')) {
     return <TruckIcon className="w-4 h-4" />
    }
    if (amenityLower.includes('bàn') || amenityLower.includes('desk')) {
      return <div className="w-4 h-4 flex items-center justify-center">🗂️</div>
    }
    if (amenityLower.includes('tủ lạnh') || amenityLower.includes('fridge')) {
      return <div className="w-4 h-4 flex items-center justify-center">🧊</div>
    }
    if (amenityLower.includes('báo khói') || amenityLower.includes('smoke')) {
      return <div className="w-4 h-4 flex items-center justify-center">🔥</div>
    }
    
    return <span className="w-4 h-4 text-center text-xs">•</span>
  }

  const renderStars = (rating: number, reviewCount: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    return (
      <div className="flex items-center text-sm font-medium">
        <div className="flex items-center mr-1">
          {[...Array(5)].map((_, index) => {
            if (index < fullStars) {
              return <StarSolidIcon key={index} className="w-4 h-4 text-yellow-400" />
            } else if (index === fullStars && hasHalfStar) {
              return <StarIcon key={index} className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
            } else {
              return <StarIcon key={index} className="w-4 h-4 text-gray-300" />
            }
          })}
        </div>
        <span className="text-gray-700">{rating > 0 ? rating.toFixed(1) : 'Mới'}</span>
        <span className="text-gray-500 ml-1">({reviewCount})</span>
      </div>
    )
  }

  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white">
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        {!imageError && property.thumbnail ? (
          <img
            src={property.thumbnail}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <HomeIcon className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Hình ảnh không có sẵn</p>
            </div>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsFavorited(!isFavorited)
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-200 shadow-lg"
        >
          {isFavorited ? (
            <HeartSolidIcon className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {property.isVerified && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
              Đã xác minh
            </span>
          )}
          {property.isSuperhost && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
              Chủ nhà xuất sắc
            </span>
          )}
        </div>

        {/* Property Type Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/90 text-gray-700 text-xs font-medium">
            {getPropertyTypeIcon(property.propertyType)}
            <span className="ml-1 capitalize">{property.propertyType}</span>
          </span>
        </div>

        {/* Quick actions on hover */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Button size="sm" className="shadow-lg">
            Xem chi tiết
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Location & Rating */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-gray-600 text-sm flex-1 mr-2">
            <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">
              {property.location.district && `${property.location.district}, `}
              {property.location.city}
            </span>
          </div>
          {renderStars(property.rating, property.reviewCount)}
        </div>

        {/* Title */}
        <Link href={`/properties/${property.id}`} className="block mb-3">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {property.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {property.description}
        </p>

        {/* Property details */}
        {showFullDetails && property.capacity && (
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <UserGroupIcon className="w-4 h-4 mr-1" />
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

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <span>👁️ {property.totalViews} lượt xem</span>
          </div>
          <div className="flex items-center">
            <span>💬 {property.reviewCount} đánh giá</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {property.amenities.slice(0, showFullDetails ? 6 : 3).map((amenity, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs"
            >
              {getAmenityIcon(amenity)}
              <span className="ml-1">{amenity}</span>
            </span>
          ))}
          {property.amenities.length > (showFullDetails ? 6 : 3) && (
            <span className="text-xs text-gray-500">
              +{property.amenities.length - (showFullDetails ? 6 : 3)} tiện ích khác
            </span>
          )}
        </div>

        {/* Price & Book button */}
        <div className="flex items-center justify-between">
          <div className="text-left">
            <div className="flex items-baseline">
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(property.price.amount, property.price.currency)}
              </span>
              <span className="text-gray-500 text-sm ml-1">/đêm</span>
            </div>
          </div>
          
          <Link href={`/properties/${property.id}`}>
            <Button 
              variant="outline" 
              size="sm"
              className="group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-200"
            >
              Đặt ngay
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
// components/FavoriteCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { FavoriteDto } from '@/types/main/favorite';
import { Heart, MapPin, Star, Calendar, Wifi, DollarSign } from 'lucide-react';

interface FavoriteCardProps {
  favorite: FavoriteDto;
  onRemove: (favoriteId: number) => void;
  isRemoving: boolean;
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({ 
  favorite, 
  onRemove, 
  isRemoving 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card click navigation
    if (!isRemoving) {
      onRemove(favorite.id);
    }
  };

  // Get proper image URL
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '/images/default-property.jpg';
    
    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If starts with /, combine with API base URL
    if (imagePath.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}${imagePath}`;
    }
    
    // Otherwise, add / and combine
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${imagePath}`;
  };

  const imageUrl = getImageUrl(favorite.propertyImage);

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-pink-100 group">
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={imageUrl}
          alt={favorite.propertyName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback to default image if loading fails
            const target = e.target as HTMLImageElement;
            target.src = '/images/default-property.jpg';
          }}
        />
        
        {/* Overlay với gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Heart Button */}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
        >
          <Heart 
            className={`h-5 w-5 transition-colors duration-200 ${
              isRemoving 
                ? 'text-gray-400' 
                : 'text-pink-500 fill-pink-500 group-hover/btn:text-pink-600'
            }`}
          />
        </button>

        {/* Product Type Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {favorite.productTypeName}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors duration-200 line-clamp-2">
            {favorite.propertyName}
          </h3>
          
          {/* Location */}
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-4 w-4 text-pink-500 mr-1 flex-shrink-0" />
            <span className="truncate">{favorite.communeName}, {favorite.provinceName}</span>
          </div>
        </div>

        {/* Amenities */}
        {favorite.amenities && favorite.amenities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center">
              <Star className="h-4 w-4 text-purple-500 mr-1" />
              Tiện nghi nổi bật
            </h4>
            <div className="space-y-1">
              {favorite.amenities.slice(0, 2).map((amenity) => (
                <div key={amenity.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    {amenity.name.toLowerCase().includes('điều hòa') && <span className="mr-2">❄️</span>}
                    {amenity.name.toLowerCase().includes('tủ lạnh') && <span className="mr-2">🧊</span>}
                    {amenity.name.toLowerCase().includes('wifi') && <Wifi className="h-3 w-3 mr-2 text-blue-500" />}
                    <span className="text-gray-700">{amenity.name}</span>
                  </div>
                  <div className="flex items-center">
                    {amenity.isFree ? (
                      <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded-full">
                        Miễn phí
                      </span>
                    ) : (
                      <DollarSign className="h-3 w-3 text-orange-500" />
                    )}
                  </div>
                </div>
              ))}
              {favorite.amenities.length > 2 && (
                <p className="text-xs text-gray-500 mt-1">
                  +{favorite.amenities.length - 2} tiện nghi khác
                </p>
              )}
            </div>
          </div>
        )}

        {/* Added Date and View Button */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-gray-500 text-xs">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Đã thêm: {formatDate(favorite.createdAt)}</span>
          </div>
          
          {/* View Button with Link */}
          <Link 
            href={`/properties/${favorite.slug}`}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 hover:shadow-md inline-block"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FavoriteCard;
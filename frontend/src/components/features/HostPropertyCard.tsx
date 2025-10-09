// components/features/PropertyCard.tsx

import React from 'react';
import { Property } from '@/types/main/hostproperty';

interface PropertyCardProps {
  property: Property;
  onAddRoom?: (propertyId: number) => void;
  onEdit?: (propertyId: number) => void;
  onDelete?: (propertyId: number) => void;
  onSubmitForReview?: (propertyId: number) => void;
  isDeleting?: boolean;
  isSubmitting?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onAddRoom, 
  onEdit, 
  onDelete,
  onSubmitForReview,
  isDeleting = false,
  isSubmitting = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'draft': return 'Bản nháp';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}${imagePath}`;
    }
    return imagePath;
  };

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isDraft = property.status.toLowerCase() === 'draft';
  const isActionDisabled = isDeleting || isSubmitting;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-pink-200 hover:border-pink-300">
      {/* Hình ảnh bất động sản */}
      <div className="relative h-48 w-full">
        {property.primaryImage ? (
          <img
            src={getImageUrl(property.primaryImage) || '/images/default-property.jpg'}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-200 via-purple-200 to-pink-300 flex items-center justify-center">
            <div className="text-pink-500">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Trạng thái */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
            {getStatusText(property.status)}
          </span>
        </div>

        {/* Nổi bật */}
        {property.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-lg">
              ⭐ Nổi bật
            </span>
          </div>
        )}

        {/* Số lượng ảnh */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black bg-opacity-60 text-white px-2 py-1 text-xs rounded-full backdrop-blur-sm">
            📸 {property.totalImages}
          </span>
        </div>
      </div>

      {/* Thông tin bất động sản */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 truncate flex-1 mr-2">
            {property.name}
          </h3>
          <div className="flex items-center space-x-1">
            {property.isActive ? (
              <span className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></span>
            ) : (
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            )}
            <span className="text-xs text-gray-500 font-medium">
              {property.isActive ? 'Hoạt động' : 'Tạm dừng'}
            </span>
          </div>
        </div>

        <p className="text-sm text-purple-600 font-semibold mb-2">{property.type}</p>
        <p className="text-sm text-gray-600 mb-3 truncate">
          📍 {property.addressDetail}, {property.commune}, {property.province}
        </p>

        {/* Giá */}
        <div className="mb-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {formatCurrency(property.priceFrom)}
          </span>
          <span className="text-sm text-gray-500 ml-1 font-medium">/đêm</span>
        </div>

        {/* Loại phòng & Tiện nghi */}
        <div className="flex justify-between items-center mb-3 text-sm">
          <div className="flex items-center text-gray-700 font-medium">
            <span className="mr-1">🏠</span>
            <span>{property.activeRoomTypes}/{property.totalRoomTypes} loại phòng</span>
          </div>
          <div className="flex items-center text-gray-700 font-medium">
            <span className="mr-1">✨</span>
            <span>{property.totalAmenities} tiện nghi</span>
          </div>
        </div>

        {/* Thống kê */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-center">
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-2 rounded-lg border border-pink-200">
            <div className="font-bold text-pink-600">{property.statistics.totalViews}</div>
            <div className="text-gray-600 font-medium">Lượt xem</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2 rounded-lg border border-purple-200">
            <div className="font-bold text-purple-600">{property.statistics.totalBookings}</div>
            <div className="text-gray-600 font-medium">Đặt phòng</div>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-purple-100 p-2 rounded-lg border border-pink-200">
            <div className="font-bold text-purple-600">
              {property.statistics.averageRating ? property.statistics.averageRating.toFixed(1) : '0.0'}
            </div>
            <div className="text-gray-600 font-medium">Đánh giá</div>
          </div>
        </div>

        {/* Doanh thu */}
        <div className="mb-3 p-3 bg-gradient-to-r from-pink-100 via-purple-100 to-pink-100 rounded-lg border border-pink-200">
          <div className="text-xs text-gray-700 font-semibold mb-1">Tổng doanh thu</div>
          <div className="font-bold text-lg bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {formatCurrency(property.statistics.totalRevenue)}
          </div>
        </div>

        {/* Ngày tạo & cập nhật */}
        <div className="flex justify-between items-center text-xs text-gray-500 mb-3 pb-3 border-b border-pink-100">
          <span className="font-medium">Tạo: {formatDate(property.createdAt)}</span>
          <span className="font-medium">Cập nhật: {formatDate(property.updatedAt)}</span>
        </div>

        {/* Nút Gửi duyệt (chỉ hiện khi status là draft) */}
        {isDraft && onSubmitForReview && (
          <div className="mb-3">
            <button
              onClick={() => onSubmitForReview(property.id)}
              disabled={isActionDisabled}
              className={`w-full px-4 py-3 text-sm font-bold rounded-lg transition-all shadow-md ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang gửi...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Gửi duyệt
                </span>
              )}
            </button>
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex gap-2">
          {onAddRoom && (
            <button
              onClick={() => onAddRoom(property.id)}
              disabled={isActionDisabled}
              className="flex-1 px-3 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Phòng
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={() => onEdit(property.id)}
              disabled={isActionDisabled}
              className="flex-1 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sửa
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(property.id)}
              disabled={isActionDisabled}
              className={`flex-1 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all shadow-md ${
                isActionDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 hover:shadow-lg'
              }`}
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
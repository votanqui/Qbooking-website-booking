'use client'

import { useState, useEffect } from 'react'
import { reviewService } from '@/services/main/review.service'
import { ReviewResponse } from '@/types/main/review'
import { useToast } from '@/components/ui/Toast'
import { 
  Star, 
  X, 
  Calendar, 
  MapPin, 
  User, 
  MessageSquare, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye, 
  AlertCircle
} from 'lucide-react'

interface ReviewDetailModalProps {
  isOpen: boolean
  onClose: () => void
  reviewId: number | null
  onEdit?: (reviewId: number) => void
  onDelete?: (reviewId: number) => void
}

export function ReviewDetailModal({ 
  isOpen, 
  onClose, 
  reviewId,
  onEdit,
  onDelete 
}: ReviewDetailModalProps) {
  const { showToast } = useToast()
  const [review, setReview] = useState<ReviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showImageGallery, setShowImageGallery] = useState(false)

  // Chặn scroll của body khi modal mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && reviewId) {
      fetchReviewDetail()
    } else {
      setReview(null)
    }
  }, [isOpen, reviewId])

  const fetchReviewDetail = async () => {
    if (!reviewId) return

    setLoading(true)
    try {
      const response = await reviewService.getMyReviewById(reviewId)

      if (response.success && response.data) {
        setReview(response.data)
      } else {
        showToast(response.message || 'Không thể tải thông tin đánh giá', 'error')
        onClose()
      }
    } catch (err) {
      showToast('Lỗi khi tải thông tin đánh giá', 'error')
      console.error('Error fetching review:', err)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}${imageUrl}`
    }
    return imageUrl
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const handlePrevImage = () => {
    if (review?.images) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? review.images.length - 1 : prev - 1
      )
    }
  }

  const handleNextImage = () => {
    if (review?.images) {
      setSelectedImageIndex((prev) => 
        prev === review.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Main Modal */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-3xl max-w-4xl w-full my-8 shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header - Fixed */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 rounded-t-3xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  Chi tiết đánh giá
                </h2>
                {review && (
                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <Calendar className="w-4 h-4" />
                    {formatDate(review.createdAt)}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : review ? (
              <div className="p-6 space-y-6">
                {/* Property Info */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {review.property?.name}
                      </h3>
                      {review.property?.slug && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {review.property.slug}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {review.isVerified && (
                        <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Đã xác minh
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overall Rating */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Đánh giá tổng quan</h4>
                    <div className="flex items-center gap-2">
                      {renderStars(review.overallRating)}
                      <span className="text-2xl font-bold text-gray-900 ml-2">
                        {review.overallRating}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Ratings */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {review.cleanlinessRating && (
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-xs text-gray-600 mb-2">Vệ sinh</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.cleanlinessRating)}
                        </div>
                      </div>
                    )}
                    {review.locationRating && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
                        <p className="text-xs text-gray-600 mb-2">Vị trí</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.locationRating)}
                        </div>
                      </div>
                    )}
                    {review.serviceRating && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
                        <p className="text-xs text-gray-600 mb-2">Dịch vụ</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.serviceRating)}
                        </div>
                      </div>
                    )}
                    {review.valueRating && (
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 border border-yellow-100">
                        <p className="text-xs text-gray-600 mb-2">Giá trị</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.valueRating)}
                        </div>
                      </div>
                    )}
                    {review.amenitiesRating && (
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-3 border border-indigo-100">
                        <p className="text-xs text-gray-600 mb-2">Tiện nghi</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.amenitiesRating)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  {review.title && (
                    <h4 className="text-xl font-bold text-gray-900 mb-3">
                      {review.title}
                    </h4>
                  )}
                  
                  {review.reviewText && (
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {review.reviewText}
                    </p>
                  )}

                  {/* Pros & Cons */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {review.pros && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                          <Sparkles className="w-4 h-4 mr-1" />
                          Ưu điểm
                        </h5>
                        <p className="text-sm text-gray-700">{review.pros}</p>
                      </div>
                    )}
                    {review.cons && (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <h5 className="font-semibold text-red-800 mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Nhược điểm
                        </h5>
                        <p className="text-sm text-gray-700">{review.cons}</p>
                      </div>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {review.travelType && (
                      <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs">
                        {review.travelType}
                      </span>
                    )}
                    {review.roomStayed && (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
                        Phòng: {review.roomStayed}
                      </span>
                    )}
                    {review.isAnonymous && (
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                        Đánh giá ẩn danh
                      </span>
                    )}
                  </div>
                </div>

                {/* Images */}
                {review.images && review.images.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Hình ảnh ({review.images.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {review.images.map((image, index) => (
                        <div
                          key={image.id}
                          onClick={() => {
                            setSelectedImageIndex(index)
                            setShowImageGallery(true)
                          }}
                          className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 border-gray-200 hover:border-pink-300 transition-all"
                        >
                          <img
                            src={getImageUrl(image.imageUrl)}
                            alt={`Review ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Host Reply */}
                {review.hostReply && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Phản hồi từ chủ nhà
                        </h4>
                        <p className="text-gray-700 leading-relaxed mb-2">
                          {review.hostReply}
                        </p>
                        {review.hostRepliedAt && (
                          <p className="text-xs text-gray-600">
                            {formatDate(review.hostRepliedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (onEdit && review) {
                        onEdit(review.id)
                        onClose()
                      }
                    }}
                    className="flex-1 min-w-[140px] px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      if (onDelete && review) {
                        onDelete(review.id)
                        onClose()
                      }
                    }}
                    className="flex-1 min-w-[140px] px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    Xóa đánh giá
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && review?.images && review.images.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <button
            onClick={() => setShowImageGallery(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={handlePrevImage}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={handleNextImage}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          <div className="max-w-4xl w-full">
            <img
              src={getImageUrl(review.images[selectedImageIndex].imageUrl)}
              alt={`Review ${selectedImageIndex + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
            <div className="text-center mt-4 text-white">
              <p className="text-sm">
                {selectedImageIndex + 1} / {review.images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
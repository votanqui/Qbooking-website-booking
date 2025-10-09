'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { reviewService } from '@/services/main/review.service'
import { ReviewResponse, ReviewListResponse } from '@/types/main/review'
import { useToast } from '@/components/ui/Toast'
import { Star, Edit2, Trash2, Eye, Calendar, MapPin, User, Image as ImageIcon, MessageSquare, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { ReviewDetailModal } from '@/components/modals/ReviewDetailModal'
import { ReviewEditModal } from '@/components/modals/ReviewEditModal'

export default function MyReviewsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [reviews, setReviews] = useState<ReviewListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'with-reply' | 'without-reply'>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedEditReviewId, setSelectedEditReviewId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  useEffect(() => {
    fetchReviews()
  }, [page, selectedFilter])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const hasHostReply = selectedFilter === 'with-reply' ? true : selectedFilter === 'without-reply' ? false : undefined
      
      const response = await reviewService.getMyReviews({
        page,
        pageSize,
        hasHostReply,
        sortBy: 'CreatedAt',
        sortOrder: 'desc'
      })

      if (response.success && response.data) {
        setReviews(response.data)
      } else {
        showToast(response.message || 'Không thể tải danh sách đánh giá', 'error')
      }
    } catch (err) {
      showToast('Lỗi khi tải danh sách đánh giá', 'error')
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId: number) => {
    try {
      const response = await reviewService.deleteReview(reviewId)
      
      if (response.success) {
        showToast('Đã xóa đánh giá thành công', 'success')
        setDeleteConfirm(null)
        fetchReviews()
      } else {
        showToast(response.message || 'Không thể xóa đánh giá', 'error')
      }
    } catch (err) {
      showToast('Lỗi khi xóa đánh giá', 'error')
      console.error('Error deleting review:', err)
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
      day: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Đánh giá của tôi
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Quản lý tất cả đánh giá của bạn về các lần lưu trú
          </p>
        </div>

        {/* Stats Cards */}
        {reviews && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-pink-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tổng đánh giá</p>
                  <p className="text-2xl font-bold text-gray-900">{reviews.totalCount}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-pink-500" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-green-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Có phản hồi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reviews.reviews.filter(r => r.hostReply).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã xác minh</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reviews.reviews.filter(r => r.isVerified).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 mb-6 border border-pink-100 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedFilter('all')
                setPage(1)
              }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedFilter === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => {
                setSelectedFilter('with-reply')
                setPage(1)
              }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedFilter === 'with-reply'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Có phản hồi
            </button>
            <button
              onClick={() => {
                setSelectedFilter('without-reply')
                setPage(1)
              }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedFilter === 'without-reply'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Chưa phản hồi
            </button>
          </div>
        </div>

        {/* Reviews List */}
        {reviews && reviews.reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Property Info Header */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 border-b border-pink-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">
                        {review.property?.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(review.createdAt)}
                        </div>
                        {review.isVerified && (
                          <span className="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Đã xác minh
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(review.overallRating)}
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="p-4">
                  {review.title && (
                    <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                  )}
                  
                  {review.reviewText && (
                    <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                      {review.reviewText}
                    </p>
                  )}

                  {/* Rating Details */}
                  {(review.cleanlinessRating || review.locationRating || review.serviceRating) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                      {review.cleanlinessRating && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-1">Vệ sinh</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold">{review.cleanlinessRating}</span>
                          </div>
                        </div>
                      )}
                      {review.locationRating && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-1">Vị trí</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold">{review.locationRating}</span>
                          </div>
                        </div>
                      )}
                      {review.serviceRating && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 mb-1">Dịch vụ</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold">{review.serviceRating}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                      {review.images.slice(0, 4).map((image) => (
                        <div key={image.id} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={getImageUrl(image.imageUrl)}
                            alt="Review"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {review.images.length > 4 && (
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <span className="text-xs text-gray-600">+{review.images.length - 4}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Host Reply */}
                  {review.hostReply && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 mb-3 border border-blue-100">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-blue-600 mb-1">
                            Phản hồi từ chủ nhà
                          </p>
                          <p className="text-sm text-gray-700">{review.hostReply}</p>
                          {review.hostRepliedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(review.hostRepliedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
<button
  onClick={() => {
    setSelectedReviewId(review.id)
    setShowDetailModal(true)
  }}
  className="flex items-center gap-1 px-3 py-2 text-sm bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 rounded-lg hover:from-pink-100 hover:to-purple-100 transition-all duration-200 border border-pink-200"
>
  <Eye className="w-4 h-4" />
  Xem chi tiết
</button>
                    
                 <button
  onClick={() => {
    setSelectedEditReviewId(review.id)
    setShowEditModal(true)
  }}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200 border border-blue-200"
                    >
                      <Edit2 className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                    
                    {deleteConfirm === review.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="flex items-center gap-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
                        >
                          Xác nhận xóa
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(review.id)}
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có đánh giá nào
            </h3>
            <p className="text-gray-600 text-sm">
              Bạn chưa có đánh giá nào. Hãy đặt phòng và trải nghiệm để có thể đánh giá!
            </p>
          </div>
        )}

        {/* Pagination */}
        {reviews && reviews.totalPages > 1 && (
          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-pink-100 shadow-sm">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!reviews.hasPreviousPage}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  reviews.hasPreviousPage
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trang trước</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Trang <span className="font-semibold text-gray-900">{reviews.page}</span> / {reviews.totalPages}
                </span>
              </div>

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!reviews.hasNextPage}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  reviews.hasNextPage
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="hidden sm:inline">Trang sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      <ReviewDetailModal
  isOpen={showDetailModal}
  onClose={() => {
    setShowDetailModal(false)
    setSelectedReviewId(null)
  }}
  reviewId={selectedReviewId}
  onEdit={(id) => router.push(`/customer/reviews/${id}/edit`)}
  onDelete={(id) => setDeleteConfirm(id)}
/>
<ReviewEditModal
  isOpen={showEditModal}
  onClose={() => {
    setShowEditModal(false)
    setSelectedEditReviewId(null)
  }}
  reviewId={selectedEditReviewId}
  onSuccess={() => {
    fetchReviews()
  }}
/>
    </div>
    
  )
}
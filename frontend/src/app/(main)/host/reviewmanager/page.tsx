'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { userService } from '@/services/main/user.service'
import { reviewService } from '@/services/main/review.service'
import { UserProfile } from '@/types/main/user'
import { 
  ReviewResponse, 
  HostPropertyReviewsResponse,
  ReviewFilterRequest 
} from '@/types/main/review'

export default function ReviewManagerPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [properties, setProperties] = useState<HostPropertyReviewsResponse[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [totalReviews, setTotalReviews] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRating, setFilterRating] = useState<number>(0)
  const [hasHostReply, setHasHostReply] = useState<boolean | undefined>(undefined)
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({})
  const [editingReply, setEditingReply] = useState<number | null>(null)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    checkHostPermission()
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      loadProperties()
    }
  }, [isAuthorized])

  useEffect(() => {
    if (selectedPropertyId) {
      loadReviews()
    }
  }, [selectedPropertyId, currentPage, filterStatus, filterRating, hasHostReply])

  const checkHostPermission = async () => {
    try {
      setIsLoading(true)
      const response = await userService.getProfile()
      
      if (response.success && response.data) {
        setUserProfile(response.data)
        setIsLoggedIn(true)
        
        if (response.data.role && response.data.role.toLowerCase() === 'host') {
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
        }
      } else {
        setIsLoggedIn(false)
        setIsAuthorized(false)
      }
    } catch (error) {
      console.error('Error checking host permission:', error)
      setIsLoggedIn(false)
      setIsAuthorized(false)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProperties = async () => {
    try {
      const response = await reviewService.getMyPropertiesReviews()
      if (response.success && response.data) {
        setProperties(response.data)
        if (response.data.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(response.data[0].propertyId)
        }
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }

  const loadReviews = async () => {
    if (!selectedPropertyId) return
    
    try {
      setLoadingReviews(true)
      const params: ReviewFilterRequest = {
        page: currentPage,
        pageSize: 10,
        status: filterStatus === 'all' ? undefined : filterStatus,
        minRating: filterRating > 0 ? filterRating : undefined,
        hasHostReply: hasHostReply,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
      
      const response = await reviewService.getMyPropertyReviews(selectedPropertyId, params)
      if (response.success && response.data) {
        setReviews(response.data.reviews)
        setTotalReviews(response.data.totalCount)
        setTotalPages(response.data.totalPages)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleAddReply = async (reviewId: number) => {
    if (!replyText[reviewId]?.trim()) return
    
    try {
      setActionLoading(reviewId)
      const response = await reviewService.addHostReply(reviewId, {
        hostReply: replyText[reviewId]
      })
      
      if (response.success) {
        setReplyText({ ...replyText, [reviewId]: '' })
        loadReviews()
      }
    } catch (error) {
      console.error('Error adding reply:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateReply = async (reviewId: number) => {
    if (!replyText[reviewId]?.trim()) return
    
    try {
      setActionLoading(reviewId)
      const response = await reviewService.updateHostReply(reviewId, {
        hostReply: replyText[reviewId]
      })
      
      if (response.success) {
        setEditingReply(null)
        setReplyText({ ...replyText, [reviewId]: '' })
        loadReviews()
      }
    } catch (error) {
      console.error('Error updating reply:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteReply = async (reviewId: number) => {
    if (!confirm('Bạn có chắc muốn xóa phản hồi này?')) return
    
    try {
      setActionLoading(reviewId)
      const response = await reviewService.deleteHostReply(reviewId)
      
      if (response.success) {
        loadReviews()
      }
    } catch (error) {
      console.error('Error deleting reply:', error)
    } finally {
      setActionLoading(null)
    }
  }
  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}${imageUrl}`
    }
    return imageUrl
  }
  const startEditReply = (reviewId: number, currentReply: string) => {
    setEditingReply(reviewId)
    setReplyText({ ...replyText, [reviewId]: currentReply })
  }

  const cancelEdit = (reviewId: number) => {
    setEditingReply(null)
    setReplyText({ ...replyText, [reviewId]: '' })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-600 text-lg font-medium">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-sm p-12 rounded-3xl border border-purple-200 shadow-2xl max-w-md">
          <div className="text-6xl mb-6">🔮</div>
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {isLoggedIn ? 'Vùng Cấm Địa' : 'Cổng Bí Mật'}
          </h2>
          <p className="text-gray-600 mb-8">
            {isLoggedIn ? (
              <>Chỉ <span className="font-semibold text-purple-600">Chủ Nhà</span> mới có quyền truy cập...</>
            ) : (
              <>Vui lòng <span className="font-semibold text-purple-600">đăng nhập</span> để tiếp tục</>
            )}
          </p>
          <button
            onClick={() => router.push(isLoggedIn ? '/profile?tab=upgrade' : '/auth/login')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
          >
            {isLoggedIn ? '✨ Thăng Cấp Thành Host' : '🔑 Đăng Nhập Ngay'}
          </button>
        </div>
      </div>
    )
  }

  const selectedProperty = properties.find(p => p.propertyId === selectedPropertyId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">📝 Quản Lý Đánh Giá</h1>
          <p className="text-purple-100">Quản lý và phản hồi đánh giá từ khách hàng</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Property Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {properties.map((property) => (
            <div
              key={property.propertyId}
              onClick={() => setSelectedPropertyId(property.propertyId)}
              className={`p-6 rounded-2xl cursor-pointer transition-all transform hover:scale-105 ${
                selectedPropertyId === property.propertyId
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl'
                  : 'bg-white text-gray-700 hover:shadow-lg'
              }`}
            >
              <h3 className="font-semibold text-lg mb-3 truncate">{property.propertyName}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={selectedPropertyId === property.propertyId ? 'text-purple-100' : 'text-gray-500'}>
                    Tổng đánh giá:
                  </span>
                  <span className="font-bold">{property.totalReviews}</span>
                </div>
                <div className="flex justify-between">
                  <span className={selectedPropertyId === property.propertyId ? 'text-purple-100' : 'text-gray-500'}>
                    Đã phản hồi:
                  </span>
                  <span className="font-bold">{property.reviewsWithReply}</span>
                </div>
                <div className="flex justify-between">
                  <span className={selectedPropertyId === property.propertyId ? 'text-purple-100' : 'text-gray-500'}>
                    Chờ phản hồi:
                  </span>
                  <span className="font-bold">{property.pendingReviews}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                  <span className={selectedPropertyId === property.propertyId ? 'text-purple-100' : 'text-gray-500'}>
                    Điểm TB:
                  </span>
                  <div className="flex items-center">
                    <span className="text-2xl mr-1">⭐</span>
                    <span className="font-bold text-xl">{property.averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        {selectedPropertyId && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Bộ Lọc</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Tất cả</option>
                  <option value="published">Đã xuất bản</option>
                  <option value="pending">Chờ duyệt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá tối thiểu</label>
                <select
                  value={filterRating}
                  onChange={(e) => {
                    setFilterRating(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={0}>Tất cả</option>
                  <option value={5}>⭐ 5 sao</option>
                  <option value={4}>⭐ 4 sao trở lên</option>
                  <option value={3}>⭐ 3 sao trở lên</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phản hồi</label>
                <select
                  value={hasHostReply === undefined ? 'all' : hasHostReply ? 'yes' : 'no'}
                  onChange={(e) => {
                    const val = e.target.value
                    setHasHostReply(val === 'all' ? undefined : val === 'yes')
                    setCurrentPage(1)
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Tất cả</option>
                  <option value="yes">Đã phản hồi</option>
                  <option value="no">Chưa phản hồi</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {selectedPropertyId && (
          <div className="space-y-4">
            {loadingReviews ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-purple-600">Đang tải đánh giá...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg">Chưa có đánh giá nào</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                        {review.customer?.fullName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {review.isAnonymous ? 'Khách ẩn danh' : review.customer?.fullName}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{new Date(review.createdAt || '').toLocaleDateString('vi-VN')}</span>
                          {review.isVerified && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              ✓ Đã xác thực
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-yellow-500 text-xl">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < review.overallRating ? '⭐' : '☆'}</span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{review.overallRating}/5</span>
                    </div>
                  </div>

                  {/* Review Content */}
                  {review.title && (
                    <h4 className="font-semibold text-gray-800 mb-2">{review.title}</h4>
                  )}
                  {review.reviewText && (
                    <p className="text-gray-600 mb-4">{review.reviewText}</p>
                  )}

                  {/* Detailed Ratings */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
                    {review.cleanlinessRating && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Vệ sinh:</span>
                        <span className="font-medium">⭐ {review.cleanlinessRating}</span>
                      </div>
                    )}
                    {review.locationRating && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Vị trí:</span>
                        <span className="font-medium">⭐ {review.locationRating}</span>
                      </div>
                    )}
                    {review.serviceRating && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Dịch vụ:</span>
                        <span className="font-medium">⭐ {review.serviceRating}</span>
                      </div>
                    )}
                  </div>

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex space-x-2 mb-4 overflow-x-auto">
                      {review.images.map((img) => (
                        <img
                          key={img.id}
                          src={getImageUrl(img.imageUrl)}                                
                          alt="Review"
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {/* Host Reply Section */}
                  {review.hostReply && editingReply !== review.id ? (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-600">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-purple-800">📢 Phản hồi của bạn:</span>
                          <span className="text-xs text-gray-500">
                            {new Date(review.hostRepliedAt || '').toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditReply(review.id, review.hostReply || '')}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteReply(review.id)}
                            disabled={actionLoading === review.id}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.hostReply}</p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <textarea
                        value={replyText[review.id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                        placeholder="Viết phản hồi của bạn..."
                        className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        {editingReply === review.id && (
                          <button
                            onClick={() => cancelEdit(review.id)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Hủy
                          </button>
                        )}
                        <button
                          onClick={() => editingReply === review.id ? handleUpdateReply(review.id) : handleAddReply(review.id)}
                          disabled={actionLoading === review.id || !replyText[review.id]?.trim()}
                          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {actionLoading === review.id ? '⏳' : editingReply === review.id ? '💾 Cập nhật' : '📤 Gửi phản hồi'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white border border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50"
            >
              ← Trước
            </button>
            <span className="px-4 py-2 text-gray-700">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white border border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
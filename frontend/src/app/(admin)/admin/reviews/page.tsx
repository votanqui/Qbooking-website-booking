'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { DatePickerModal } from '@/components/ui/DatePickerModal'
import { adminReviewService } from '@/services/admin/adminreview.service'
import { 
  AdminReviewFilterRequest, 
  ReviewResponse, 
  ReviewListResponse,
  ReviewStatisticsResponse,
  ReviewTrendResponse,
  TopPropertyResponse,
  RatingDistributionResponse,
  HostResponseStatisticsResponse
} from '@/types/admin/adminreview'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export default function AdminReviewPage() {
  const { showToast } = useToast()
  
  // States
  const [activeTab, setActiveTab] = useState<'reviews' | 'statistics'>('reviews')
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  })

  // Filter states
  const [filters, setFilters] = useState<Partial<AdminReviewFilterRequest>>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // Statistics states
  const [statistics, setStatistics] = useState<ReviewStatisticsResponse | null>(null)
  const [trends, setTrends] = useState<ReviewTrendResponse[]>([])
  const [topProperties, setTopProperties] = useState<TopPropertyResponse[]>([])
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistributionResponse | null>(null)
  const [hostResponseStats, setHostResponseStats] = useState<HostResponseStatisticsResponse | null>(null)

  // Modal states
  const [isDateModalOpen, setIsDateModalOpen] = useState(false)
  const [dateModalType, setDateModalType] = useState<'fromDate' | 'toDate'>('fromDate')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedReview, setSelectedReview] = useState<ReviewResponse | null>(null)
  const [showReviewDetail, setShowReviewDetail] = useState(false)

  // Load reviews
  const loadReviews = async () => {
    setLoading(true)
    try {
      const response = await adminReviewService.getAllReviews(filters as AdminReviewFilterRequest)
      if (response.success && response.data) {
        setReviews(response.data.reviews)
        setPagination({
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalCount: response.data.totalCount,
          totalPages: response.data.totalPages
        })
      } else {
        showToast(response.message || 'Failed to load reviews', 'error')
      }
    } catch (error) {
      showToast('Error loading reviews', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load statistics
  const loadStatistics = async () => {
    setLoading(true)
    try {
      const [statsRes, trendsRes, topPropsRes, ratingDistRes, hostResRes] = await Promise.all([
        adminReviewService.getReviewStatistics({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          propertyId: filters.propertyId
        }),
        adminReviewService.getReviewTrends({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          propertyId: filters.propertyId,
          groupBy: 'day'
        }),
        adminReviewService.getTopRatedProperties({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          limit: 5
        }),
        adminReviewService.getRatingDistribution({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          propertyId: filters.propertyId
        }),
        adminReviewService.getHostResponseStatistics({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          propertyId: filters.propertyId
        })
      ])

      if (statsRes.success && statsRes.data) setStatistics(statsRes.data)
      if (trendsRes.success && trendsRes.data) setTrends(trendsRes.data)
      if (topPropsRes.success && topPropsRes.data) setTopProperties(topPropsRes.data)
      if (ratingDistRes.success && ratingDistRes.data) setRatingDistribution(ratingDistRes.data)
      if (hostResRes.success && hostResRes.data) setHostResponseStats(hostResRes.data)
    } catch (error) {
      showToast('Error loading statistics', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'reviews') {
      loadReviews()
    } else {
      loadStatistics()
    }
  }, [activeTab, filters.page])

  // Actions
  const handleToggleFeatured = async (reviewId: number) => {
    try {
      const response = await adminReviewService.toggleFeaturedStatus(reviewId)
      if (response.success) {
        showToast('Featured status updated', 'success')
        loadReviews()
      } else {
        showToast(response.message || 'Failed to update', 'error')
      }
    } catch (error) {
      showToast('Error updating featured status', 'error')
    }
  }

  const handleUpdateStatus = async (reviewId: number, status: 'published' | 'hidden') => {
    try {
      const response = await adminReviewService.updateReviewStatus(reviewId, { status })
      if (response.success) {
        showToast(`Review ${status}`, 'success')
        loadReviews()
      } else {
        showToast(response.message || 'Failed to update', 'error')
      }
    } catch (error) {
      showToast('Error updating status', 'error')
    }
  }

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    
    try {
      const response = await adminReviewService.deleteReview(reviewId)
      if (response.success) {
        showToast('Review deleted', 'success')
        loadReviews()
      } else {
        showToast(response.message || 'Failed to delete', 'error')
      }
    } catch (error) {
      showToast('Error deleting review', 'error')
    }
  }

  const handleDeleteHostReply = async (reviewId: number) => {
    if (!confirm('Delete host reply?')) return
    
    try {
      const response = await adminReviewService.deleteHostReply(reviewId)
      if (response.success) {
        showToast('Host reply deleted', 'success')
        loadReviews()
      } else {
        showToast(response.message || 'Failed to delete', 'error')
      }
    } catch (error) {
      showToast('Error deleting host reply', 'error')
    }
  }

  const handleDateSelect = (date: string) => {
    if (dateModalType === 'fromDate') {
      setFilters(prev => ({ ...prev, fromDate: new Date(date) }))
    } else {
      setFilters(prev => ({ ...prev, toDate: new Date(date) }))
    }
  }

  const applyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }))
    if (activeTab === 'reviews') {
      loadReviews()
    } else {
      loadStatistics()
    }
    setShowFilters(false)
  }

  const resetFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold">Review Management</h1>
          <p className="text-purple-100 mt-1">Manage and analyze customer reviews</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'reviews'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'statistics'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Statistics
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'reviews' ? (
          <>
            {/* Filter Button */}
            <div className="mb-4 flex justify-between items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
              <div className="text-sm text-gray-600">
                Total: {pagination.totalCount} reviews
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mb-6 bg-white rounded-xl shadow-md p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={filters.searchText || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
                  </select>

                  <select
                    value={filters.minRating || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Min Rating</option>
                    {[1, 2, 3, 4, 5].map(r => (
                      <option key={r} value={r}>{r}★</option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setDateModalType('fromDate')
                      setIsDateModalOpen(true)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                  >
                    {filters.fromDate ? new Date(filters.fromDate).toLocaleDateString() : 'From Date'}
                  </button>

                  <button
                    onClick={() => {
                      setDateModalType('toDate')
                      setIsDateModalOpen(true)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                  >
                    {filters.toDate ? new Date(filters.toDate).toLocaleDateString() : 'To Date'}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={applyFilters}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={resetFilters}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Reviews List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-500">No reviews found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {review.customer?.avatar && (
                              <img 
                                src={`${API_BASE_URL}${review.customer.avatar}`} 
                                alt="" 
                                className="w-10 h-10 rounded-full object-cover" 
                              />
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {review.isAnonymous ? 'Anonymous' : review.customer?.fullName}
                              </h3>
                              <p className="text-sm text-gray-500">{review.property?.name}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-5 h-5 ${i < review.overallRating ? 'fill-current' : 'fill-gray-300'}`} viewBox="0 0 20 20">
                                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">{review.overallRating.toFixed(1)}</span>
                            {review.isVerified && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Verified</span>
                            )}
                            {review.isFeatured && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Featured</span>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-gray-500">
                          {review.createdAt && new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Content */}
                      {review.title && (
                        <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                      )}
                      {review.reviewText && (
                        <p className="text-gray-700 mb-3 line-clamp-3">{review.reviewText}</p>
                      )}

                      {/* Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                          {review.images.map(img => (
                            <img 
                              key={img.id} 
                              src={`${API_BASE_URL}${img.imageUrl}`} 
                              alt="" 
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                              onClick={() => window.open(`${API_BASE_URL}${img.imageUrl}`, '_blank')}
                            />
                          ))}
                        </div>
                      )}

                      {/* Host Reply */}
                      {review.hostReply && (
                        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-purple-900 mb-1">Host Response</p>
                              <p className="text-sm text-gray-700">{review.hostReply}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteHostReply(review.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleFeatured(review.id)}
                          className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                        >
                          {review.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(review.id, review.status === 'published' ? 'hidden' : 'published')}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          {review.status === 'published' ? 'Hide' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Statistics View */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview Stats */}
                {statistics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                      <p className="text-3xl font-bold text-purple-600">{statistics.totalReviews}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
                      <p className="text-3xl font-bold text-pink-600">{statistics.averageOverallRating.toFixed(1)}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <p className="text-sm text-gray-600 mb-1">Reply Rate</p>
                      <p className="text-3xl font-bold text-purple-600">{statistics.hostReplyRate.toFixed(0)}%</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <p className="text-sm text-gray-600 mb-1">Featured</p>
                      <p className="text-3xl font-bold text-pink-600">{statistics.featuredReviews}</p>
                    </div>
                  </div>
                )}

                {/* Rating Distribution */}
                {ratingDistribution && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const count = ratingDistribution[`${['five', 'four', 'three', 'two', 'one'][5 - stars]}Stars` as keyof RatingDistributionResponse] as number || 0
                        const percentage = ratingDistribution[`${['five', 'four', 'three', 'two', 'one'][5 - stars]}StarsPercentage` as keyof RatingDistributionResponse] as number || 0
                        
                        return (
                          <div key={stars} className="flex items-center gap-3">
                            <span className="text-sm font-medium w-12">{stars}★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-20 text-right">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Top Properties */}
                {topProperties.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Rated Properties</h3>
                    <div className="space-y-3">
                      {topProperties.map((prop, idx) => (
                        <div key={prop.propertyId} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{prop.propertyName}</p>
                              <p className="text-sm text-gray-600">{prop.totalReviews} reviews</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-purple-600">{prop.averageRating.toFixed(1)}★</p>
                            <p className="text-xs text-gray-500">{prop.hostReplyRate.toFixed(0)}% reply</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Host Response Stats */}
                {hostResponseStats && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Host Response Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Avg Response Time</p>
                        <p className="text-2xl font-bold text-purple-600">{hostResponseStats.averageResponseTimeHours.toFixed(0)}h</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Within 24h</p>
                        <p className="text-2xl font-bold text-pink-600">{hostResponseStats.responseWithin24Hours}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Within 48h</p>
                        <p className="text-2xl font-bold text-purple-600">{hostResponseStats.responseWithin48Hours}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Within 7 days</p>
                        <p className="text-2xl font-bold text-pink-600">{hostResponseStats.responseWithin7Days}</p>
                      </div>
                    </div>
                    
                    {hostResponseStats.topRespondingHosts.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Top Responding Hosts</p>
                        <div className="space-y-2">
                          {hostResponseStats.topRespondingHosts.map(host => (
                            <div key={host.hostId} className="flex justify-between items-center p-2 bg-purple-50 rounded">
                              <span className="text-sm font-medium">{host.hostName}</span>
                              <span className="text-sm text-purple-600">{host.replyRate.toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        selectedDate={dateModalType === 'fromDate' 
          ? filters.fromDate?.toISOString().split('T')[0] 
          : filters.toDate?.toISOString().split('T')[0]
        }
        onDateSelect={handleDateSelect}
        title={dateModalType === 'fromDate' ? 'Select From Date' : 'Select To Date'}
      />
    </div>
  )
}
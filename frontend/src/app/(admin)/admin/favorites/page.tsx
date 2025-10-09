'use client'

import { useState, useEffect } from 'react'
import { adminFavoriteService } from '@/services/admin/adminfavorite.service'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import {
  AdminFavoriteDto,
  FavoriteStatisticsDto,
  TopFavoritePropertyDto,
  TopFavoriteUserDto,
  FavoriteTimelineDto,
  FavoriteDto
} from '@/types/admin/adminfavorite'
import { DatePickerModal } from '@/components/ui/DatePickerModal'

// Main Component wrapped with ToastProvider
export default function AdminFavoritesPage() {
  return (
    <ToastProvider>
      <AdminFavoritesContent />
    </ToastProvider>
  )
}

function AdminFavoritesContent() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'overview' | 'all' | 'properties' | 'users' | 'timeline' | 'userFavorites'>('overview')
  const [loading, setLoading] = useState(false)
  
  // States for different data
  const [statistics, setStatistics] = useState<FavoriteStatisticsDto | null>(null)
  const [allFavorites, setAllFavorites] = useState<AdminFavoriteDto[]>([])
  const [topProperties, setTopProperties] = useState<TopFavoritePropertyDto[]>([])
  const [topUsers, setTopUsers] = useState<TopFavoriteUserDto[]>([])
  const [timeline, setTimeline] = useState<FavoriteTimelineDto[]>([])
  const [userFavorites, setUserFavorites] = useState<FavoriteDto[]>([])
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null)
  const [showUserFavoritesModal, setShowUserFavoritesModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  
  // Filters
  const [topLimit, setTopLimit] = useState(10)
  const [timelineGroupBy, setTimelineGroupBy] = useState<'day' | 'week' | 'month'>('day')
  
  // Date picker states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)

  useEffect(() => {
    loadStatistics()
  }, [])

  useEffect(() => {
    if (activeTab === 'all') loadAllFavorites()
    else if (activeTab === 'properties') loadTopProperties()
    else if (activeTab === 'users') loadTopUsers()
    else if (activeTab === 'timeline') loadTimeline()
  }, [activeTab, currentPage, topLimit, timelineGroupBy, startDate, endDate])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const response = await adminFavoriteService.getStatistics()
      if (response.success && response.data) {
        setStatistics(response.data)
      } else {
        showToast(response.message || 'Không thể tải thống kê', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải thống kê', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadAllFavorites = async () => {
    setLoading(true)
    try {
      const response = await adminFavoriteService.getAllFavorites({ page: currentPage, pageSize: 10 })
      if (response.success && response.data) {
        setAllFavorites(response.data.favorites)
        setTotalPages(response.data.totalPages)
        setTotal(response.data.total)
      } else {
        showToast(response.message || 'Không thể tải danh sách favorites', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải danh sách favorites', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadTopProperties = async () => {
    setLoading(true)
    try {
      const response = await adminFavoriteService.getTopProperties({ limit: topLimit })
      if (response.success && response.data) {
        setTopProperties(response.data)
      } else {
        showToast(response.message || 'Không thể tải top khách sạn', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải top khách sạn', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadTopUsers = async () => {
    setLoading(true)
    try {
      const response = await adminFavoriteService.getTopUsers({ limit: topLimit })
      if (response.success && response.data) {
        setTopUsers(response.data)
      } else {
        showToast(response.message || 'Không thể tải top người dùng', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải top người dùng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async () => {
    setLoading(true)
    try {
      const response = await adminFavoriteService.getTimeline({
        startDate,
        endDate,
        groupBy: timelineGroupBy
      })
      if (response.success && response.data) {
        setTimeline(response.data)
      } else {
        showToast(response.message || 'Không thể tải lịch sử', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải lịch sử', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadUserFavorites = async (userId: number) => {
    setLoading(true)
    try {
      const response = await adminFavoriteService.getUserFavorites(userId)
      if (response.success && response.data) {
        setUserFavorites(response.data)
        setShowUserFavoritesModal(true)
      } else {
        showToast(response.message || 'Không thể tải favorites của người dùng', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải favorites của người dùng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFavorite = async () => {
    if (!deleteItemId) return
    
    setLoading(true)
    try {
      const response = await adminFavoriteService.deleteFavorite(deleteItemId)
      if (response.success) {
        showToast('Xóa favorite thành công', 'success')
        setShowDeleteModal(false)
        setDeleteItemId(null)
        if (activeTab === 'all') loadAllFavorites()
        else if (activeTab === 'userFavorites' && selectedUserId) loadUserFavorites(selectedUserId)
        loadStatistics()
      } else {
        showToast(response.message || 'Không thể xóa favorite', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi xóa favorite', 'error')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (id: number) => {
    setDeleteItemId(id)
    setShowDeleteModal(true)
  }

  const viewUserFavorites = (userId: number) => {
    setSelectedUserId(userId)
    loadUserFavorites(userId)
  }

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/images/placeholder-hotel.jpg'
    if (imagePath.startsWith('http')) return imagePath
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}${imagePath}`
  }

  const resetDateFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-pink-900 mb-2">Quản lý Yêu Thích</h1>
          <p className="text-pink-700">Tổng quan và thống kê về danh sách yêu thích khách sạn, homestay, resort</p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Tổng Yêu Thích" value={statistics.totalFavorites} icon="❤️" color="pink" />
            <StatCard title="Người dùng" value={statistics.totalUsersWithFavorites} icon="👥" color="purple" />
            <StatCard title="Khách sạn được yêu thích" value={statistics.totalPropertiesFavorited} icon="🏨" color="rose" />
            <StatCard title="30 ngày qua" value={statistics.favoritesLast30Days} icon="📊" color="pink" />
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-6 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              📊 Tổng quan
            </TabButton>
            <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
              📋 Tất cả
            </TabButton>
            <TabButton active={activeTab === 'properties'} onClick={() => setActiveTab('properties')}>
              🏨 Top Khách Sạn
            </TabButton>
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
              👥 Top Users
            </TabButton>
            <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')}>
              📈 Timeline
            </TabButton>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
            </div>
          )}

          {!loading && activeTab === 'overview' && statistics && (
            <OverviewTab statistics={statistics} />
          )}

          {!loading && activeTab === 'all' && (
            <AllFavoritesTab
              favorites={allFavorites}
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              onPageChange={setCurrentPage}
              onDelete={confirmDelete}
              getImageUrl={getImageUrl}
            />
          )}

          {!loading && activeTab === 'properties' && (
            <TopPropertiesTab
              properties={topProperties}
              limit={topLimit}
              onLimitChange={setTopLimit}
              getImageUrl={getImageUrl}
            />
          )}

          {!loading && activeTab === 'users' && (
            <TopUsersTab
              users={topUsers}
              limit={topLimit}
              onLimitChange={setTopLimit}
              onViewFavorites={viewUserFavorites}
            />
          )}

          {!loading && activeTab === 'timeline' && (
            <TimelineTab
              timeline={timeline}
              groupBy={timelineGroupBy}
              startDate={startDate}
              endDate={endDate}
              onGroupByChange={setTimelineGroupBy}
              onStartDateClick={() => setShowStartDatePicker(true)}
              onEndDateClick={() => setShowEndDatePicker(true)}
              formatDateDisplay={formatDateDisplay}
              onResetFilters={resetDateFilters}
            />
          )}
        </div>
      </div>

      {/* Date Pickers */}
      <DatePickerModal
        isOpen={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        selectedDate={startDate}
        onDateSelect={(date) => setStartDate(date)}
        title="Chọn Ngày Bắt Đầu"
      />

      <DatePickerModal
        isOpen={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        selectedDate={endDate}
        onDateSelect={(date) => setEndDate(date)}
        minDate={startDate}
        title="Chọn Ngày Kết Thúc"
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xóa mục yêu thích này?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteFavorite}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* User Favorites Modal */}
      {showUserFavoritesModal && (
        <Modal onClose={() => setShowUserFavoritesModal(false)} large>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Danh sách yêu thích của người dùng</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userFavorites.map(fav => (
              <div key={fav.id} className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                <img 
                  src={getImageUrl(fav.propertyImage)} 
                  alt={fav.propertyName} 
                  className="w-16 h-16 rounded-lg object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder-hotel.jpg'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{fav.propertyName}</p>
                  <p className="text-sm text-gray-600">{fav.provinceName}</p>
                  <p className="text-xs text-gray-500">{new Date(fav.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <button
                  onClick={() => confirmDelete(fav.id)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

// Component: StatCard
function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: 'pink' | 'purple' | 'rose' }) {
  const colorClass = color === 'pink' ? 'from-pink-500 to-pink-600' : 
                    color === 'purple' ? 'from-purple-500 to-purple-600' : 
                    'from-rose-500 to-rose-600'
  
  return (
    <div className={`bg-gradient-to-br ${colorClass} rounded-xl p-4 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold">{value.toLocaleString()}</span>
      </div>
      <p className="text-sm opacity-90">{title}</p>
    </div>
  )
}

// Component: TabButton
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
        active
          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
          : 'text-gray-600 hover:bg-pink-50'
      }`}
    >
      {children}
    </button>
  )
}

// Component: OverviewTab
function OverviewTab({ statistics }: { statistics: FavoriteStatisticsDto }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl p-6">
          <p className="text-sm text-pink-700 mb-1">Hôm nay</p>
          <p className="text-3xl font-bold text-pink-900">{statistics.favoritesToday}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-6">
          <p className="text-sm text-purple-700 mb-1">7 ngày qua</p>
          <p className="text-3xl font-bold text-purple-900">{statistics.favoritesLast7Days}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl p-6">
          <p className="text-sm text-rose-700 mb-1">TB mỗi user</p>
          <p className="text-3xl font-bold text-rose-900">{statistics.averageFavoritesPerUser.toFixed(1)}</p>
        </div>
      </div>
    </div>
  )
}

// Component: AllFavoritesTab
function AllFavoritesTab({ favorites, currentPage, totalPages, total, onPageChange, onDelete, getImageUrl }: any) {
  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">Tổng: {total} mục yêu thích</div>
      <div className="space-y-3">
        {favorites.map((fav: AdminFavoriteDto) => (
          <div key={fav.id} className="flex items-center space-x-3 p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition">
            <img 
              src={getImageUrl(fav.propertyImage)} 
              alt={fav.propertyName} 
              className="w-20 h-20 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/placeholder-hotel.jpg'
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{fav.propertyName}</p>
              <p className="text-sm text-gray-600">{fav.userName} - {fav.userEmail}</p>
              <p className="text-sm text-gray-500">{fav.provinceName}</p>
              <p className="text-xs text-gray-400">{new Date(fav.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
            <button
              onClick={() => onDelete(fav.id)}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Trước
          </button>
          <span className="text-gray-600">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}

// Component: TopPropertiesTab
function TopPropertiesTab({ properties, limit, onLimitChange, getImageUrl }: any) {
  return (
    <div>
      <div className="mb-4">
        <label className="text-sm text-gray-600 mr-2">Hiển thị:</label>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
        </select>
      </div>
      
      <div className="space-y-3">
        {properties.map((prop: TopFavoritePropertyDto, index: number) => (
          <div key={prop.propertyId} className="flex items-center space-x-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
            <div className="text-2xl font-bold text-pink-600 w-8">#{index + 1}</div>
            <img 
              src={getImageUrl(prop.propertyImage)} 
              alt={prop.propertyName} 
              className="w-20 h-20 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/placeholder-hotel.jpg'
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{prop.propertyName}</p>
              <p className="text-sm text-gray-600">{prop.provinceName} - {prop.productTypeName}</p>
              <div className="flex items-center mt-1">
                <span className="text-pink-600 text-lg">❤️</span>
                <span className="ml-1 text-sm font-semibold text-pink-700">{prop.favoriteCount} lượt yêu thích</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Component: TopUsersTab
function TopUsersTab({ users, limit, onLimitChange, onViewFavorites }: any) {
  return (
    <div>
      <div className="mb-4">
        <label className="text-sm text-gray-600 mr-2">Hiển thị:</label>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
        </select>
      </div>
      
      <div className="space-y-3">
        {users.map((user: TopFavoriteUserDto, index: number) => (
          <div key={user.userId} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-purple-600 w-8">#{index + 1}</div>
              <div>
                <p className="font-semibold text-gray-900">{user.userName}</p>
                <p className="text-sm text-gray-600">{user.userEmail}</p>
                <p className="text-xs text-gray-500">
                  Lần cuối: {new Date(user.lastFavoriteDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-pink-600">{user.favoriteCount}</p>
              <button
                onClick={() => onViewFavorites(user.userId)}
                className="mt-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition text-sm"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Component: TimelineTab
function TimelineTab({ 
  timeline, 
  groupBy, 
  startDate, 
  endDate, 
  onGroupByChange, 
  onStartDateClick, 
  onEndDateClick, 
  formatDateDisplay,
  onResetFilters 
}: any) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nhóm theo:</label>
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value)}
            className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Từ ngày:</label>
          <input
            type="text"
            readOnly
            value={formatDateDisplay(startDate)}
            onClick={onStartDateClick}
            className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
            placeholder="Chọn ngày bắt đầu"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Đến ngày:</label>
          <input
            type="text"
            readOnly
            value={formatDateDisplay(endDate)}
            onClick={onEndDateClick}
            className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
            placeholder="Chọn ngày kết thúc"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={onResetFilters}
            className="w-full px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Đặt Lại
          </button>
        </div>
      </div>
      
      {(startDate || endDate) && (
        <div className="mb-4 text-sm text-pink-600">
          Đang lọc từ {startDate ? formatDateDisplay(startDate) : 'đầu'} 
          {' đến '} 
          {endDate ? formatDateDisplay(endDate) : 'hiện tại'}
        </div>
      )}
      
      <div className="space-y-2">
        {timeline.map((item: FavoriteTimelineDto, index: number) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{item.period}</p>
              <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="flex items-center">
              <div
                className="h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                style={{ width: `${Math.min(item.count * 10, 200)}px` }}
              ></div>
              <span className="ml-2 font-bold text-pink-600">{item.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Component: Modal
function Modal({ children, onClose, large = false }: { children: React.ReactNode; onClose: () => void; large?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/20 ${large ? 'max-w-2xl w-full' : 'max-w-md w-full'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}
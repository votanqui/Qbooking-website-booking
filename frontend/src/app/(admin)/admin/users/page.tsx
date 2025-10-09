'use client'

import { useState, useEffect } from 'react'
import { adminUserService } from '@/services/admin/adminuser.service'
import { useToast } from '@/components/ui/Toast'
import {
  UserDetailResponse,
  UserFullDetailResponse,
  GetUsersRequest,
  UsersStatisticsResponse,
  GetUserBookingsRequest,
    GetUserLoginHistoryRequest,
    LoginHistory
} from '@/types/admin/adminuser'
import { DatePickerModal } from '@/components/ui/DatePickerModal'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

export default function AdminUsersPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserDetailResponse[]>([])
  const [statistics, setStatistics] = useState<UsersStatisticsResponse | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserFullDetailResponse | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showBookingsModal, setShowBookingsModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list')
const [loginHistories, setLoginHistories] = useState<LoginHistory[]>([])
const [showFromDatePicker, setShowFromDatePicker] = useState(false)
const [showToDatePicker, setShowToDatePicker] = useState(false)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  const [filters, setFilters] = useState<GetUsersRequest>({
    pageNumber: 1,
    pageSize: 10,
    sortBy: 'created',
    sortOrder: 'desc'
  })
const [loginHistoryPagination, setLoginHistoryPagination] = useState({
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  hasNextPage: false,
  hasPreviousPage: false
})
const [loginHistoryFilters, setLoginHistoryFilters] = useState({
  page: 1,
  pageSize: 10,
  isSuccess: undefined as boolean | undefined,
  fromDate: undefined as string | undefined,
  toDate: undefined as string | undefined
})

  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false
  })

  const [statusForm, setStatusForm] = useState({ isActive: true, reason: '' })
  const [roleForm, setRoleForm] = useState({ role: '', reason: '' })
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', reason: '' })

  useEffect(() => {
    fetchUsers()
    fetchStatistics()
  }, [filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await adminUserService.getAllUsers(filters)
      if (response.success && response.data) {
        setUsers(response.data.users)
        setPagination({
          totalCount: response.data.totalCount,
          totalPages: response.data.totalPages,
          currentPage: response.data.currentPage,
          hasNextPage: response.data.hasNextPage,
          hasPreviousPage: response.data.hasPreviousPage
        })
      }
    } catch (error) {
      showToast('Không thể tải danh sách người dùng', 'error')
    } finally {
      setLoading(false)
    }
  }
const fetchUserLoginHistoryWithFilters = async (userId: number, filters: typeof loginHistoryFilters) => {
  try {
    setLoading(true)
    const response = await adminUserService.getUserLoginHistory({
      userId,
      ...filters
    })
    if (response.success && response.data) {
      setLoginHistories(response.data.histories)
      setLoginHistoryPagination({
        totalCount: response.data.pagination.totalCount,
        totalPages: response.data.pagination.totalPages,
        currentPage: response.data.pagination.currentPage,
        hasNextPage: response.data.pagination.hasNext,
        hasPreviousPage: response.data.pagination.hasPrevious
      })
    }
  } catch (error) {
    showToast('Không thể tải lịch sử đăng nhập', 'error')
  } finally {
    setLoading(false)
  }
}

// Function ban đầu để mở modal
const fetchUserLoginHistory = async (userId: number) => {
  setShowBookingsModal(true)
  await fetchUserLoginHistoryWithFilters(userId, loginHistoryFilters)
}
  const fetchStatistics = async () => {
    try {
      const response = await adminUserService.getStatistics()
      if (response.success && response.data) {
        setStatistics(response.data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const fetchUserDetails = async (userId: number) => {
    try {
      setLoading(true)
      const response = await adminUserService.getUserById(userId)
      if (response.success && response.data) {
        setSelectedUser(response.data)
        setShowUserModal(true)
      }
    } catch (error) {
      showToast('Không thể tải thông tin người dùng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedUser) return
    try {
      const response = await adminUserService.updateUserStatus(selectedUser.id, statusForm)
      if (response.success) {
        showToast('Cập nhật trạng thái thành công', 'success')
        setShowStatusModal(false)
        fetchUsers()
      } else {
        showToast(response.message, 'error')
      }
    } catch (error) {
      showToast('Có lỗi xảy ra', 'error')
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return
    try {
      const response = await adminUserService.updateUserRole(selectedUser.id, roleForm)
      if (response.success) {
        showToast('Cập nhật vai trò thành công', 'success')
        setShowRoleModal(false)
        fetchUsers()
      } else {
        showToast(response.message, 'error')
      }
    } catch (error) {
      showToast('Có lỗi xảy ra', 'error')
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    try {
      const response = await adminUserService.resetPassword(selectedUser.id, passwordForm)
      if (response.success) {
        showToast('Đặt lại mật khẩu thành công', 'success')
        setShowResetPasswordModal(false)
        setPasswordForm({ newPassword: '', reason: '' })
      } else {
        showToast(response.message, 'error')
      }
    } catch (error) {
      showToast('Có lỗi xảy ra', 'error')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-700'
      case 'host': return 'bg-pink-100 text-pink-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Quản Lý Người Dùng
          </h1>
          <p className="text-gray-600">Quản lý và theo dõi toàn bộ người dùng trong hệ thống</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'list'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Danh Sách
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Thống Kê
          </button>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Tổng người dùng', value: statistics.totalUsers, color: 'from-pink-500 to-purple-500' },
              { label: 'Đang hoạt động', value: statistics.activeUsers, color: 'from-green-500 to-emerald-500' },
              { label: 'Chủ nhà', value: statistics.hostCount, color: 'from-blue-500 to-cyan-500' },
              { label: 'Mới trong 30 ngày', value: statistics.newUsersLast30Days, color: 'from-orange-500 to-red-500' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg p-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, SĐT..."
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none"
                onChange={(e) => setFilters({ ...filters, search: e.target.value, pageNumber: 1 })}
              />
              <select
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none"
                onChange={(e) => setFilters({ ...filters, role: e.target.value, pageNumber: 1 })}
              >
                <option value="">Tất cả vai trò</option>
                <option value="customer">Khách hàng</option>
                <option value="host">Chủ nhà</option>
                <option value="admin">Admin</option>
              </select>
              <select
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none"
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value === '' ? undefined : e.target.value === 'true', pageNumber: 1 })}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Hoạt động</option>
                <option value="false">Bị khóa</option>
              </select>
            </div>
          </div>
        )}

        {/* Users List */}
        {activeTab === 'list' && (
          <>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start gap-4">
                      {/* Avatar với fallback */}
                      <div className="flex-shrink-0">
                        {user.avatar ? (
                          <img 
                            src={`${API_BASE_URL}${user.avatar}`}
                            alt={user.fullName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-pink-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/default-avatar.png';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{user.fullName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                          {user.isActive ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Hoạt động</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Bị khóa</span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-1">{user.email}</p>
                        {user.phone && <p className="text-gray-500 text-sm">{user.phone}</p>}
                      </div>
                      <button
                        onClick={() => fetchUserDetails(user.id)}
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                disabled={!pagination.hasPreviousPage}
                onClick={() => setFilters({ ...filters, pageNumber: filters.pageNumber - 1 })}
                className="px-4 py-2 bg-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="px-4 py-2 bg-white rounded-xl">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setFilters({ ...filters, pageNumber: filters.pageNumber + 1 })}
                className="px-4 py-2 bg-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </>
        )}

        {/* User Detail Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-2xl flex items-center gap-4">
                {/* Avatar trong modal */}
                {selectedUser.avatar ? (
                  <img 
                    src={`${API_BASE_URL}${selectedUser.avatar}`}
                    alt={selectedUser.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/50"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-white/20 to-white/10 flex items-center justify-center text-white text-xl font-bold border-2 border-white/50">
                    {selectedUser.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedUser.fullName}</h2>
                  <p className="opacity-90">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Số điện thoại</p>
                    <p className="font-medium">{selectedUser.phone || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Giới tính</p>
                    <p className="font-medium">{selectedUser.gender || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Tỉnh/Thành</p>
                    <p className="font-medium">{selectedUser.province || 'Chưa có'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Xã/Phường</p>
                    <p className="font-medium">{selectedUser.commune || 'Chưa có'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-600 text-sm mb-1">Avatar URL</p>
                    <p className="font-medium text-sm break-all">
                      {selectedUser.avatar ? `${API_BASE_URL}${selectedUser.avatar}` : 'Không có avatar'}
                    </p>
                  </div>
                </div>

                {selectedUser.bookingStats && (
                  <div>
                    <h3 className="font-bold text-lg mb-4">Thống kê đặt phòng</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-50 p-4 rounded-xl">
                        <p className="text-blue-600 text-sm">Tổng booking</p>
                        <p className="text-2xl font-bold text-blue-700">{selectedUser.bookingStats.totalBookings}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl">
                        <p className="text-green-600 text-sm">Hoàn thành</p>
                        <p className="text-2xl font-bold text-green-700">{selectedUser.bookingStats.completedBookings}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-xl">
                        <p className="text-yellow-600 text-sm">Đang chờ</p>
                        <p className="text-2xl font-bold text-yellow-700">{selectedUser.bookingStats.pendingBookings}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-xl">
                        <p className="text-red-600 text-sm">Đã hủy</p>
                        <p className="text-2xl font-bold text-red-700">{selectedUser.bookingStats.cancelledBookings}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setStatusForm({ isActive: !selectedUser.isActive, reason: '' })
                      setShowStatusModal(true)
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    {selectedUser.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                  </button>
                  <button
                    onClick={() => {
                      setRoleForm({ role: selectedUser.role, reason: '' })
                      setShowRoleModal(true)
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Đổi vai trò
                  </button>
                  <button
                    onClick={() => setShowResetPasswordModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Đặt lại mật khẩu
                  </button>
                  <button
                    onClick={() => fetchUserLoginHistory(selectedUser.id)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Xem lịch sử đăng nhập
                  </button>
                </div>

                <button
                  onClick={() => setShowUserModal(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login History Modal */}
        {showBookingsModal && selectedUser && (
          <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header với màu hồng tím và nút đóng hình chữ X */}
              <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {/* Avatar trong modal lịch sử đăng nhập */}
                  {selectedUser.avatar ? (
                    <img 
                      src={`${API_BASE_URL}${selectedUser.avatar}`}
                      alt={selectedUser.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-white/20 to-white/10 flex items-center justify-center text-white font-bold border-2 border-white/50">
                      {selectedUser.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Lịch sử đăng nhập - {selectedUser.fullName}</h2>
                    <p className="opacity-90">Tổng: {loginHistoryPagination.totalCount} lần đăng nhập</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBookingsModal(false)
                    setLoginHistories([])
                    setLoginHistoryFilters({ page: 1, pageSize: 10, isSuccess: undefined, fromDate: undefined, toDate: undefined })
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <select
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    value={loginHistoryFilters.isSuccess === undefined ? '' : String(loginHistoryFilters.isSuccess)}
                    onChange={(e) => {
                      const newFilters = { 
                        ...loginHistoryFilters, 
                        isSuccess: e.target.value === '' ? undefined : e.target.value === 'true',
                        page: 1 
                      }
                      setLoginHistoryFilters(newFilters)
                      if (selectedUser) {
                        fetchUserLoginHistoryWithFilters(selectedUser.id, newFilters)
                      }
                    }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Thành công</option>
                    <option value="false">Thất bại</option>
                  </select>
                  
                  {/* From Date */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFromDatePicker(true)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-left flex items-center justify-between"
                    >
                      <span className={loginHistoryFilters.fromDate ? 'text-gray-700' : 'text-gray-400'}>
                        {loginHistoryFilters.fromDate || 'Từ ngày'}
                      </span>
                      <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  
                  {/* To Date */}
                  <div className="relative">
                    <button
                      onClick={() => setShowToDatePicker(true)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-left flex items-center justify-between"
                    >
                      <span className={loginHistoryFilters.toDate ? 'text-gray-700' : 'text-gray-400'}>
                        {loginHistoryFilters.toDate || 'Đến ngày'}
                      </span>
                      <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(loginHistoryFilters.isSuccess !== undefined || loginHistoryFilters.fromDate || loginHistoryFilters.toDate) && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        const newFilters = { 
                          page: 1, 
                          pageSize: 10, 
                          isSuccess: undefined, 
                          fromDate: undefined, 
                          toDate: undefined 
                        }
                        setLoginHistoryFilters(newFilters)
                        if (selectedUser) {
                          fetchUserLoginHistoryWithFilters(selectedUser.id, newFilters)
                        }
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}

                {/* History List */}
                <div className="space-y-3 mb-6">
                  {loginHistories.map((history) => (
                    <div key={history.id} className={`p-4 rounded-xl border-2 ${
                      history.isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              history.isSuccess ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {history.isSuccess ? 'Thành công' : 'Thất bại'}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(history.loginTime).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">IP:</span> {history.ipAddress}
                          </p>
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">Thiết bị:</span> {history.deviceInfo}
                          </p>
                          {!history.isSuccess && history.failureReason && (
                            <p className="text-sm text-red-600 mt-2">
                              <span className="font-medium">Lý do:</span> {history.failureReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-2 mb-4">
                  <button
                    disabled={!loginHistoryPagination.hasPreviousPage}
                    onClick={() => {
                      const newFilters = { ...loginHistoryFilters, page: loginHistoryFilters.page - 1 }
                      setLoginHistoryFilters(newFilters)
                      if (selectedUser) {
                        fetchUserLoginHistoryWithFilters(selectedUser.id, newFilters)
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    Trước
                  </button>
                  <span className="px-4 py-2">
                    Trang {loginHistoryPagination.currentPage} / {loginHistoryPagination.totalPages}
                  </span>
                  <button
                    disabled={!loginHistoryPagination.hasNextPage}
                    onClick={() => {
                      const newFilters = { ...loginHistoryFilters, page: loginHistoryFilters.page + 1 }
                      setLoginHistoryFilters(newFilters)
                      if (selectedUser) {
                        fetchUserLoginHistoryWithFilters(selectedUser.id, newFilters)
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    Sau
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowBookingsModal(false)
                    setLoginHistories([])
                    setLoginHistoryFilters({ page: 1, pageSize: 10, isSuccess: undefined, fromDate: undefined, toDate: undefined })
                  }}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Date Pickers */}
        <DatePickerModal
          isOpen={showFromDatePicker}
          onClose={() => setShowFromDatePicker(false)}
          selectedDate={loginHistoryFilters.fromDate}
          onDateSelect={(date) => {
            const newFilters = { ...loginHistoryFilters, fromDate: date, page: 1 }
            setLoginHistoryFilters(newFilters)
            if (selectedUser) {
              fetchUserLoginHistoryWithFilters(selectedUser.id, newFilters)
            }
          }}
          title="Chọn ngày bắt đầu"
          type="checkin"
        />

        <DatePickerModal
          isOpen={showToDatePicker}
          onClose={() => setShowToDatePicker(false)}
          selectedDate={loginHistoryFilters.toDate}
          onDateSelect={(date) => {
            const newFilters = { ...loginHistoryFilters, toDate: date, page: 1 }
            setLoginHistoryFilters(newFilters)
            if (selectedUser) {
              fetchUserLoginHistoryWithFilters(selectedUser.id, newFilters)
            }
          }}
          minDate={loginHistoryFilters.fromDate}
          title="Chọn ngày kết thúc"
          type="checkout"
        />

        {/* Status Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Cập nhật trạng thái</h3>
              <textarea
                placeholder="Lý do (không bắt buộc)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none mb-4"
                rows={4}
                value={statusForm.reason}
                onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStatus}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Cập nhật vai trò</h3>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none mb-4"
                value={roleForm.role}
                onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}
              >
                <option value="customer">Khách hàng</option>
                <option value="host">Chủ nhà</option>
                <option value="admin">Admin</option>
              </select>
              <textarea
                placeholder="Lý do (không bắt buộc)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none mb-4"
                rows={4}
                value={roleForm.reason}
                onChange={(e) => setRoleForm({ ...roleForm, reason: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateRole}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Đặt lại mật khẩu</h3>
              <input
                type="password"
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none mb-4"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
              <textarea
                placeholder="Lý do (không bắt buộc)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none mb-4"
                rows={4}
                value={passwordForm.reason}
                onChange={(e) => setPasswordForm({ ...passwordForm, reason: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleResetPassword}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
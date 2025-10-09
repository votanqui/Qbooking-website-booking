'use client'

import { useState, useEffect } from 'react'
import { adminAddressService } from '@/services/admin/adminaddress.service'
import { useToast } from '@/components/ui/Toast'
import {
  Province,
  Commune,
  DashboardData,
  ProvinceStatistics,
  CommuneStatistics,
  ProvinceTopUsers,
  CommuneTopProperties,
} from '@/types/admin/adminaddress'

// Thêm interface mới cho statistics
interface ProvinceStatisticsDetail {
  totalCommunes: number
  activeCommunes: number
  totalUsers: number
  activeUsers: number
  totalProperties: number
  activeProperties: number
  approvedProperties: number
  totalBookings: number
  totalReviews: number
}

interface ProvinceDetailResponse {
  id: number
  name: string
  slug: string
  code: string
  region: string
  type: string
  isActive: boolean
  createdAt: string
  statistics: ProvinceStatisticsDetail
}

export default function AdminAddressPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'provinces' | 'communes'>('dashboard')
  const [loading, setLoading] = useState(false)

  // Dashboard State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  // Provinces State
  const [provinces, setProvinces] = useState<Province[]>([])
  const [provinceStats, setProvinceStats] = useState<ProvinceStatistics[]>([])
  const [topUserProvinces, setTopUserProvinces] = useState<ProvinceTopUsers[]>([])
  const [provinceSearch, setProvinceSearch] = useState('')

  // Communes State
  const [communes, setCommunes] = useState<Commune[]>([])
  const [communeStats, setCommuneStats] = useState<CommuneStatistics[]>([])
  const [topPropertyCommunes, setTopPropertyCommunes] = useState<CommuneTopProperties[]>([])
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('')
  const [communeSearch, setCommuneSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Province Detail State - sử dụng interface mới
  const [provinceDetail, setProvinceDetail] = useState<ProvinceDetailResponse | null>(null)
  const [showProvinceDetail, setShowProvinceDetail] = useState(false)

  // View Mode
  const [viewMode, setViewMode] = useState<'list' | 'statistics'>('list')

  // Load Dashboard
  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await adminAddressService.getDashboard()
      if (response.success && response.data) {
        setDashboardData(response.data)
      } else {
        showToast(response.message || 'Không thể tải dashboard', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load Provinces - HÀM NÀY CẦN ĐƯỢC GỌI KHI COMPONENT MOUNT
  const loadProvinces = async () => {
    try {
      setLoading(true)
      const response = await adminAddressService.getAllProvinces()
      if (response.success && response.data) {
        setProvinces(response.data)
      }
    } catch (error) {
      showToast('Lỗi khi tải danh sách tỉnh/thành', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load Province Statistics
  const loadProvinceStats = async () => {
    try {
      setLoading(true)
      const response = await adminAddressService.getProvincesStatistics()
      if (response.success && response.data) {
        setProvinceStats(response.data.details)
      }
    } catch (error) {
      showToast('Lỗi khi tải thống kê tỉnh/thành', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load Top User Provinces
  const loadTopUserProvinces = async () => {
    try {
      const response = await adminAddressService.getProvincesTopUsers({ top: 10 })
      if (response.success && response.data) {
        setTopUserProvinces(response.data)
      }
    } catch (error) {
      showToast('Lỗi khi tải top tỉnh theo user', 'error')
    }
  }

  // Load Communes
  const loadCommunes = async (page = 1) => {
    try {
      setLoading(true)
      if (selectedProvinceCode) {
        const response = await adminAddressService.getCommunesByProvince(selectedProvinceCode)
        if (response.success && response.data) {
          setCommunes(response.data.items)
          setTotalPages(1)
        }
      } else {
        const response = await adminAddressService.getAllCommunes({ page, pageSize: 20 })
        if (response.success && response.data) {
          setCommunes(response.data.items)
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages)
          }
        }
      }
    } catch (error) {
      showToast('Lỗi khi tải danh sách xã/phường', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load Commune Statistics
  const loadCommuneStats = async () => {
    try {
      setLoading(true)
      const response = await adminAddressService.getCommunesStatistics(selectedProvinceCode || undefined)
      if (response.success && response.data) {
        setCommuneStats(response.data.details)
      }
    } catch (error) {
      showToast('Lỗi khi tải thống kê xã/phường', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load Top Property Communes
  const loadTopPropertyCommunes = async () => {
    try {
      const response = await adminAddressService.getCommunesTopProperties({ top: 20 })
      if (response.success && response.data) {
        setTopPropertyCommunes(response.data)
      }
    } catch (error) {
      showToast('Lỗi khi tải top xã/phường theo property', 'error')
    }
  }

  // Load Province Detail - SỬA LẠI ĐỂ KHỚP VỚI RESPONSE
  const loadProvinceDetail = async (id: number) => {
    try {
      setLoading(true)
      const response = await adminAddressService.getProvinceDetail(id)
      console.log('Province Detail Response:', response) // Debug log
      
      if (response.success && response.data) {
        setProvinceDetail(response.data as ProvinceDetailResponse)
        setShowProvinceDetail(true)
      } else {
        showToast(response.message || 'Không thể tải chi tiết tỉnh/thành', 'error')
      }
    } catch (error) {
      console.error('Error loading province detail:', error)
      showToast('Lỗi khi tải chi tiết tỉnh/thành', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Toggle Province Status
  const handleToggleProvince = async (id: number, name: string) => {
    try {
      const response = await adminAddressService.toggleProvinceStatus(id)
      if (response.success) {
        showToast(`Đã cập nhật trạng thái ${name}`, 'success')
        if (viewMode === 'list') {
          loadProvinces()
        } else {
          loadProvinceStats()
        }
      } else {
        showToast(response.message || 'Không thể cập nhật trạng thái', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi cập nhật trạng thái', 'error')
    }
  }

  // Toggle Commune Status
  const handleToggleCommune = async (id: number, name: string) => {
    try {
      const response = await adminAddressService.toggleCommuneStatus(id)
      if (response.success) {
        showToast(`Đã cập nhật trạng thái ${name}`, 'success')
        if (viewMode === 'list') {
          loadCommunes(currentPage)
        } else {
          loadCommuneStats()
        }
      } else {
        showToast(response.message || 'Không thể cập nhật trạng thái', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi cập nhật trạng thái', 'error')
    }
  }

  // Search Provinces
  const handleSearchProvinces = async () => {
    if (!provinceSearch.trim()) {
      loadProvinces()
      return
    }
    try {
      setLoading(true)
      const response = await adminAddressService.searchProvinces({ name: provinceSearch })
      if (response.success && response.data) {
        setProvinces(response.data)
        showToast(`Tìm thấy ${response.data.length} kết quả`, 'success')
      }
    } catch (error) {
      showToast('Lỗi khi tìm kiếm', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Search Communes
  const handleSearchCommunes = async () => {
    if (!communeSearch.trim()) {
      loadCommunes()
      return
    }
    try {
      setLoading(true)
      const response = await adminAddressService.searchCommunes({
        name: communeSearch,
        provinceCode: selectedProvinceCode || undefined,
        pageSize: 20,
      })
      if (response.success && response.data) {
        setCommunes(response.data.items)
        showToast(`Tìm thấy ${response.data.items.length} kết quả`, 'success')
      }
    } catch (error) {
      showToast('Lỗi khi tìm kiếm', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Effects
  useEffect(() => {
    // Load danh sách tỉnh/thành khi component mount
    loadProvinces()
  }, [])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard()
    } else if (activeTab === 'provinces') {
      if (viewMode === 'list') {
        // Không cần load lại vì đã load khi mount
      } else {
        loadProvinceStats()
        loadTopUserProvinces()
      }
    } else if (activeTab === 'communes') {
      // Đảm bảo đã có danh sách tỉnh/thành trước khi load communes
      if (provinces.length === 0) {
        loadProvinces()
      }
      if (viewMode === 'list') {
        loadCommunes(currentPage)
      } else {
        loadCommuneStats()
        loadTopPropertyCommunes()
      }
    }
  }, [activeTab, viewMode])

  useEffect(() => {
    if (activeTab === 'communes') {
      loadCommunes(currentPage)
    }
  }, [selectedProvinceCode, currentPage])

  // Filter provinces by search
  const filteredProvinces = provinces.filter(p =>
    p.name.toLowerCase().includes(provinceSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(provinceSearch.toLowerCase())
  )

  // Filter communes by search
  const filteredCommunes = communes.filter(c =>
    c.name.toLowerCase().includes(communeSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(communeSearch.toLowerCase())
  )

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            🗺️ Quản Lý Địa Chỉ
          </h1>
          <p className="text-pink-100">Quản lý tỉnh/thành phố và xã/phường</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('provinces')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === 'provinces'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              🏙️ Tỉnh/Thành
            </button>
            <button
              onClick={() => setActiveTab('communes')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === 'communes'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              🏘️ Xã/Phường
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        )}

        {/* Province Detail Modal - ĐÃ SỬA LẠI THEO RESPONSE THỰC TẾ */}
        {showProvinceDetail && provinceDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 rounded-t-2xl text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">📋 Chi Tiết Tỉnh/Thành</h2>
                  <button
                    onClick={() => setShowProvinceDetail(false)}
                    className="text-white hover:text-pink-200 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-semibold">{provinceDetail.name}</div>
                  <div className="text-pink-100">
                    Mã: {provinceDetail.code} | Slug: {provinceDetail.slug}
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <div className="text-sm text-pink-600 font-medium">Vùng</div>
                    <div className="text-lg font-semibold capitalize">{provinceDetail.region}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Loại</div>
                    <div className="text-lg font-semibold">
                      {provinceDetail.type.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Ngày tạo</div>
                    <div className="text-lg font-semibold">{formatDate(provinceDetail.createdAt)}</div>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Thống Kê Chi Tiết</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">{provinceDetail.statistics.totalCommunes}</div>
                      <div className="text-xs opacity-90">Tổng Xã/Phường</div>
                      <div className="text-xs opacity-75">
                        ({provinceDetail.statistics.activeCommunes} hoạt động)
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">{provinceDetail.statistics.totalUsers}</div>
                      <div className="text-xs opacity-90">Tổng Người Dùng</div>
                      <div className="text-xs opacity-75">
                        ({provinceDetail.statistics.activeUsers} hoạt động)
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">{provinceDetail.statistics.totalProperties}</div>
                      <div className="text-xs opacity-90">Tổng Properties</div>
                      <div className="text-xs opacity-75">
                        ({provinceDetail.statistics.activeProperties} hoạt động)
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">{provinceDetail.statistics.totalBookings}</div>
                      <div className="text-xs opacity-90">Tổng Bookings</div>
                    </div>
                  </div>
                </div>

                {/* Additional Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">🏠 Thống Kê Properties</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Properties đã duyệt:</span>
                        <span className="font-semibold text-green-600">
                          {provinceDetail.statistics.approvedProperties}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Properties hoạt động:</span>
                        <span className="font-semibold text-blue-600">
                          {provinceDetail.statistics.activeProperties}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tổng số reviews:</span>
                        <span className="font-semibold text-purple-600">
                          {provinceDetail.statistics.totalReviews}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">👥 Thống Kê Người Dùng</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tổng người dùng:</span>
                        <span className="font-semibold text-pink-600">
                          {provinceDetail.statistics.totalUsers}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Người dùng hoạt động:</span>
                        <span className="font-semibold text-green-600">
                          {provinceDetail.statistics.activeUsers}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tỷ lệ hoạt động:</span>
                        <span className="font-semibold text-blue-600">
                          {provinceDetail.statistics.totalUsers > 0 
                            ? Math.round((provinceDetail.statistics.activeUsers / provinceDetail.statistics.totalUsers) * 100)
                            : 0
                          }%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-800">Trạng thái hệ thống</div>
                    <div className="text-sm text-gray-600">
                      {provinceDetail.isActive ? 'Đang hoạt động bình thường' : 'Đã ngừng hoạt động'}
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    provinceDetail.isActive
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    {provinceDetail.isActive ? '✅ ĐANG HOẠT ĐỘNG' : '❌ NGỪNG HOẠT ĐỘNG'}
                  </span>
                </div>
              </div>

              <div className="p-6 border-t">
                <button
                  onClick={() => setShowProvinceDetail(false)}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {!loading && activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">🏙️</div>
                <div className="text-pink-100 text-sm">Tổng Tỉnh/Thành</div>
                <div className="text-3xl font-bold">{dashboardData.overview.totalProvinces}</div>
                <div className="text-pink-100 text-xs mt-2">
                  Hoạt động: {dashboardData.overview.activeProvinces}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">🏘️</div>
                <div className="text-purple-100 text-sm">Tổng Xã/Phường</div>
                <div className="text-3xl font-bold">{dashboardData.overview.totalCommunes}</div>
                <div className="text-purple-100 text-xs mt-2">
                  Hoạt động: {dashboardData.overview.activeCommunes}
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">📈</div>
                <div className="text-pink-100 text-sm">Trạng Thái</div>
                <div className="text-lg font-bold">Hệ thống ổn định</div>
                <div className="text-pink-100 text-xs mt-2">
                  Cập nhật: {new Date().toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>

            {/* Top Provinces by Properties */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🏆 Top 5 Tỉnh/Thành Có Nhiều Property Nhất
              </h3>
              <div className="space-y-3">
                {dashboardData.topProvincesByProperties.map((item, index) => (
                  <div key={`dashboard-property-${item.provinceId}`} className="flex items-center gap-4 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{item.provinceName}</div>
                      <div className="text-sm text-gray-600">{item.totalProperties} properties</div>
                    </div>
                    <div className="text-2xl font-bold text-pink-600">{item.totalProperties}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Provinces by Users */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                👥 Top 5 Tỉnh/Thành Có Nhiều User Nhất
              </h3>
              <div className="space-y-3">
                {dashboardData.topProvincesByUsers.map((item, index) => (
                  <div key={`dashboard-user-${item.provinceId}`} className="flex items-center gap-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-pink-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{item.provinceName}</div>
                      <div className="text-sm text-gray-600">{item.totalUsers} users</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{item.totalUsers}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Region Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🌏 Phân Bố Theo Vùng Miền
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.regionDistribution.map((region) => (
                  <div key={`region-${region.region}`} className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <div className="font-bold text-lg text-gray-800 mb-2">{region.region}</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>📍 Tỉnh/Thành: {region.totalProvinces}</div>
                      <div>🏠 Properties: {region.totalProperties}</div>
                      <div>👤 Users: {region.totalUsers}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Provinces Tab */}
        {!loading && activeTab === 'provinces' && (
          <div className="space-y-6">
            {/* View Mode Toggle */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'list'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📋 Danh Sách
                  </button>
                  <button
                    onClick={() => setViewMode('statistics')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'statistics'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📊 Thống Kê
                  </button>
                </div>

                {viewMode === 'list' && (
                  <div className="flex gap-2 flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Tìm kiếm tỉnh/thành..."
                      value={provinceSearch}
                      onChange={(e) => setProvinceSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchProvinces()}
                      className="flex-1 px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <button
                      onClick={handleSearchProvinces}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      🔍
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">Tên</th>
                        <th className="px-4 py-3 text-left">Mã</th>
                        <th className="px-4 py-3 text-left">Vùng</th>
                        <th className="px-4 py-3 text-left">Loại</th>
                        <th className="px-4 py-3 text-center">Trạng thái</th>
                        <th className="px-4 py-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProvinces.map((province) => (
                        <tr key={`province-${province.id}`} className="hover:bg-pink-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            <button
                              onClick={() => loadProvinceDetail(province.id)}
                              className="hover:text-pink-600 hover:underline transition-colors text-left"
                            >
                              {province.name}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{province.code}</td>
                          <td className="px-4 py-3 text-gray-600">{province.region}</td>
                          <td className="px-4 py-3 text-gray-600">{province.type}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              province.isActive !== false
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {province.isActive !== false ? '✓ Hoạt động' : '✗ Ngừng'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => loadProvinceDetail(province.id)}
                                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-all"
                              >
                                Chi tiết
                              </button>
                              <button
                                onClick={() => handleToggleProvince(province.id, province.name)}
                                className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm hover:shadow-lg transition-all"
                              >
                                Đổi TT
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Statistics View */}
            {viewMode === 'statistics' && (
              <div className="space-y-6">
                {/* Province Statistics Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold">
                    📊 Thống Kê Chi Tiết Tỉnh/Thành
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Tên</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Users</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Properties</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Xã/Phường</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Bookings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {provinceStats.slice(0, 15).map((stat) => (
                          <tr key={`province-stat-${stat.provinceId}`} className="hover:bg-pink-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800">{stat.provinceName}</div>
                              <div className="text-xs text-gray-500">{stat.region}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                {stat.totalUsers}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                                {stat.totalProperties}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-700">{stat.totalCommunes}</td>
                            <td className="px-4 py-3 text-center text-gray-700">{stat.totalBookings}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Users Provinces */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    👥 Top 10 Tỉnh/Thành Có Nhiều User Nhất
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topUserProvinces.map((item, index) => (
                      <div key={`top-user-${item.provinceId}`} className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            index < 3 ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{item.provinceName}</div>
                            <div className="text-xs text-gray-500">{item.region}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-purple-600 font-bold">{item.totalUsers}</div>
                            <div className="text-xs text-gray-600">Tổng</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-blue-600 font-bold">{item.customersCount}</div>
                            <div className="text-xs text-gray-600">Khách</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-green-600 font-bold">{item.hostsCount}</div>
                            <div className="text-xs text-gray-600">Host</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Communes Tab */}
        {!loading && activeTab === 'communes' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'list'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📋 Danh Sách
                  </button>
                  <button
                    onClick={() => setViewMode('statistics')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'statistics'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📊 Thống Kê
                  </button>
                </div>

                {viewMode === 'list' && (
                  <>
                    <select
                      value={selectedProvinceCode}
                      onChange={(e) => setSelectedProvinceCode(e.target.value)}
                      className="px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="">Tất cả tỉnh/thành</option>
                      {provinces.map((p) => (
                        <option key={`province-option-${p.id}`} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2 flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Tìm kiếm xã/phường..."
                        value={communeSearch}
                        onChange={(e) => setCommuneSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchCommunes()}
                        className="flex-1 px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <button
                        onClick={handleSearchCommunes}
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                      >
                        🔍
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
              <>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left">Tên</th>
                          <th className="px-4 py-3 text-left">Mã</th>
                          <th className="px-4 py-3 text-left">Loại</th>
                          <th className="px-4 py-3 text-left">Tỉnh/Thành</th>
                          <th className="px-4 py-3 text-center">Trạng thái</th>
                          <th className="px-4 py-3 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredCommunes.map((commune) => (
                          <tr key={`commune-${commune.id}`} className="hover:bg-pink-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800">{commune.name}</td>
                            <td className="px-4 py-3 text-gray-600">{commune.code}</td>
                            <td className="px-4 py-3 text-gray-600">{commune.type}</td>
                            <td className="px-4 py-3 text-gray-600">{commune.provinceName}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                commune.isActive !== false
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {commune.isActive !== false ? '✓ Hoạt động' : '✗ Ngừng'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleToggleCommune(commune.id, commune.name)}
                                className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm hover:shadow-lg transition-all"
                              >
                                Đổi TT
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {!selectedProvinceCode && totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border border-pink-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                    >
                      ← Trước
                    </button>
                    <span className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white border border-pink-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50 transition-colors"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Statistics View */}
            {viewMode === 'statistics' && (
              <div className="space-y-6">
                {/* Commune Statistics Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold">
                    📊 Thống Kê Chi Tiết Xã/Phường
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Tên</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Tỉnh/Thành</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Users</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Properties</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {communeStats.slice(0, 20).map((stat) => (
                          <tr key={`commune-stat-${stat.communeId}`} className="hover:bg-pink-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800">{stat.communeName}</div>
                              <div className="text-xs text-gray-500">{stat.communeType}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{stat.provinceName}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                {stat.totalUsers}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                                {stat.totalProperties}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-700">{stat.activeProperties}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Property Communes */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    🏆 Top 20 Xã/Phường Có Nhiều Property Nhất
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topPropertyCommunes.map((item, index) => (
                      <div key={`top-property-${item.communeId}`} className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            index < 3 ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-800">{item.communeName}</div>
                            <div className="text-xs text-gray-500">{item.provinceName}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-pink-600 font-bold">{item.totalProperties}</div>
                            <div className="text-xs text-gray-600">Properties</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-purple-600 font-bold">{item.totalBookings}</div>
                            <div className="text-xs text-gray-600">Bookings</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-green-600 font-bold">{item.activeProperties}</div>
                            <div className="text-xs text-gray-600">Active</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-blue-600 font-bold">{item.totalViews}</div>
                            <div className="text-xs text-gray-600">Views</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
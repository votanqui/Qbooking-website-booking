'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { adminPropertyService } from '@/services/admin/adminproperty.service'
import { PropertyAdminFilter, PropertyAdmin, PropertyStatistics, PropertyDetailAdmin } from '@/types/admin/adminproperty'

export default function AdminPropertyPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<PropertyAdmin[]>([])
  const [statistics, setStatistics] = useState<PropertyStatistics | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<PropertyAdmin | null>(null)
  const [propertyDetail, setPropertyDetail] = useState<PropertyDetailAdmin | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'deactivate' | 'activate' | 'toggle-featured'>('approve')
  const [reason, setReason] = useState('')
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  const [filter, setFilter] = useState<PropertyAdminFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'created',
    sortOrder: 'desc'
  })

  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    page: 1,
    pageSize: 10
  })

  useEffect(() => {
    fetchStatistics()
    fetchProperties()
  }, [filter])

  const fetchStatistics = async () => {
    try {
      const response = await adminPropertyService.getStatistics()
      if (response.success) {
        setStatistics(response.data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const response = await adminPropertyService.getAllProperties(filter)
      if (response.success) {
        setProperties(response.data.properties)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      showToast('Lỗi khi tải danh sách properties', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchPropertyDetail = async (id: number) => {
    setLoading(true)
    try {
      const response = await adminPropertyService.getPropertyDetail(id)
      if (response.success) {
        setPropertyDetail(response.data)
        setShowDetailModal(true)
      } else {
        showToast(response.message, 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải chi tiết property', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedProperty) return

    try {
      let response
      switch (actionType) {
        case 'approve':
          response = await adminPropertyService.approveProperty(selectedProperty.id)
          break
        case 'reject':
          if (!reason.trim()) {
            showToast('Vui lòng nhập lý do từ chối', 'warning')
            return
          }
          response = await adminPropertyService.rejectProperty(selectedProperty.id, reason)
          break
        case 'deactivate':
          if (!reason.trim()) {
            showToast('Vui lòng nhập lý do vô hiệu hóa', 'warning')
            return
          }
          response = await adminPropertyService.deactivateProperty(selectedProperty.id, reason)
          break
        case 'activate':
          response = await adminPropertyService.activateProperty(selectedProperty.id)
          break
        case 'toggle-featured':
          response = await adminPropertyService.toggleFeaturedStatus(selectedProperty.id)
          break
      }

      if (response.success) {
        showToast(response.message, 'success')
        setShowActionModal(false)
        setReason('')
        fetchProperties()
        fetchStatistics()
      } else {
        showToast(response.message, 'error')
      }
    } catch (error) {
      showToast('Có lỗi xảy ra', 'error')
    }
  }

  const openActionModal = (property: PropertyAdmin, type: typeof actionType) => {
    setSelectedProperty(property)
    setActionType(type)
    setShowActionModal(true)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Property Management
        </h1>
        <p className="text-gray-600">Quản lý và giám sát tất cả properties trong hệ thống</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tổng Properties"
            value={statistics.totalProperties}
            icon="🏢"
            gradient="from-pink-500 to-rose-500"
          />
          <StatCard
            title="Đang hoạt động"
            value={statistics.activeProperties}
            icon="✅"
            gradient="from-purple-500 to-indigo-500"
          />
          <StatCard
            title="Nổi bật"
            value={statistics.featuredProperties}
            icon="⭐"
            gradient="from-indigo-500 to-blue-500"
          />
          <StatCard
            title="Doanh thu"
            value={`${statistics.totalRevenue.toLocaleString()} VNĐ`}
            icon="💰"
            gradient="from-rose-500 to-pink-500"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tìm theo tên..."
            className="px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setFilter({ ...filter, name: e.target.value, page: 1 })}
          />
          <select
            className="px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined, page: 1 })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setFilter({ ...filter, isActive: e.target.value ? e.target.value === 'true' : undefined, page: 1 })}
          >
            <option value="">Tất cả hoạt động</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            className="px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setFilter({ ...filter, sortBy: e.target.value, page: 1 })}
          >
            <option value="created">Ngày tạo</option>
            <option value="name">Tên</option>
            <option value="price">Giá</option>
            <option value="bookings">Booking</option>
            <option value="revenue">Doanh thu</option>
          </select>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Property</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Host</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Giá</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Thống kê</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={property.primaryImage ? `${API_BASE_URL}${property.primaryImage}` : '/placeholder.jpg'}
                          alt={property.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{property.name}</div>
                          <div className="text-sm text-gray-500">{property.productType}</div>
                          {property.isFeatured && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">⭐ Featured</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{property.host.name}</div>
                      <div className="text-xs text-gray-500">{property.host.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(property.status)}
                      <div className="mt-1">
                        {property.isActive ? (
                          <span className="text-xs text-green-600">● Active</span>
                        ) : (
                          <span className="text-xs text-red-600">● Inactive</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {property.priceFrom.toLocaleString()} {property.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="text-gray-600">📊 {property.totalBookings} bookings</div>
                        <div className="text-gray-600">💰 {property.totalRevenue.toLocaleString()} VNĐ</div>
                        <div className="text-gray-600">⭐ {property.averageRating?.toFixed(1) || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => fetchPropertyDetail(property.id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs"
                        >
                          Chi tiết
                        </button>
                        {property.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openActionModal(property, 'approve')}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => openActionModal(property, 'reject')}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {property.status === 'approved' && (
                          <>
                            {property.isActive ? (
                              <button
                                onClick={() => openActionModal(property, 'deactivate')}
                                className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-xs"
                              >
                                Vô hiệu
                              </button>
                            ) : (
                              <button
                                onClick={() => openActionModal(property, 'activate')}
                                className="px-3 py-1 bg-teal-500 text-white rounded-lg hover:bg-teal-600 text-xs"
                              >
                                Kích hoạt
                              </button>
                            )}
                            <button
                              onClick={() => openActionModal(property, 'toggle-featured')}
                              className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-xs"
                            >
                              {property.isFeatured ? '★' : '☆'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-purple-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} của {pagination.totalCount}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
              disabled={filter.page === 1}
              className="px-4 py-2 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <span className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg">
              {pagination.page}
            </span>
            <button
              onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
              disabled={filter.page >= pagination.totalPages}
              className="px-4 py-2 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      </div>


     {/* Detail Modal */}
      {showDetailModal && propertyDetail && (
       <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">

          <div className="bg-white rounded-2xl max-w-6xl w-full my-8">
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{propertyDetail.property.name}</h2>
                  <div className="flex flex-wrap gap-3 text-sm">
                  <span className="bg-white/70 text-gray-900 font-semibold px-3 py-1 rounded-full">
  {propertyDetail.property.productType.name}
</span>
<span className="bg-white/70 text-gray-900 font-semibold px-3 py-1 rounded-full">
  ⭐ {propertyDetail.property.starRating} sao
</span>

                    {propertyDetail.property.isFeatured && (
                      <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-medium">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors ml-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-150px)] overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Status and Pricing */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                    <div className="text-xs text-blue-600 mb-1">Trạng thái</div>
                    {getStatusBadge(propertyDetail.property.status)}
                    <div className="mt-2">
                      {propertyDetail.property.isActive ? (
                        <span className="text-xs text-green-600 font-medium">● Đang hoạt động</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">● Ngừng hoạt động</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                    <div className="text-xs text-green-600 mb-1">Giá từ</div>
                    <div className="text-2xl font-bold text-green-700">
                      {propertyDetail.property.priceFrom.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600">{propertyDetail.property.currency}/đêm</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                    <div className="text-xs text-purple-600 mb-1">Tổng phòng</div>
                    <div className="text-2xl font-bold text-purple-700">{propertyDetail.property.totalRooms}</div>
                    <div className="text-xs text-purple-600">phòng</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                    <div className="text-xs text-orange-600 mb-1">Loại phòng</div>
                    <div className="text-2xl font-bold text-orange-700">{propertyDetail.property.roomTypes.length}</div>
                    <div className="text-xs text-orange-600">loại</div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">📍</span>
                      Thông tin địa điểm
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex">
                        <span className="text-gray-500 w-28 flex-shrink-0">ID:</span>
                        <span className="font-medium text-gray-900">{propertyDetail.property.id}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-28 flex-shrink-0">Slug:</span>
                        <span className="font-medium text-gray-900">{propertyDetail.property.slug}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-28 flex-shrink-0">Địa chỉ:</span>
                        <span className="font-medium text-gray-900">{propertyDetail.property.addressDetail}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-28 flex-shrink-0">Phường/Xã:</span>
                        <span className="font-medium text-gray-900">{propertyDetail.property.commune}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-28 flex-shrink-0">Tỉnh/TP:</span>
                        <span className="font-medium text-gray-900">{propertyDetail.property.province}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">👤</span>
                      Thông tin chủ nhà
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex">
                        <span className="text-gray-500 w-28 flex-shrink-0">ID Host:</span>
                        <span className="font-medium text-gray-900">{propertyDetail.property.host.id}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-28 flex-shrink-0">Tên:</span>
                        <span className="font-medium text-gray-900">{propertyDetail.property.host.fullName}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-28 flex-shrink-0">Email:</span>
                        <span className="font-medium text-gray-900">{propertyDetail.property.host.email}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-28 flex-shrink-0">Số điện thoại:</span>
                        <span className="font-medium text-gray-900">{propertyDetail.property.host.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">📝</span>
                    Mô tả
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Mô tả ngắn:</div>
                      <p className="text-sm text-gray-700 bg-white rounded-lg p-3">{propertyDetail.property.shortDescription}</p>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Mô tả chi tiết:</div>
                      <p className="text-sm text-gray-700 bg-white rounded-lg p-3 whitespace-pre-wrap">{propertyDetail.property.description}</p>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                {propertyDetail.property.amenities.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">✨</span>
                      Tiện nghi ({propertyDetail.property.amenities.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {propertyDetail.property.amenities.map((amenity) => (
                        <div key={amenity.id} className="flex items-center bg-white rounded-lg p-3">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-sm text-gray-700">{amenity.name}</span>
                          {amenity.isFree && (
                            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Miễn phí</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">🖼️</span>
                    Hình ảnh property ({propertyDetail.property.images.length})
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {propertyDetail.property.images.map((img) => (
                      <div key={img.id} className="relative group overflow-hidden rounded-lg">
                        <img 
                          src={`${API_BASE_URL}${img.imageUrl}`} 
                          alt="" 
                          className="w-full h-32 object-cover transition-transform group-hover:scale-110" 
                        />
                        {img.isPrimary && (
                          <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                            ⭐ Chính
                          </span>
                        )}
                        <span className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {img.imageType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Room Types */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">🛏️</span>
                    Các loại phòng ({propertyDetail.property.roomTypes.length})
                  </h3>
                  <div className="space-y-4">
                    {propertyDetail.property.roomTypes.map((room) => (
                      <div key={room.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{room.name}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="font-semibold text-purple-700">
                                {room.basePrice.toLocaleString()} VNĐ/đêm
                              </span>
                              <span className="text-gray-600">• {room.totalRooms} phòng</span>
                              <span className="text-gray-600">• ID: {room.id}</span>
                            </div>
                          </div>
                          <span className={`px-4 py-2 rounded-full text-xs font-medium ${room.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {room.isActive ? '✓ Active' : '✗ Inactive'}
                          </span>
                        </div>
                        {room.images.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mt-3">
                            {room.images.map((img, idx) => (
                              <img 
                                key={idx}
                                src={`${API_BASE_URL}${img}`} 
                                alt={`${room.name} ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg" 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">📊</span>
                    Thống kê hoạt động
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                      <div className="text-3xl font-bold">{propertyDetail.statistics.totalBookings}</div>
                      <div className="text-sm opacity-90 mt-1">Tổng bookings</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                      <div className="text-2xl font-bold">{propertyDetail.statistics.totalRevenue.toLocaleString()}</div>
                      <div className="text-sm opacity-90 mt-1">Doanh thu (VNĐ)</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-5 text-white">
                      <div className="text-3xl font-bold">{propertyDetail.statistics.totalReviews}</div>
                      <div className="text-sm opacity-90 mt-1">Tổng reviews</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                      <div className="text-3xl font-bold">
                        {propertyDetail.statistics.averageRating?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-sm opacity-90 mt-1">⭐ Đánh giá TB</div>
                    </div>
                  </div>

                  {/* Booking by Status */}
                  {propertyDetail.statistics.bookingsByStatus.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-5">
                      <h4 className="font-semibold text-gray-900 mb-3">Bookings theo trạng thái</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {propertyDetail.statistics.bookingsByStatus.map((item) => (
                          <div key={item.status} className="bg-white rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                            <div className="text-xs text-gray-500 uppercase mt-1">{item.status}</div>
                            <div className="text-xs text-gray-600 mt-1">{item.totalAmount.toLocaleString()} VNĐ</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Reviews */}
                {propertyDetail.statistics.recentReviews.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">💬</span>
                      Reviews gần đây
                    </h3>
                    <div className="space-y-3">
                      {propertyDetail.statistics.recentReviews.map((review) => (
                        <div key={review.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{review.guestName}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(review.createdAt).toLocaleDateString('vi-VN', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                              <span className="text-yellow-500 text-lg mr-1">★</span>
                              <span className="font-bold text-yellow-700">{review.overallRating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{review.reviewText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Ngày tạo:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(propertyDetail.property.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cập nhật lần cuối:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(propertyDetail.property.updatedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Action Modal */}
      {showActionModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Xác nhận hành động
            </h3>
            <p className="text-gray-600 mb-4">
              Property: <strong>{selectedProperty.name}</strong>
            </p>
            
            {(actionType === 'reject' || actionType === 'deactivate') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do:
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Nhập lý do..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false)
                  setReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAction}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, gradient }: { title: string; value: number | string; icon: string; gradient: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className={`bg-gradient-to-r ${gradient} p-6`}>
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="text-sm font-medium opacity-90">{title}</div>
            <div className="text-3xl font-bold mt-2">{value}</div>
          </div>
          <div className="text-5xl opacity-80">{icon}</div>
        </div>
      </div>
    </div>
  )
}
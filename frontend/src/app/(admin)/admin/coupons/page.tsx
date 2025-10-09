'use client'

import { useState, useEffect } from 'react'
import { adminCouponService } from '@/services/admin/admincoupon.service'
import { useToast } from '@/components/ui/Toast'
import {
  AdminCouponResponse,
  CouponOverviewStatisticsResponse,
  CreateCouponRequest,
  UpdateCouponRequest,
  DiscountType,
  ApplicableToType,
  DiscountTypeResponse,
  ApplicableToTypeResponse,
  AdminCouponUsageHistoryResponse,
  TopUsedCouponResponse,
  ExpiringSoonCouponResponse,
  TopCouponCustomerResponse,
  PagedResult
} from '@/types/admin/admincoupon'
import { DatePickerModal } from '@/components/ui/DatePickerModal'

export default function AdminCouponsPage() {
  const { showToast } = useToast()
  
  // States
  const [activeTab, setActiveTab] = useState<'list' | 'statistics' | 'usage' | 'expiring' | 'top'>('list')
  const [coupons, setCoupons] = useState<AdminCouponResponse[]>([])
  const [statistics, setStatistics] = useState<CouponOverviewStatisticsResponse | null>(null)
  const [usageHistory, setUsageHistory] = useState<PagedResult<AdminCouponUsageHistoryResponse> | null>(null)
  const [topUsedCoupons, setTopUsedCoupons] = useState<TopUsedCouponResponse[]>([])
  const [expiringCoupons, setExpiringCoupons] = useState<ExpiringSoonCouponResponse[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCouponCustomerResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<AdminCouponResponse | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  
  // Modal states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateCode, setDuplicateCode] = useState('')
  const [couponToDuplicate, setCouponToDuplicate] = useState<AdminCouponResponse | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(10)
  
  // Filters
  const [filters, setFilters] = useState({
    keyword: '',
    isActive: undefined as boolean | undefined,
    isFeatured: undefined as boolean | undefined,
    discountType: undefined as string | undefined,
  })

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)

  // Report date filters
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: ''
  })

  // Report date picker states
  const [showReportStartDatePicker, setShowReportStartDatePicker] = useState(false)
  const [showReportEndDatePicker, setShowReportEndDatePicker] = useState(false)

  // Form data
  const [formData, setFormData] = useState<CreateCouponRequest>({
    code: '',
    name: '',
    description: '',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 0,
    maxDiscountAmount: 0,
    minOrderAmount: 0,
    minNights: 1,
    applicableDays: 'all',
    applicableTo: ApplicableToType.ALL,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxTotalUses: 100,
    maxUsesPerCustomer: 1,
    isPublic: true,
    isFeatured: false,
    isActive: true,
    applications: []
  })

  // Discount types and applicable types
  const [discountTypes, setDiscountTypes] = useState<DiscountTypeResponse[]>([])
  const [applicableTypes, setApplicableTypes] = useState<ApplicableToTypeResponse[]>([])

  // Load initial data
  useEffect(() => {
    loadCoupons()
    loadStatistics()
    loadDiscountTypes()
    loadApplicableTypes()
  }, [currentPage, filters])

  useEffect(() => {
    if (activeTab === 'usage') {
      loadUsageHistory()
    } else if (activeTab === 'expiring') {
      loadExpiringCoupons()
    } else if (activeTab === 'top') {
      loadTopUsedCoupons()
      loadTopCustomers()
    }
  }, [activeTab, reportFilters])

  const loadCoupons = async () => {
    try {
      setLoading(true)
      const response = await adminCouponService.getAllCoupons({
        ...filters,
        page: currentPage,
        pageSize: pageSize
      })
      
      if (response.success && response.data) {
        setCoupons(response.data.items)
        setTotalPages(response.data.totalPages)
      }
    } catch (error) {
      showToast('Không thể tải danh sách coupon', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await adminCouponService.getCouponOverviewStatistics()
      if (response.success && response.data) {
        setStatistics(response.data)
      }
    } catch (error) {
      console.error('Failed to load statistics', error)
    }
  }

  const loadUsageHistory = async () => {
    try {
      setLoading(true)
      const response = await adminCouponService.getAllCouponUsageHistory({
        page: currentPage,
        pageSize: pageSize
      })
      if (response.success && response.data) {
        setUsageHistory(response.data)
      }
    } catch (error) {
      showToast('Không thể tải lịch sử sử dụng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadTopUsedCoupons = async () => {
    try {
      const response = await adminCouponService.getTopUsedCoupons({
        limit: 10,
        startDate: reportFilters.startDate ? new Date(reportFilters.startDate) : undefined,
        endDate: reportFilters.endDate ? new Date(reportFilters.endDate) : undefined
      })
      if (response.success && response.data) {
        setTopUsedCoupons(response.data)
      }
    } catch (error) {
      console.error('Failed to load top used coupons', error)
    }
  }

  const loadExpiringCoupons = async () => {
    try {
      const response = await adminCouponService.getExpiringSoonCoupons(7)
      if (response.success && response.data) {
        setExpiringCoupons(response.data)
      }
    } catch (error) {
      console.error('Failed to load expiring coupons', error)
    }
  }

  const loadTopCustomers = async () => {
    try {
      const response = await adminCouponService.getTopCouponCustomers({
        limit: 10,
        startDate: reportFilters.startDate ? new Date(reportFilters.startDate) : undefined,
        endDate: reportFilters.endDate ? new Date(reportFilters.endDate) : undefined
      })
      if (response.success && response.data) {
        setTopCustomers(response.data)
      }
    } catch (error) {
      console.error('Failed to load top customers', error)
    }
  }

  const loadDiscountTypes = async () => {
    try {
      const response = await adminCouponService.getDiscountTypes()
      if (response.success && response.data) {
        setDiscountTypes(response.data)
      }
    } catch (error) {
      console.error('Failed to load discount types', error)
    }
  }

  const loadApplicableTypes = async () => {
    try {
      const response = await adminCouponService.getApplicableToTypes()
      if (response.success && response.data) {
        setApplicableTypes(response.data)
      }
    } catch (error) {
      console.error('Failed to load applicable types', error)
    }
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await adminCouponService.createCoupon(formData)
      
      if (response.success) {
        showToast('Tạo mã giảm giá thành công!', 'success')
        setShowModal(false)
        resetForm()
        loadCoupons()
        loadStatistics()
      } else {
        showToast(response.message || 'Có lỗi xảy ra', 'error')
      }
    } catch (error: any) {
      showToast(error.message || 'Không thể tạo coupon', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCoupon) return
    
    try {
      setLoading(true)
      const response = await adminCouponService.updateCoupon(selectedCoupon.id, formData as UpdateCouponRequest)
      
      if (response.success) {
        showToast('Cập nhật mã giảm giá thành công!', 'success')
        setShowModal(false)
        resetForm()
        loadCoupons()
      } else {
        showToast(response.message || 'Có lỗi xảy ra', 'error')
      }
    } catch (error: any) {
      showToast(error.message || 'Không thể cập nhật coupon', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCoupon = async (id: number) => {
    try {
      const response = await adminCouponService.deleteCoupon(id)
      
      if (response.success) {
        showToast('Xóa mã giảm giá thành công!', 'success')
        loadCoupons()
        loadStatistics()
      } else {
        showToast(response.message || 'Có lỗi xảy ra', 'error')
      }
    } catch (error: any) {
      showToast(error.message || 'Không thể xóa coupon', 'error')
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await adminCouponService.toggleCouponStatus(id)
      
      if (response.success) {
        showToast('Cập nhật trạng thái thành công!', 'success')
        loadCoupons()
      } else {
        showToast(response.message || 'Có lỗi xảy ra', 'error')
      }
    } catch (error: any) {
      showToast(error.message || 'Không thể cập nhật trạng thái', 'error')
    }
  }

  const handleDuplicate = async () => {
    if (!couponToDuplicate || !duplicateCode.trim()) {
      showToast('Vui lòng nhập mã code mới', 'error')
      return
    }
    
    try {
      const response = await adminCouponService.duplicateCoupon(couponToDuplicate.id, { newCode: duplicateCode })
      
      if (response.success) {
        showToast('Sao chép coupon thành công!', 'success')
        setShowDuplicateModal(false)
        setDuplicateCode('')
        setCouponToDuplicate(null)
        loadCoupons()
      } else {
        showToast(response.message || 'Có lỗi xảy ra', 'error')
      }
    } catch (error: any) {
      showToast(error.message || 'Không thể sao chép coupon', 'error')
    }
  }

  const openDuplicateModal = (coupon: AdminCouponResponse) => {
    setCouponToDuplicate(coupon)
    setDuplicateCode(`${coupon.code}_COPY`)
    setShowDuplicateModal(true)
  }

  const handleExportCSV = async () => {
    try {
      const blob = await adminCouponService.exportCouponsToCSV({})
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coupons_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showToast('Xuất CSV thành công!', 'success')
    } catch (error) {
      showToast('Xuất CSV thất bại', 'error')
    }
  }

  const openCreateModal = () => {
    setModalMode('create')
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (coupon: AdminCouponResponse) => {
    setModalMode('edit')
    setSelectedCoupon(coupon)
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType as DiscountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minOrderAmount: coupon.minOrderAmount,
      minNights: coupon.minNights,
      applicableDays: coupon.applicableDays || 'all',
      applicableTo: coupon.applicableTo as ApplicableToType,
      startDate: coupon.startDate.split('T')[0],
      endDate: coupon.endDate.split('T')[0],
      maxTotalUses: coupon.maxTotalUses,
      maxUsesPerCustomer: coupon.maxUsesPerCustomer,
      isPublic: coupon.isPublic,
      isFeatured: coupon.isFeatured,
      isActive: coupon.isActive,
      applications: coupon.applications.map(app => ({
        applicableType: app.applicableType,
        applicableId: app.applicableId
      }))
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 0,
      maxDiscountAmount: 0,
      minOrderAmount: 0,
      minNights: 1,
      applicableDays: 'all',
      applicableTo: ApplicableToType.ALL,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxTotalUses: 100,
      maxUsesPerCustomer: 1,
      isPublic: true,
      isFeatured: false,
      isActive: true,
      applications: []
    })
    setSelectedCoupon(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getDiscountDisplay = (coupon: AdminCouponResponse) => {
    switch (coupon.discountType) {
      case 'percentage':
        return `${coupon.discountValue}%`
      case 'fixedAmount':
        return formatCurrency(coupon.discountValue)
      case 'freeNight':
        return `${coupon.discountValue} đêm`
      default:
        return coupon.discountValue
    }
  }

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  const resetReportFilters = () => {
    setReportFilters({
      startDate: '',
      endDate: ''
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Quản Lý Mã Giảm Giá
          </h1>
          <p className="text-gray-600">Quản lý và theo dõi các mã giảm giá của hệ thống</p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Tổng Coupon"
              value={statistics.totalCoupons}
              icon="🎫"
              gradient="from-pink-500 to-rose-500"
            />
            <StatCard
              title="Đang Hoạt Động"
              value={statistics.activeCoupons}
              icon="✅"
              gradient="from-green-500 to-emerald-500"
            />
            <StatCard
              title="Tổng Tiết Kiệm"
              value={formatCurrency(statistics.totalDiscountAmount)}
              icon="💰"
              gradient="from-purple-500 to-indigo-500"
            />
            <StatCard
              title="Lượt Sử Dụng"
              value={statistics.totalUsages}
              icon="📊"
              gradient="from-blue-500 to-cyan-500"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'list', label: 'Danh Sách Coupon', icon: '📋' },
              { id: 'statistics', label: 'Thống Kê', icon: '📊' },
              { id: 'usage', label: 'Lịch Sử Sử Dụng', icon: '🕒' },
              { id: 'expiring', label: 'Sắp Hết Hạn', icon: '⏰' },
              { id: 'top', label: 'Top & Báo Cáo', icon: '🏆' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  setCurrentPage(1)
                }}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* List Tab */}
            {activeTab === 'list' && (
              <>
                {/* Filters and Actions */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Tìm kiếm mã coupon..."
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <select
                    value={filters.isActive?.toString() || ''}
                    onChange={(e) => setFilters({ ...filters, isActive: e.target.value ? e.target.value === 'true' : undefined })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã tắt</option>
                  </select>
                  <button
                    onClick={openCreateModal}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    + Tạo Mới
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    📥 Xuất CSV
                  </button>
                </div>

                {/* Coupons List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Không có mã giảm giá nào
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {coupons.map((coupon) => (
                        <CouponCard
                          key={coupon.id}
                          coupon={coupon}
                          onEdit={() => openEditModal(coupon)}
                          onDelete={() => handleDeleteCoupon(coupon.id)}
                          onToggle={() => handleToggleStatus(coupon.id)}
                          onDuplicate={() => openDuplicateModal(coupon)}
                          getDiscountDisplay={getDiscountDisplay}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-6">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Trước
                        </button>
                        <span className="px-4 py-2">
                          Trang {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <StatisticsTab statistics={statistics} />
            )}

            {/* Usage History Tab */}
            {activeTab === 'usage' && (
              <UsageHistoryTab 
                usageHistory={usageHistory} 
                loading={loading}
                formatCurrency={formatCurrency}
              />
            )}

            {/* Expiring Soon Tab */}
            {activeTab === 'expiring' && (
              <ExpiringSoonTab 
                expiringCoupons={expiringCoupons}
                getDiscountDisplay={getDiscountDisplay}
                formatDateDisplay={formatDateDisplay}
              />
            )}

            {/* Top & Reports Tab */}
            {activeTab === 'top' && (
              <TopReportsTab 
                topUsedCoupons={topUsedCoupons}
                topCustomers={topCustomers}
                formatCurrency={formatCurrency}
                reportFilters={reportFilters}
                setReportFilters={setReportFilters}
                onReportStartDateClick={() => setShowReportStartDatePicker(true)}
                onReportEndDateClick={() => setShowReportEndDatePicker(true)}
                formatDateDisplay={formatDateDisplay}
                onResetFilters={resetReportFilters}
              />
            )}
          </div>
        </div>
      </div>

      {/* Date Pickers */}
      <DatePickerModal
        isOpen={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        selectedDate={formData.startDate}
        onDateSelect={(date) => setFormData({ ...formData, startDate: date })}
        title="Chọn Ngày Bắt Đầu"
      />

      <DatePickerModal
        isOpen={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        selectedDate={formData.endDate}
        onDateSelect={(date) => setFormData({ ...formData, endDate: date })}
        minDate={formData.startDate}
        title="Chọn Ngày Kết Thúc"
      />

      {/* Report Date Pickers */}
      <DatePickerModal
        isOpen={showReportStartDatePicker}
        onClose={() => setShowReportStartDatePicker(false)}
        selectedDate={reportFilters.startDate}
        onDateSelect={(date) => setReportFilters({ ...reportFilters, startDate: date })}
        title="Chọn Ngày Bắt Đầu Báo Cáo"
      />

      <DatePickerModal
        isOpen={showReportEndDatePicker}
        onClose={() => setShowReportEndDatePicker(false)}
        selectedDate={reportFilters.endDate}
        onDateSelect={(date) => setReportFilters({ ...reportFilters, endDate: date })}
        minDate={reportFilters.startDate}
        title="Chọn Ngày Kết Thúc Báo Cáo"
      />

      {/* Coupon Modal - Transparent */}
      {showModal && (
        <CouponModal
          mode={modalMode}
          formData={formData}
          setFormData={setFormData}
          onSubmit={modalMode === 'create' ? handleCreateCoupon : handleUpdateCoupon}
          onClose={() => setShowModal(false)}
          loading={loading}
          discountTypes={discountTypes}
          applicableTypes={applicableTypes}
          onStartDateClick={() => setShowStartDatePicker(true)}
          onEndDateClick={() => setShowEndDatePicker(true)}
          formatDateDisplay={formatDateDisplay}
        />
      )}

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDuplicateModal(false)}>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-500/95 to-pink-500/95 backdrop-blur-md text-white px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold">Sao Chép Coupon</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Mã Code Mới *
                </label>
                <input
                  type="text"
                  value={duplicateCode}
                  onChange={(e) => setDuplicateCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nhập mã code mới..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Coupon gốc: <span className="font-semibold">{couponToDuplicate?.code}</span>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDuplicate}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Sao Chép
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon, gradient }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-sm font-medium opacity-90 mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

// Coupon Card Component
function CouponCard({ coupon, onEdit, onDelete, onToggle, onDuplicate, getDiscountDisplay }: any) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    onDelete()
    setShowDeleteModal(false)
  }

  return (
    <>
      <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-bold rounded-full">
                {coupon.code}
              </span>
              {coupon.isFeatured && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                  ⭐ Nổi bật
                </span>
              )}
              {coupon.isActive ? (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                  ✓ Hoạt động
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                  ✕ Đã tắt
                </span>
              )}
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{coupon.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500">Giảm giá:</span>{' '}
                <span className="font-semibold text-pink-600">{getDiscountDisplay(coupon)}</span>
              </div>
              <div>
                <span className="text-gray-500">Đã dùng:</span>{' '}
                <span className="font-semibold">{coupon.usedCount}/{coupon.maxTotalUses || '∞'}</span>
              </div>
              <div>
                <span className="text-gray-500">Hết hạn:</span>{' '}
                <span className="font-semibold">{new Date(coupon.endDate).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
          <div className="flex md:flex-col gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all"
            >
              Sửa
            </button>
            <button
              onClick={onToggle}
              className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-all"
            >
              {coupon.isActive ? 'Tắt' : 'Bật'}
            </button>
            <button
              onClick={onDuplicate}
              className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-all"
            >
              Sao chép
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-500/95 to-pink-500/95 backdrop-blur-md text-white px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold">Xác Nhận Xóa</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa coupon <span className="font-semibold">"{coupon.name}"</span>?
              </p>
              <p className="text-sm text-gray-500">
                Hành động này không thể hoàn tác.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Statistics Tab Component
function StatisticsTab({ statistics }: { statistics: CouponOverviewStatisticsResponse | null }) {
  if (!statistics) return <div>Đang tải...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Thống Kê Tháng Này</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Lượt sử dụng:</span>
              <span className="font-bold text-purple-600">{statistics.thisMonthUsages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Tổng giảm giá:</span>
              <span className="font-bold text-purple-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(statistics.thisMonthDiscountAmount)}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Thống Kê Tổng</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Khách hàng sử dụng:</span>
              <span className="font-bold text-blue-600">{statistics.uniqueCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Trung bình/lượt:</span>
              <span className="font-bold text-blue-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(statistics.averageDiscountPerUsage)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Usage History Tab Component
function UsageHistoryTab({ usageHistory, loading, formatCurrency }: any) {
  if (loading) {
    return <div className="text-center py-12">Đang tải lịch sử sử dụng...</div>
  }

  if (!usageHistory || usageHistory.items.length === 0) {
    return <div className="text-center py-12 text-gray-500">Không có lịch sử sử dụng</div>
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-pink-100 to-purple-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mã Coupon</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Khách Hàng</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Đơn Hàng</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Giảm Giá</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Thời Gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usageHistory.items.map((usage: any) => (
              <tr key={usage.id} className="hover:bg-purple-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-purple-600">{usage.couponCode}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{usage.customerName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">#{usage.orderId}</td>
                <td className="px-4 py-3 text-sm font-semibold text-green-600">
                  {formatCurrency(usage.discountAmount)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(usage.usedAt).toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Expiring Soon Tab Component
function ExpiringSoonTab({ expiringCoupons, getDiscountDisplay, formatDateDisplay }: any) {
  if (!expiringCoupons || expiringCoupons.length === 0) {
    return <div className="text-center py-12 text-gray-500">Không có coupon nào sắp hết hạn</div>
  }

  return (
    <div className="space-y-4">
      {expiringCoupons.map((coupon: any) => (
        <div key={coupon.id} className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full">
                {coupon.code}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">{coupon.name}</h3>
                <p className="text-sm text-gray-600">{getDiscountDisplay(coupon)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Hết hạn sau</div>
              <div className="font-bold text-red-600">{coupon.daysUntilExpiry} ngày</div>
              <div className="text-xs text-gray-500">{formatDateDisplay(coupon.endDate)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Top Reports Tab Component
function TopReportsTab({ 
  topUsedCoupons, 
  topCustomers, 
  formatCurrency, 
  reportFilters, 
  setReportFilters,
  onReportStartDateClick,
  onReportEndDateClick,
  formatDateDisplay,
  onResetFilters
}: any) {
  return (
    <div className="space-y-6">
      {/* Report Filters */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4">Bộ Lọc Báo Cáo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Từ Ngày</label>
            <input
              type="text"
              readOnly
              value={formatDateDisplay(reportFilters.startDate)}
              onClick={onReportStartDateClick}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
              placeholder="Chọn ngày bắt đầu"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Đến Ngày</label>
            <input
              type="text"
              readOnly
              value={formatDateDisplay(reportFilters.endDate)}
              onClick={onReportEndDateClick}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
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
        {(reportFilters.startDate || reportFilters.endDate) && (
          <div className="mt-3 text-sm text-purple-600">
            Đang lọc từ {reportFilters.startDate ? formatDateDisplay(reportFilters.startDate) : 'đầu'} 
            {' đến '} 
            {reportFilters.endDate ? formatDateDisplay(reportFilters.endDate) : 'hiện tại'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Used Coupons */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Top Coupon Được Sử Dụng</h3>
          <div className="space-y-3">
            {topUsedCoupons.slice(0, 5).map((coupon: any, index: number) => (
              <div key={coupon.couponId} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{coupon.couponCode}</div>
                    <div className="text-sm text-gray-600">{coupon.couponName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600">{coupon.usageCount} lượt</div>
                  <div className="text-sm text-gray-600">{formatCurrency(coupon.totalDiscountAmount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Top Khách Hàng Sử Dụng</h3>
          <div className="space-y-3">
            {topCustomers.slice(0, 5).map((customer: any, index: number) => (
              <div key={customer.customerId} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{customer.customerName}</div>
                    <div className="text-sm text-gray-600">{customer.customerEmail}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{customer.totalCouponsUsed} coupon</div>
                  <div className="text-sm text-gray-600">{formatCurrency(customer.totalSavingsAmount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal Component với trong suốt
function CouponModal({ 
  mode, 
  formData, 
  setFormData, 
  onSubmit, 
  onClose, 
  loading, 
  discountTypes, 
  applicableTypes,
  onStartDateClick,
  onEndDateClick,
  formatDateDisplay
}: any) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-white/20" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-pink-500/95 to-purple-500/95 backdrop-blur-md text-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Tạo Mã Giảm Giá Mới' : 'Cập Nhật Mã Giảm Giá'}
          </h2>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Mã Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="SUMMER2024"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Tên Coupon *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Giảm giá mùa hè"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              rows={3}
              placeholder="Mô tả chi tiết về coupon..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Loại Giảm Giá *</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {discountTypes.map((type: DiscountTypeResponse) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Giá Trị Giảm *</label>
              <input
                type="number"
                required
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Ngày Bắt Đầu *</label>
              <input
                type="text"
                required
                readOnly
                value={formatDateDisplay(formData.startDate)}
                onClick={onStartDateClick}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Ngày Kết Thúc *</label>
              <input
                type="text"
                required
                readOnly
                value={formatDateDisplay(formData.endDate)}
                onClick={onEndDateClick}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Số Đêm Tối Thiểu</label>
              <input
                type="number"
                value={formData.minNights}
                onChange={(e) => setFormData({ ...formData, minNights: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Đơn Tối Thiểu</label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Giảm Tối Đa</label>
              <input
                type="number"
                value={formData.maxDiscountAmount || 0}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Tổng Số Lần Dùng</label>
              <input
                type="number"
                value={formData.maxTotalUses || ''}
                onChange={(e) => setFormData({ ...formData, maxTotalUses: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                min="1"
                placeholder="Không giới hạn"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Số Lần Dùng/KH</label>
              <input
                type="number"
                value={formData.maxUsesPerCustomer}
                onChange={(e) => setFormData({ ...formData, maxUsesPerCustomer: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Áp Dụng Cho</label>
            <select
              value={formData.applicableTo}
              onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value as ApplicableToType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {applicableTypes.map((type: ApplicableToTypeResponse) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-500"
              />
              <span className="text-sm font-semibold text-gray-700">Công khai</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-500"
              />
              <span className="text-sm font-semibold text-gray-700">Nổi bật</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-500"
              />
              <span className="text-sm font-semibold text-gray-700">Kích hoạt</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : mode === 'create' ? 'Tạo Mới' : 'Cập Nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
function DeleteConfirmationModal() {
  return null // Component này được xử lý trong CouponCard
}
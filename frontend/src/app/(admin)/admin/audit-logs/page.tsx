'use client'

import { useState, useEffect } from 'react'
import { adminAuditLogService } from '@/services/admin/adminauditlog.service'
import { useToast } from '@/components/ui/Toast'
import {
  AuditLogDto,
  AuditLogResponseDto,
  AuditLogStatisticsDto,
  DashboardOverviewAuditlogDto
} from '@/types/admin/adminauditlog'
import { DatePickerModal } from '@/components/ui/DatePickerModal'

export default function AuditLogsPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'statistics' | 'security'>('overview')
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<DashboardOverviewAuditlogDto | null>(null)
  const [logs, setLogs] = useState<AuditLogResponseDto | null>(null)
  const [statistics, setStatistics] = useState<AuditLogStatisticsDto | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null)
  
  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    tableName: '',
    actionType: '',
    fromDate: '',
    toDate: '',
    page: 1,
    pageSize: 20
  })
  
  // Date picker states
  const [showFromDatePicker, setShowFromDatePicker] = useState(false)
  const [showToDatePicker, setShowToDatePicker] = useState(false)
  
  const [tables, setTables] = useState<string[]>([])
  const [actionTypes, setActionTypes] = useState<string[]>([])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs()
    }
  }, [filters, activeTab])

  const loadInitialData = async () => {
    try {
      const [overviewRes, tablesRes, actionTypesRes] = await Promise.all([
        adminAuditLogService.getDashboardOverview(),
        adminAuditLogService.getAuditedTables(),
        adminAuditLogService.getActionTypes()
      ])

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data)
      }
      if (tablesRes.success && tablesRes.data) {
        setTables(tablesRes.data)
      }
      if (actionTypesRes.success && actionTypesRes.data) {
        setActionTypes(actionTypesRes.data)
      }
    } catch (error) {
      showToast('Không thể tải dữ liệu khởi tạo', 'error')
    }
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await adminAuditLogService.getAuditLogs({
        userId: filters.userId ? parseInt(filters.userId) : undefined,
        tableName: filters.tableName || undefined,
        actionType: filters.actionType || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        page: filters.page,
        pageSize: filters.pageSize
      })

      if (response.success && response.data) {
        setLogs(response.data)
      } else {
        showToast(response.message || 'Không thể tải nhật ký', 'error')
      }
    } catch (error) {
      showToast('Không thể tải nhật ký kiểm toán', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const response = await adminAuditLogService.getStatistics({
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined
      })

      if (response.success && response.data) {
        setStatistics(response.data)
      } else {
        showToast(response.message || 'Không thể tải thống kê', 'error')
      }
    } catch (error) {
      showToast('Không thể tải thống kê', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCsv = async () => {
    try {
      const blob = await adminAuditLogService.exportToCsv({
        userId: filters.userId ? parseInt(filters.userId) : undefined,
        tableName: filters.tableName || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined
      })
      
      adminAuditLogService.downloadFile(blob, `audit_logs_${new Date().toISOString()}.csv`)
      showToast('Xuất file thành công', 'success')
    } catch (error) {
      showToast('Xuất file thất bại', 'error')
    }
  }

  const handleExportExcel = async () => {
    try {
      const blob = await adminAuditLogService.exportToExcel({
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined
      })
      
      adminAuditLogService.downloadFile(blob, `audit_report_${new Date().toISOString()}.csv`)
      showToast('Xuất file thành công', 'success')
    } catch (error) {
      showToast('Xuất file thất bại', 'error')
    }
  }

  const resetFilters = () => {
    setFilters({
      userId: '',
      tableName: '',
      actionType: '',
      fromDate: '',
      toDate: '',
      page: 1,
      pageSize: 20
    })
  }

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Quản Lý Nhật Ký Kiểm Toán
          </h1>
          <p className="mt-2 text-gray-600">Theo dõi và phân tích hoạt động hệ thống</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-1 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Tổng Quan', icon: '📊' },
              { id: 'logs', label: 'Nhật Ký', icon: '📝' },
              { id: 'statistics', label: 'Thống Kê', icon: '📈' },
              { id: 'security', label: 'Bảo Mật', icon: '🔒' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  if (tab.id === 'statistics') loadStatistics()
                }}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-2xl font-bold">{overview.totalActions.toLocaleString()}</div>
                <div className="text-pink-100">Tổng Số Hành Động</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold">{overview.totalUsers.toLocaleString()}</div>
                <div className="text-purple-100">Người Dùng Hoạt Động</div>
              </div>
              <div className="bg-gradient-to-br from-pink-400 to-purple-400 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">🗂️</div>
                <div className="text-2xl font-bold">{overview.totalTables.toLocaleString()}</div>
                <div className="text-purple-100">Bảng Được Giám Sát</div>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">📈</div>
                <div className="text-2xl font-bold">{overview.averageActionsPerDay.toLocaleString()}</div>
                <div className="text-purple-100">Hành Động TB/Ngày</div>
              </div>
            </div>

            {/* Recent Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Hoạt Động Gần Đây</h2>
              <div className="space-y-3">
                {overview.recentActions.slice(0, 10).map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      log.actionType === 'INSERT' ? 'bg-green-500' :
                      log.actionType === 'UPDATE' ? 'bg-blue-500' :
                      log.actionType === 'DELETE' ? 'bg-red-500' : 'bg-gray-500'
                    }`}>
                      {log.actionType.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800">{log.userName}</span>
                        <span className="text-sm text-gray-500">{log.actionType}</span>
                        <span className="text-sm text-gray-500">trên</span>
                        <span className="text-sm font-medium text-purple-600">{log.tableName}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(log.actionTime).toLocaleString('vi-VN')} • {log.ipAddress}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Bộ Lọc</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Đặt Lại
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="ID Người Dùng"
                  value={filters.userId}
                  onChange={e => setFilters(f => ({ ...f, userId: e.target.value, page: 1 }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <select
                  value={filters.tableName}
                  onChange={e => setFilters(f => ({ ...f, tableName: e.target.value, page: 1 }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Tất Cả Bảng</option>
                  {tables.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  value={filters.actionType}
                  onChange={e => setFilters(f => ({ ...f, actionType: e.target.value, page: 1 }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Tất Cả Hành Động</option>
                  {actionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                
                {/* Date Inputs with Date Picker */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Từ ngày"
                    value={formatDateDisplay(filters.fromDate)}
                    readOnly
                    onClick={() => setShowFromDatePicker(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                  />
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Đến ngày"
                    value={formatDateDisplay(filters.toDate)}
                    readOnly
                    onClick={() => setShowToDatePicker(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportCsv}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                  >
                    Xuất CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                  >
                    Xuất Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Đang tải nhật ký...</p>
                </div>
              ) : logs && logs.auditLogs.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-pink-100 to-purple-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hành Động</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bảng</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Người Dùng</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Thời Gian</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Địa Chỉ IP</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Chi Tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {logs.auditLogs.map(log => (
                          <tr key={log.id} className="hover:bg-purple-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                log.actionType === 'INSERT' ? 'bg-green-100 text-green-700' :
                                log.actionType === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                log.actionType === 'DELETE' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {log.actionType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-purple-600 font-medium">{log.tableName}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{log.userName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(log.actionTime).toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{log.ipAddress}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setSelectedLog(log)}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                              >
                                Xem
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between flex-wrap gap-4">
                    <div className="text-sm text-gray-600">
                      Hiển thị {((filters.page - 1) * filters.pageSize) + 1} đến {Math.min(filters.page * filters.pageSize, logs.totalCount)} trong {logs.totalCount} mục
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                        disabled={filters.page === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                        disabled={filters.page >= logs.totalPages}
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg disabled:opacity-50 hover:shadow-lg"
                      >
                        Tiếp
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-gray-500">Không tìm thấy nhật ký</div>
              )}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && statistics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Hành Động Theo Loại</h3>
              <div className="space-y-3">
                {Object.entries(statistics.actionsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-700">{type}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                          style={{ width: `${(count / statistics.totalActions) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Hành Động Theo Bảng</h3>
              <div className="space-y-3">
                {Object.entries(statistics.actionsByTable).slice(0, 10).map(([table, count]) => (
                  <div key={table} className="flex items-center justify-between">
                    <span className="text-gray-700 truncate">{table}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${(count / statistics.totalActions) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Người Dùng Hoạt Động Hàng Đầu</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(statistics.topUsers).slice(0, 6).map(([user, count], idx) => (
                  <div key={user} className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{user}</div>
                      <div className="text-sm text-gray-600">{count} hành động</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date Pickers */}
      <DatePickerModal
        isOpen={showFromDatePicker}
        onClose={() => setShowFromDatePicker(false)}
        selectedDate={filters.fromDate}
        onDateSelect={(date) => setFilters(f => ({ ...f, fromDate: date, page: 1 }))}
        title="Chọn Ngày Bắt Đầu"
      />

      <DatePickerModal
        isOpen={showToDatePicker}
        onClose={() => setShowToDatePicker(false)}
        selectedDate={filters.toDate}
        onDateSelect={(date) => setFilters(f => ({ ...f, toDate: date, page: 1 }))}
        minDate={filters.fromDate}
        title="Chọn Ngày Kết Thúc"
      />

      {/* Log Detail Modal - Transparent */}
      {selectedLog && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedLog(null)}>
          <div className="bg-white/95 backdrop-blur-md rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-pink-500/95 to-purple-500/95 backdrop-blur-md text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Chi Tiết Nhật Ký Kiểm Toán</h3>
                <button onClick={() => setSelectedLog(null)} className="text-white hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Loại Hành Động</div>
                  <div className="font-semibold text-gray-800">{selectedLog.actionType}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tên Bảng</div>
                  <div className="font-semibold text-purple-600">{selectedLog.tableName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Người Dùng</div>
                  <div className="font-semibold text-gray-800">{selectedLog.userName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">ID Bản Ghi</div>
                  <div className="font-semibold text-gray-800">{selectedLog.recordId || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Địa Chỉ IP</div>
                  <div className="font-semibold text-gray-800">{selectedLog.ipAddress}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Thời Gian</div>
                  <div className="font-semibold text-gray-800">{new Date(selectedLog.actionTime).toLocaleString('vi-VN')}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">User Agent</div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 break-all">{selectedLog.userAgent}</div>
              </div>
              {selectedLog.oldValues && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Giá Trị Cũ</div>
                  <div className="p-3 bg-red-50 rounded-lg text-sm text-gray-700 max-h-40 overflow-y-auto">{selectedLog.oldValues}</div>
                </div>
              )}
              {selectedLog.newValues && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Giá Trị Mới</div>
                  <div className="p-3 bg-green-50 rounded-lg text-sm text-gray-700 max-h-40 overflow-y-auto">{selectedLog.newValues}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
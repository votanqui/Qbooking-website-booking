'use client'

import { useState, useEffect } from 'react'
import { refundAdminService } from '@/services/admin/adminrefund.service'
import { useToast } from '@/components/ui/Toast'
import {
  RefundTicketResponse,
  RefundTicketDetailResponse,
  RefundResponse,
  RefundStatisticsResponse,
  ProcessRefundRequest,
  RefundTicketStatus,
  REFUND_STATUS_LABELS,
  PAYMENT_METHOD_OPTIONS,
  formatCurrency,
  formatDate,
  getRefundStatusBadgeClass,
  validateProcessRefundRequest
} from '@/types/admin/adminrefund'

export default function RefundManagementPage() {
  const { showToast } = useToast()
  
  // State
  const [activeTab, setActiveTab] = useState<'tickets' | 'refunds' | 'statistics'>('tickets')
  const [tickets, setTickets] = useState<RefundTicketResponse[]>([])
  const [refunds, setRefunds] = useState<RefundResponse[]>([])
  const [statistics, setStatistics] = useState<RefundStatisticsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<RefundTicketDetailResponse | null>(null)
  
  // Process form
  const [processForm, setProcessForm] = useState<ProcessRefundRequest>({
    refundedAmount: 0,
    receiverBankName: '',
    receiverAccount: '',
    receiverName: '',
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    notes: ''
  })

  // Date filter for statistics
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  })

  // Load data
  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets()
    } else if (activeTab === 'refunds') {
      loadRefunds()
    } else if (activeTab === 'statistics') {
      loadStatistics()
    }
  }, [activeTab, filterStatus])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const response = await refundAdminService.getAllRefundTickets(filterStatus)
      if (response.success && response.data) {
        setTickets(response.data)
      } else {
        showToast(response.message || 'Không thể tải danh sách yêu cầu', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải dữ liệu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadRefunds = async () => {
    setLoading(true)
    try {
      const response = await refundAdminService.getRefunds()
      if (response.success && response.data) {
        setRefunds(response.data)
      } else {
        showToast(response.message || 'Không thể tải danh sách hoàn tiền', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải dữ liệu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const fromDate = dateRange.fromDate ? new Date(dateRange.fromDate) : undefined
      const toDate = dateRange.toDate ? new Date(dateRange.toDate) : undefined
      
      const response = await refundAdminService.getRefundStatistics(fromDate, toDate)
      if (response.success && response.data) {
        setStatistics(response.data)
      } else {
        showToast(response.message || 'Không thể tải thống kê', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải dữ liệu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (ticketId: number) => {
    try {
      const response = await refundAdminService.getRefundTicketDetail(ticketId)
      if (response.success && response.data) {
        setSelectedTicket(response.data)
        setShowDetailModal(true)
      } else {
        showToast(response.message || 'Không thể tải chi tiết', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi tải chi tiết', 'error')
    }
  }

  const handleOpenProcessModal = (ticket: RefundTicketDetailResponse) => {
    setSelectedTicket(ticket)
    setProcessForm({
      refundedAmount: ticket.requestedAmount,
      receiverBankName: ticket.bankName,
      receiverAccount: ticket.bankAccountNumber,
      receiverName: ticket.bankAccountName,
      paymentMethod: 'bank_transfer',
      paymentReference: '',
      notes: ''
    })
    setShowDetailModal(false)
    setShowProcessModal(true)
  }

  const handleProcessRefund = async () => {
    if (!selectedTicket) return

    const errors = validateProcessRefundRequest(processForm)
    if (errors.length > 0) {
      errors.forEach(error => showToast(error, 'error'))
      return
    }

    setLoading(true)
    try {
      const response = await refundAdminService.processRefund(selectedTicket.id, processForm)
      if (response.success) {
        showToast('Xử lý hoàn tiền thành công!', 'success')
        setShowProcessModal(false)
        loadTickets()
      } else {
        showToast(response.message || 'Không thể xử lý hoàn tiền', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi xử lý hoàn tiền', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectTicket = async (ticketId: number) => {
    if (!confirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')) return

    setLoading(true)
    try {
      const response = await refundAdminService.rejectRefund(ticketId)
      if (response.success) {
        showToast('Đã từ chối yêu cầu hoàn tiền', 'success')
        setShowDetailModal(false)
        loadTickets()
      } else {
        showToast(response.message || 'Không thể từ chối yêu cầu', 'error')
      }
    } catch (error) {
      showToast('Lỗi khi từ chối yêu cầu', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-6 border border-purple-100">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Quản Lý Hoàn Tiền
          </h1>
          <p className="text-gray-600">Xử lý yêu cầu hoàn tiền và theo dõi thống kê</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              activeTab === 'tickets'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-105'
                : 'bg-white/70 text-gray-700 hover:bg-white/90'
            }`}
          >
            Yêu Cầu Hoàn Tiền
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              activeTab === 'refunds'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-105'
                : 'bg-white/70 text-gray-700 hover:bg-white/90'
            }`}
          >
            Đã Hoàn Tiền
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              activeTab === 'statistics'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-105'
                : 'bg-white/70 text-gray-700 hover:bg-white/90'
            }`}
          >
            Thống Kê
          </button>
        </div>

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-purple-100">
            {/* Filter */}
            <div className="mb-6 flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-xl border border-purple-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(REFUND_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-pink-100 to-purple-100">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 rounded-tl-xl">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mã Booking</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Khách Hàng</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Số Tiền</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng Thái</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ngày Tạo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 rounded-tr-xl">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Đang tải...
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm">{ticket.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-purple-600">{ticket.bookingCode}</td>
                        <td className="px-4 py-3 text-sm">{ticket.customerName}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-pink-600">{formatCurrency(ticket.requestedAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRefundStatusBadgeClass(ticket.status)}`}>
                            {REFUND_STATUS_LABELS[ticket.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(ticket.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleViewDetail(ticket.id)}
                            className="px-4 py-1.5 bg-gradient-to-r from-pink-400 to-purple-500 text-white text-sm rounded-lg hover:shadow-lg transition-all"
                          >
                            Chi Tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Refunds Tab */}
        {activeTab === 'refunds' && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-purple-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-pink-100 to-purple-100">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 rounded-tl-xl">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mã Booking</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Khách Hàng</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Số Tiền Hoàn</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phương Thức</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mã Tham Chiếu</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 rounded-tr-xl">Ngày Hoàn</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Đang tải...
                      </td>
                    </tr>
                  ) : refunds.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    refunds.map((refund) => (
                      <tr key={refund.id} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm">{refund.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-purple-600">{refund.bookingCode}</td>
                        <td className="px-4 py-3 text-sm">{refund.customerName}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(refund.refundedAmount)}</td>
                        <td className="px-4 py-3 text-sm">
                          {PAYMENT_METHOD_OPTIONS.find(o => o.value === refund.paymentMethod)?.label || refund.paymentMethod}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{refund.paymentReference}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(refund.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            {/* Date Filter */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Lọc Theo Thời Gian</h3>
              <div className="flex gap-4">
                <input
                  type="date"
                  value={dateRange.fromDate}
                  onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
                  className="px-4 py-2 rounded-xl border border-purple-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <input
                  type="date"
                  value={dateRange.toDate}
                  onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
                  className="px-4 py-2 rounded-xl border border-purple-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  onClick={loadStatistics}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Áp Dụng
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-3xl shadow-xl p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Tổng Yêu Cầu</div>
                  <div className="text-3xl font-bold">{statistics.totalRefundTickets}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl shadow-xl p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Đã Chấp Thuận</div>
                  <div className="text-3xl font-bold">{statistics.approvedTickets}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-xl p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Đang Chờ</div>
                  <div className="text-3xl font-bold">{statistics.pendingTickets}</div>
                </div>
                <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-3xl shadow-xl p-6 text-white">
                  <div className="text-sm opacity-90 mb-2">Tổng Tiền Hoàn</div>
                  <div className="text-2xl font-bold">{formatCurrency(statistics.totalRefundAmount)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-200">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-t-3xl">
                <h2 className="text-2xl font-bold">Chi Tiết Yêu Cầu Hoàn Tiền</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Mã Booking</div>
                    <div className="font-semibold text-purple-600">{selectedTicket.bookingCode}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Property</div>
                    <div className="font-semibold">{selectedTicket.propertyName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Khách Hàng</div>
                    <div className="font-semibold">{selectedTicket.customerName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-semibold">{selectedTicket.customerEmail}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Số Tiền Yêu Cầu</div>
                    <div className="font-bold text-pink-600 text-lg">{formatCurrency(selectedTicket.requestedAmount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Trạng Thái</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRefundStatusBadgeClass(selectedTicket.status)}`}>
                      {REFUND_STATUS_LABELS[selectedTicket.status]}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Lý Do</div>
                  <div className="bg-purple-50 rounded-xl p-4">{selectedTicket.reason}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Ngân Hàng</div>
                    <div className="font-semibold">{selectedTicket.bankName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Số Tài Khoản</div>
                    <div className="font-semibold">{selectedTicket.bankAccountNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Chủ Tài Khoản</div>
                    <div className="font-semibold">{selectedTicket.bankAccountName}</div>
                  </div>
                </div>
                
                {selectedTicket.refund && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="font-semibold text-green-700 mb-2">Thông Tin Hoàn Tiền</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Số tiền đã hoàn: <span className="font-bold">{formatCurrency(selectedTicket.refund.refundedAmount)}</span></div>
                      <div>Phương thức: {PAYMENT_METHOD_OPTIONS.find(o => o.value === selectedTicket.refund?.paymentMethod)?.label}</div>
                      <div>Mã tham chiếu: {selectedTicket.refund.paymentReference}</div>
                      <div>Ngày hoàn: {formatDate(selectedTicket.refund.createdAt)}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 flex gap-3 justify-end border-t border-purple-100">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
                >
                  Đóng
                </button>
                {selectedTicket.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleRejectTicket(selectedTicket.id)}
                      className="px-6 py-2 bg-red-500 text-white rounded-xl hover:shadow-lg transition-all"
                      disabled={loading}
                    >
                      Từ Chối
                    </button>
                    <button
                      onClick={() => handleOpenProcessModal(selectedTicket)}
                      className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                      disabled={loading}
                    >
                      Xử Lý Hoàn Tiền
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Process Modal */}
        {showProcessModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-200">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-t-3xl">
                <h2 className="text-2xl font-bold">Xử Lý Hoàn Tiền</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-purple-50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-600">Booking: <span className="font-semibold text-purple-600">{selectedTicket.bookingCode}</span></div>
                  <div className="text-sm text-gray-600">Khách hàng: <span className="font-semibold">{selectedTicket.customerName}</span></div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số Tiền Hoàn *</label>
                  <input
                    type="number"
                    value={processForm.refundedAmount}
                    onChange={(e) => setProcessForm({ ...processForm, refundedAmount: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngân Hàng Người Nhận *</label>
                  <input
                    type="text"
                    value={processForm.receiverBankName}
                    onChange={(e) => setProcessForm({ ...processForm, receiverBankName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số Tài Khoản *</label>
                  <input
                    type="text"
                    value={processForm.receiverAccount}
                    onChange={(e) => setProcessForm({ ...processForm, receiverAccount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tên Người Nhận *</label>
                  <input
                    type="text"
                    value={processForm.receiverName}
                    onChange={(e) => setProcessForm({ ...processForm, receiverName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phương Thức Thanh Toán *</label>
                  <select
                    value={processForm.paymentMethod}
                    onChange={(e) => setProcessForm({ ...processForm, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mã Tham Chiếu *</label>
                  <input
                    type="text"
                    value={processForm.paymentReference}
                    onChange={(e) => setProcessForm({ ...processForm, paymentReference: e.target.value })}
                    placeholder="Mã giao dịch, mã chuyển khoản..."
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi Chú</label>
                  <textarea
                    value={processForm.notes}
                    onChange={(e) => setProcessForm({ ...processForm, notes: e.target.value })}
                    rows={3}
                    placeholder="Ghi chú thêm về giao dịch..."
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
              <div className="p-6 flex gap-3 justify-end border-t border-purple-100">
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  onClick={handleProcessRefund}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Xác Nhận Hoàn Tiền'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
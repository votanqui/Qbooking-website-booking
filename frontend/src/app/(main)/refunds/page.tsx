'use client';
import React, { useState, useEffect } from 'react';
import { refundService } from '@/services/main/refund.service';
import { 
  RefundTicketResponse, 
  RefundTicketDetailResponse,
  formatCurrency, 
  formatDate,
  getStatusLabel,
  REFUND_STATUS_LABELS 
} from '@/types/main/refund';

export default function CustomerRefundPage() {
  const [tickets, setTickets] = useState<RefundTicketResponse[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<RefundTicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelingTicketId, setCancelingTicketId] = useState<number | null>(null);

  useEffect(() => {
    fetchRefundTickets();
  }, []);

  const fetchRefundTickets = async () => {
    try {
      setLoading(true);
      const response = await refundService.getMyRefundTickets();
      if (response.success && response.data) {
        setTickets(response.data);
      }
    } catch (error) {
      console.error('Error fetching refund tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewTicketDetail = async (ticketId: number) => {
    try {
      setDetailLoading(true);
      setShowDetailModal(true);
      const response = await refundService.getMyRefundTicketDetail(ticketId);
      if (response.success && response.data) {
        setSelectedTicket(response.data);
      }
    } catch (error) {
      console.error('Error fetching ticket detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!cancelingTicketId) return;
    
    try {
      const response = await refundService.cancelRefundTicket(cancelingTicketId);
      if (response.success) {
        await fetchRefundTickets();
        setShowCancelModal(false);
        setCancelingTicketId(null);
        alert('Hủy yêu cầu hoàn tiền thành công!');
      } else {
        alert(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error canceling ticket:', error);
      alert('Có lỗi xảy ra khi hủy yêu cầu');
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    filterStatus === 'all' || ticket.status === filterStatus
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-300',
      approved: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-300',
      rejected: 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border-rose-300',
      cancelled: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-300',
    };
    return styles[status as keyof typeof styles] || styles.cancelled;
  };

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    approved: tickets.filter(t => t.status === 'approved').length,
    rejected: tickets.filter(t => t.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Yêu cầu hoàn tiền</h1>
              <p className="text-purple-100 mt-1">Quản lý các yêu cầu hoàn tiền của bạn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100 hover:border-purple-300 transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tổng yêu cầu</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-100 hover:border-amber-300 transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Đang chờ</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-emerald-100 hover:border-emerald-300 transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Đã duyệt</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-rose-100 hover:border-rose-300 transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Từ chối</p>
                <p className="text-3xl font-bold text-rose-600 mt-1">{stats.rejected}</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-xl">
                <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-100">
          {/* Filter Tabs */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
            <div className="flex gap-2 p-4 overflow-x-auto">
              {[
                { value: 'all', label: 'Tất cả', icon: '📋' },
                { value: 'pending', label: 'Đang chờ', icon: '⏳' },
                { value: 'approved', label: 'Đã duyệt', icon: '✅' },
                { value: 'rejected', label: 'Từ chối', icon: '❌' },
                { value: 'cancelled', label: 'Đã hủy', icon: '🚫' },
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                    filterStatus === filter.value
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600 border border-gray-200'
                  }`}
                >
                  <span className="mr-2">{filter.icon}</span>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                  <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có yêu cầu hoàn tiền</h3>
                <p className="text-gray-500">Bạn có thể tạo yêu cầu hoàn tiền từ trang booking của mình</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className="group bg-gradient-to-r from-white to-purple-50 rounded-xl p-6 border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => viewTicketDetail(ticket.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-full">
                            #{ticket.id}
                          </span>
                          <span className={`px-4 py-1 text-sm font-medium rounded-full border-2 ${getStatusBadge(ticket.status)}`}>
                            {getStatusLabel(ticket.status as any)}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                          {ticket.propertyName}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="font-medium">Mã booking:</span>
                            <span className="text-purple-600 font-semibold">{ticket.bookingCode}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Số tiền:</span>
                            <span className="text-pink-600 font-bold">{formatCurrency(ticket.requestedAmount)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Ngày tạo:</span>
                            <span>{formatDate(ticket.createdAt)}</span>
                          </div>
                          
                          {ticket.processedAt && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Đã xử lý:</span>
                              <span>{formatDate(ticket.processedAt)}</span>
                            </div>
                          )}
                        </div>
                        
                        {ticket.reason && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold text-purple-700">Lý do:</span> {ticket.reason}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {ticket.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelingTicketId(ticket.id);
                              setShowCancelModal(true);
                            }}
                            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                          >
                            Hủy yêu cầu
                          </button>
                        )}
                        <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-purple-200">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Chi tiết yêu cầu hoàn tiền</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedTicket(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
                </div>
              ) : selectedTicket && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className={`px-5 py-2 text-sm font-medium rounded-full border-2 ${getStatusBadge(selectedTicket.status)}`}>
                      {getStatusLabel(selectedTicket.status as any)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200">
                      <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Thông tin chung
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Mã yêu cầu:</span> <span className="text-purple-600 font-bold">#{selectedTicket.id}</span></div>
                        <div><span className="font-medium">Mã booking:</span> <span className="text-purple-600 font-semibold">{selectedTicket.bookingCode}</span></div>
                        <div><span className="font-medium">Property:</span> {selectedTicket.propertyName}</div>
                        <div><span className="font-medium">Ngày tạo:</span> {formatDate(selectedTicket.createdAt)}</div>
                        {selectedTicket.processedAt && (
                          <div><span className="font-medium">Ngày xử lý:</span> {formatDate(selectedTicket.processedAt)}</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-5 rounded-xl border-2 border-pink-200">
                      <h3 className="font-semibold text-pink-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Thông tin thanh toán
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Số tiền yêu cầu:</span> <span className="text-pink-600 font-bold">{formatCurrency(selectedTicket.requestedAmount)}</span></div>
                        <div><span className="font-medium">Ngân hàng:</span> {selectedTicket.bankName}</div>
                        <div><span className="font-medium">Số tài khoản:</span> {selectedTicket.bankAccountNumber}</div>
                        <div><span className="font-medium">Chủ tài khoản:</span> {selectedTicket.bankAccountName}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-5 rounded-xl border-2 border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Lý do hoàn tiền
                    </h3>
                    <p className="text-gray-700">{selectedTicket.reason}</p>
                  </div>

                  {selectedTicket.refund && (
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-xl border-2 border-emerald-300">
                      <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Thông tin hoàn tiền
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="font-medium">Số tiền đã hoàn:</span> <span className="text-emerald-600 font-bold">{formatCurrency(selectedTicket.refund.refundedAmount)}</span></div>
                        <div><span className="font-medium">Ngân hàng nhận:</span> {selectedTicket.refund.receiverBankName}</div>
                        <div><span className="font-medium">Số TK nhận:</span> {selectedTicket.refund.receiverAccount}</div>
                        <div><span className="font-medium">Người nhận:</span> {selectedTicket.refund.receiverName}</div>
                        <div><span className="font-medium">Phương thức:</span> {selectedTicket.refund.paymentMethod}</div>
                        <div><span className="font-medium">Mã tham chiếu:</span> {selectedTicket.refund.paymentReference}</div>
                      </div>
                      {selectedTicket.refund.notes && (
                        <div className="mt-3 pt-3 border-t border-emerald-200">
                          <span className="font-medium">Ghi chú:</span> {selectedTicket.refund.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border-2 border-rose-200">
            <div className="bg-gradient-to-r from-rose-500 to-red-500 text-white p-6 rounded-t-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Xác nhận hủy yêu cầu
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Bạn có chắc chắn muốn hủy yêu cầu hoàn tiền này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelingTicketId(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Không, giữ lại
                </button>
                <button
                  onClick={handleCancelTicket}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white rounded-xl font-medium transition-all shadow-lg"
                >
                  Có, hủy yêu cầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
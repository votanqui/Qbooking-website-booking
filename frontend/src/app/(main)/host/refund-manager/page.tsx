'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, DollarSign, Eye, ChevronDown, AlertCircle, CreditCard, User, Calendar, FileText, Building } from 'lucide-react';
import { refundService } from '@/services/main/refund.service';
import { userService } from '@/services/main/user.service';
import { RefundTicketResponse, RefundTicketDetailResponse } from '@/types/main/refund';

// Helper functions (giữ nguyên)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Đang chờ xử lý',
    approved: 'Đã chấp thuận',
    rejected: 'Đã từ chối',
    cancelled: 'Đã hủy',
  };
  return labels[status] || status;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`}>
      {message}
    </div>
  );
};

interface RefundDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: RefundTicketDetailResponse | null;
}

const RefundDetailModal: React.FC<RefundDetailModalProps> = ({ isOpen, onClose, ticket }) => {
  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
        {/* Header với background trong suốt */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-500/90 to-purple-500/90 backdrop-blur-md text-white p-6 rounded-t-2xl border-b border-white/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Chi tiết yêu cầu hoàn tiền</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <p className="text-pink-100/90 mt-2">#{ticket.bookingCode}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="bg-gradient-to-r from-pink-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Trạng thái:</span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(ticket.status)} backdrop-blur-sm`}>
                {getStatusLabel(ticket.status)}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-pink-50/80 backdrop-blur-sm rounded-xl p-4 border border-pink-100/50">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-pink-600" />
              <h3 className="font-semibold text-pink-700">Thông tin khách hàng</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Họ tên:</span>
                <span className="font-medium">{ticket.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{ticket.customerEmail}</span>
              </div>
            </div>
          </div>

          {/* Booking Info */}
          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100/50">
            <div className="flex items-center gap-2 mb-3">
              <Building className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-700">Thông tin đặt phòng</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã booking:</span>
                <span className="font-medium">{ticket.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Property:</span>
                <span className="font-medium">{ticket.propertyName}</span>
              </div>
            </div>
          </div>

          {/* Refund Amount */}
          <div className="bg-gradient-to-r from-pink-100/80 to-purple-100/80 backdrop-blur-sm rounded-xl p-4 border border-pink-200/50">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-pink-600" />
              <h3 className="font-semibold text-pink-700">Số tiền yêu cầu hoàn</h3>
            </div>
            <p className="text-3xl font-bold text-pink-600">
              {formatCurrency(ticket.requestedAmount)}
            </p>
          </div>

          {/* Bank Info */}
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100/50">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-700">Thông tin ngân hàng</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ngân hàng:</span>
                <span className="font-medium">{ticket.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tài khoản:</span>
                <span className="font-medium">{ticket.bankAccountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chủ tài khoản:</span>
                <span className="font-medium">{ticket.bankAccountName}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700">Lý do hoàn tiền</h3>
            </div>
            <p className="text-gray-700">{ticket.reason}</p>
          </div>

          {/* Timeline */}
          <div className="bg-gradient-to-r from-pink-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-pink-600" />
              <h3 className="font-semibold text-pink-700">Thời gian</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày tạo:</span>
                <span className="font-medium">{formatDate(ticket.createdAt)}</span>
              </div>
              {ticket.processedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày xử lý:</span>
                  <span className="font-medium">{formatDate(ticket.processedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Refund Details if approved */}
          {ticket.refund && (
            <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4 border-2 border-green-200/50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-700">Thông tin hoàn tiền</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền đã hoàn:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(ticket.refund.refundedAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức:</span>
                  <span className="font-medium">{ticket.refund.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã tham chiếu:</span>
                  <span className="font-medium">{ticket.refund.paymentReference}</span>
                </div>
                {ticket.refund.notes && (
                  <div className="pt-2 border-t border-green-200/50">
                    <span className="text-gray-600 block mb-1">Ghi chú:</span>
                    <p className="text-gray-700">{ticket.refund.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer với background trong suốt */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 p-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Phần còn lại của component HostRefundManager giữ nguyên
const HostRefundManager: React.FC = () => {
  const [refundTickets, setRefundTickets] = useState<RefundTicketResponse[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<RefundTicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<RefundTicketDetailResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const checkAuth = async () => {
    try {
      const response = await userService.getProfile();
      if (response.success && response.data) {
        const userRole = response.data.role;
        if (userRole === 'host' || userRole === 'admin') {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          showToast('Bạn không có quyền truy cập trang này. Chỉ dành cho Host.', 'error');
        }
      } else {
        setIsAuthorized(false);
        showToast('Không thể xác thực người dùng. Vui lòng đăng nhập lại.', 'error');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthorized(false);
      showToast('Lỗi xác thực. Vui lòng đăng nhập lại.', 'error');
    }
  };

  const fetchRefundTickets = async () => {
    if (!isAuthorized) return;
    
    try {
      setLoading(true);
      const response = await refundService.getHostRefundTickets(statusFilter || undefined);
      
      if (response.success && response.data) {
        setRefundTickets(Array.isArray(response.data) ? response.data : []);
      } else {
        showToast(response.message || 'Không thể tải danh sách yêu cầu hoàn tiền', 'error');
      }
    } catch (error) {
      console.error('Error fetching refund tickets:', error);
      showToast('Lỗi khi tải danh sách yêu cầu hoàn tiền', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (ticketId: number) => {
    try {
      const response = await refundService.getHostRefundTicketDetail(ticketId);
      
      if (response.success && response.data) {
        setSelectedTicket(response.data);
        setShowDetailModal(true);
      } else {
        showToast(response.message || 'Không thể tải chi tiết yêu cầu', 'error');
      }
    } catch (error) {
      console.error('Error loading refund detail:', error);
      showToast('Lỗi khi tải chi tiết yêu cầu', 'error');
    }
  };

  const toggleTicketExpand = (ticketId: number) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchRefundTickets();
    }
  }, [isAuthorized, statusFilter]);

  useEffect(() => {
    let filtered = refundTickets;
    
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.customerName && ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ticket.customerEmail && ticket.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ticket.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTickets(filtered);
  }, [refundTickets, searchTerm]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Truy cập bị từ chối</h2>
          <p className="text-gray-600 mb-6">
            Trang này chỉ dành cho Host. Vui lòng đăng nhập với tài khoản Host để tiếp tục.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-pink-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Quản lý yêu cầu hoàn tiền
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Tổng: {filteredTickets.length} yêu cầu
              </span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Search */}
        <div className="lg:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm yêu cầu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className={`bg-white rounded-2xl shadow-sm p-4 mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Desktop Search */}
            <div className="hidden lg:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm yêu cầu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-1">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-pink-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Đang chờ xử lý</option>
                <option value="approved">Đã chấp thuận</option>
                <option value="rejected">Đã từ chối</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-pink-600">Đang tải danh sách yêu cầu...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Không có yêu cầu hoàn tiền</h3>
            <p className="text-gray-600 mb-4">Chưa có yêu cầu nào phù hợp với bộ lọc của bạn.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                {/* Mobile Header */}
                <div 
                  className="p-4 cursor-pointer lg:cursor-auto"
                  onClick={() => typeof window !== 'undefined' && window.innerWidth < 1024 && toggleTicketExpand(ticket.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                        <span className="font-bold text-pink-700 text-sm truncate">
                          #{ticket.bookingCode}
                        </span>
                      </div>
                      <p className="text-gray-800 font-medium truncate text-sm">
                        {ticket.propertyName}
                      </p>
                      <p className="text-gray-600 text-xs truncate">{ticket.customerName || 'N/A'}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-pink-500 transition-transform lg:hidden ${expandedTicket === ticket.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Quick info for mobile */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600 lg:hidden">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(ticket.createdAt).split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="font-bold text-pink-600">{formatCurrency(ticket.requestedAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <div className={`border-t border-pink-50 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'block' : expandedTicket === ticket.id ? 'block' : 'hidden'}`}>
                  <div className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      {/* Customer Information */}
                      <div className="bg-pink-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-pink-600" />
                          <span className="font-semibold text-pink-700 text-sm">Thông tin khách</span>
                        </div>
                        <p className="text-gray-800 text-sm font-medium">{ticket.customerName || 'N/A'}</p>
                        <p className="text-gray-600 text-xs">{ticket.customerEmail || 'N/A'}</p>
                      </div>

                      {/* Bank Details */}
                      <div className="bg-purple-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-purple-700 text-sm">Ngân hàng</span>
                        </div>
                        <p className="text-gray-800 text-sm font-medium">{ticket.bankName}</p>
                        <p className="text-gray-600 text-xs">{ticket.bankAccountNumber}</p>
                        <p className="text-gray-600 text-xs">{ticket.bankAccountName}</p>
                      </div>

                      {/* Amount */}
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-pink-600" />
                          <span className="font-semibold text-pink-700 text-sm">Số tiền</span>
                        </div>
                        <p className="text-lg font-bold text-pink-600 mb-1">
                          {formatCurrency(ticket.requestedAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-700 text-sm">Lý do hoàn tiền</span>
                      </div>
                      <p className="text-gray-700 text-sm">{ticket.reason}</p>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 rounded-xl p-3 mb-4">
                      <div>
                        <span className="text-gray-500 block">Ngày tạo</span>
                        <span className="font-medium text-pink-600">{formatDate(ticket.createdAt)}</span>
                      </div>
                      {ticket.processedAt && (
                        <div>
                          <span className="text-gray-500 block">Ngày xử lý</span>
                          <span className="font-medium text-pink-600">{formatDate(ticket.processedAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex gap-2 pt-4 border-t border-pink-100">
                      <button
                        onClick={() => handleViewDetail(ticket.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Count Mobile */}
        {!loading && filteredTickets.length > 0 && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl p-3 shadow-2xl z-20">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Tổng số yêu cầu:</span>
              <span className="font-bold text-lg">{filteredTickets.length}</span>
            </div>
          </div>
        )}
      </div>

      <RefundDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        ticket={selectedTicket}
      />
    </div>
  );
};

export default HostRefundManager;
'use client';

import { useState, useEffect } from 'react';
import { adminBookingService } from '@/services/admin/adminbooking.service';
import {
  AdminBookingListDto,
  DashboardOverviewDto,
  DashboardAlertsDto,
  TopPropertyDto,
  TopCustomerDto,
  AdminBookingDetailDto
} from '@/types/admin/adminbooking';
import { useToast } from '@/components/ui/Toast';

export default function AdminBookingDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'statistics'>('overview');
  const [overview, setOverview] = useState<DashboardOverviewDto | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlertsDto | null>(null);
  const [bookings, setBookings] = useState<AdminBookingListDto[]>([]);
  const [topProperties, setTopProperties] = useState<TopPropertyDto[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomerDto[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingDetailDto | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: '',
    page: 1,
    pageSize: 20
  });
  const [totalPages, setTotalPages] = useState(1);

  const { showToast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings();
    }
  }, [activeTab, filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, alertsRes, propertiesRes, customersRes] = await Promise.all([
        adminBookingService.getDashboardOverview({}),
        adminBookingService.getDashboardAlerts(),
        adminBookingService.getTopProperties({ top: 5 }),
        adminBookingService.getTopCustomers({ top: 5 })
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data);
      if (propertiesRes.success) setTopProperties(propertiesRes.data || []);
      if (customersRes.success) setTopCustomers(customersRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      showToast('Có lỗi xảy ra khi tải dữ liệu dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await adminBookingService.getAllBookings(filters);
      if (response.success && response.data) {
        setBookings(response.data.bookings);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      showToast('Có lỗi xảy ra khi tải danh sách booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewBookingDetail = async (bookingId: number) => {
    try {
      const response = await adminBookingService.getBookingDetail(bookingId);
      if (response.success && response.data) {
        setSelectedBooking(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error loading booking detail:', error);
      showToast('Có lỗi xảy ra khi tải chi tiết booking', 'error');
    }
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const response = await adminBookingService.updateBookingStatus(bookingId, {
        status: newStatus as any,
        note: 'Updated by admin'
      });
      if (response.success) {
        loadBookings();
        showToast('Cập nhật trạng thái thành công!', 'success');
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Có lỗi xảy ra khi cập nhật trạng thái', 'error');
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      showToast('Vui lòng nhập lý do hủy', 'warning');
      return;
    }

    try {
      const response = await adminBookingService.cancelBooking(selectedBooking.id, { 
        reason: cancelReason 
      });
      if (response.success) {
        loadBookings();
        showToast('Hủy booking thành công!', 'success');
        setShowCancelModal(false);
        setShowDetailModal(false);
        setCancelReason('');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showToast('Có lỗi xảy ra khi hủy booking', 'error');
    }
  };

  const openCancelModal = () => {
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelReason('');
  };

  const exportBookings = async () => {
    try {
      const blob = await adminBookingService.exportBookings({
        ...filters,
        format: 'csv'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Xuất dữ liệu thành công!', 'success');
    } catch (error) {
      console.error('Error exporting bookings:', error);
      showToast('Có lỗi xảy ra khi xuất dữ liệu', 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      checkedIn: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-purple-100 text-purple-800',
      partial_refund: 'bg-pink-100 text-pink-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Admin Booking Dashboard
        </h1>
        <p className="text-gray-600">Quản lý và theo dõi tất cả đặt phòng</p>
      </div>

      {/* Alerts Banner */}
      {alerts && alerts.totalAlertsCount > 0 && (
        <div className="mb-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-4 md:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-lg mb-1">🔔 Cảnh báo hệ thống</h3>
              <p className="text-pink-100 text-sm">Có {alerts.totalAlertsCount} vấn đề cần xử lý</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {alerts.pendingBookingsCount > 0 && (
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <div className="font-semibold">{alerts.pendingBookingsCount}</div>
                  <div className="text-xs">Chờ xác nhận</div>
                </div>
              )}
              {alerts.checkInsTodayCount > 0 && (
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <div className="font-semibold">{alerts.checkInsTodayCount}</div>
                  <div className="text-xs">Check-in hôm nay</div>
                </div>
              )}
              {alerts.unpaidBookingsCount > 0 && (
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <div className="font-semibold">{alerts.unpaidBookingsCount}</div>
                  <div className="text-xs">Chưa thanh toán</div>
                </div>
              )}
              {alerts.pendingRefundsCount > 0 && (
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <div className="font-semibold">{alerts.pendingRefundsCount}</div>
                  <div className="text-xs">Yêu cầu hoàn tiền</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['overview', 'bookings', 'statistics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'overview' && '📊 Tổng quan'}
            {tab === 'bookings' && '📋 Danh sách'}
            {tab === 'statistics' && '📈 Thống kê'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-100">
              <div className="text-pink-600 text-3xl mb-2">📦</div>
              <div className="text-2xl font-bold text-gray-800">{overview.totalBookings}</div>
              <div className="text-sm text-gray-600">Tổng đặt phòng</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100">
              <div className="text-purple-600 text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(overview.totalRevenue)}</div>
              <div className="text-sm text-gray-600">Tổng doanh thu</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-100">
              <div className="text-pink-600 text-3xl mb-2">⏳</div>
              <div className="text-2xl font-bold text-gray-800">{overview.pendingBookings}</div>
              <div className="text-sm text-gray-600">Chờ xác nhận</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100">
              <div className="text-purple-600 text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-gray-800">{overview.completedBookings}</div>
              <div className="text-sm text-gray-600">Hoàn thành</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Trạng thái đặt phòng</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{overview.pendingBookings}</div>
                <div className="text-sm text-gray-600 mt-1">Chờ xác nhận</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{overview.confirmedBookings}</div>
                <div className="text-sm text-gray-600 mt-1">Đã xác nhận</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{overview.checkedInBookings}</div>
                <div className="text-sm text-gray-600 mt-1">Đã nhận phòng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{overview.completedBookings}</div>
                <div className="text-sm text-gray-600 mt-1">Hoàn thành</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{overview.cancelledBookings}</div>
                <div className="text-sm text-gray-600 mt-1">Đã hủy</div>
              </div>
            </div>
          </div>

          {/* Top Properties & Customers */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Properties */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span> Top Properties
              </h3>
              <div className="space-y-3">
                {topProperties.map((prop, idx) => (
                  <div key={prop.propertyId} className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{prop.propertyName}</div>
                      <div className="text-sm text-gray-600">{prop.totalBookings} bookings</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">{formatCurrency(prop.totalRevenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⭐</span> Top Khách hàng
              </h3>
              <div className="space-y-3">
                {topCustomers.map((customer, idx) => (
                  <div key={customer.customerId} className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{customer.customerName}</div>
                      <div className="text-sm text-gray-600">{customer.totalBookings} bookings</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-pink-600">{formatCurrency(customer.totalSpent)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Bộ lọc</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-500 outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="checkedIn">Đã nhận phòng</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value, page: 1 })}
                className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-500 outline-none"
                placeholder="Từ ngày"
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value, page: 1 })}
                className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-500 outline-none"
                placeholder="Đến ngày"
              />
              <button
                onClick={exportBookings}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => viewBookingDetail(booking.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg text-gray-800">{booking.bookingCode}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>👤 Khách: <span className="font-semibold">{booking.guestName}</span></div>
                      <div>🏨 Property: <span className="font-semibold">{booking.propertyName}</span></div>
                      <div>📅 Check-in: <span className="font-semibold">{formatDate(booking.checkIn)}</span></div>
                      <div>📅 Check-out: <span className="font-semibold">{formatDate(booking.checkOut)}</span></div>
                      <div>🛏️ Phòng: <span className="font-semibold">{booking.roomsCount} x {booking.roomTypeName}</span></div>
                      <div>👥 Khách: <span className="font-semibold">{booking.adults} người lớn, {booking.children} trẻ em</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      {formatCurrency(booking.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{booking.nights} đêm</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                disabled={filters.page === 1}
                className="px-4 py-2 rounded-xl bg-white text-gray-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ← Trước
              </button>
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold">
                {filters.page} / {totalPages}
              </div>
              <button
                onClick={() => setFilters({ ...filters, page: Math.min(totalPages, filters.page + 1) })}
                disabled={filters.page === totalPages}
                className="px-4 py-2 rounded-xl bg-white text-gray-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Booking Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Chi tiết đặt phòng</h2>
                  <p className="text-pink-100">{selectedBooking.bookingCode}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Actions */}
              <div className="flex gap-2 flex-wrap">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                  {selectedBooking.paymentStatus}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4">
                <h3 className="font-bold text-gray-800 mb-3">Thông tin khách hàng</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>👤 Tên: <span className="font-semibold">{selectedBooking.customerName}</span></div>
                  <div>📧 Email: <span className="font-semibold">{selectedBooking.customerEmail}</span></div>
                  <div>📱 SĐT: <span className="font-semibold">{selectedBooking.customerPhone}</span></div>
                  <div>🎫 ID: <span className="font-semibold">{selectedBooking.guestIdNumber || 'N/A'}</span></div>
                </div>
              </div>

              {/* Property Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                <h3 className="font-bold text-gray-800 mb-3">Thông tin property</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>🏨 Tên: <span className="font-semibold">{selectedBooking.propertyName}</span></div>
                  <div>📍 Địa chỉ: <span className="font-semibold">{selectedBooking.propertyAddress}</span></div>
                  <div>👨‍💼 Host: <span className="font-semibold">{selectedBooking.hostName}</span></div>
                  <div>📧 Host email: <span className="font-semibold">{selectedBooking.hostEmail}</span></div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4">
                <h3 className="font-bold text-gray-800 mb-3">Chi tiết đặt phòng</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>🛏️ Loại phòng: <span className="font-semibold">{selectedBooking.roomTypeName}</span></div>
                  <div>📦 Số phòng: <span className="font-semibold">{selectedBooking.roomsCount}</span></div>
                  <div>📅 Check-in: <span className="font-semibold">{formatDate(selectedBooking.checkIn)}</span></div>
                  <div>📅 Check-out: <span className="font-semibold">{formatDate(selectedBooking.checkOut)}</span></div>
                  <div>🌙 Số đêm: <span className="font-semibold">{selectedBooking.nights}</span></div>
                  <div>👥 Khách: <span className="font-semibold">{selectedBooking.adults} người lớn, {selectedBooking.children} trẻ em</span></div>
                </div>
                {selectedBooking.specialRequests && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Yêu cầu đặc biệt:</div>
                    <div className="text-sm font-semibold mt-1">{selectedBooking.specialRequests}</div>
                  </div>
                )}
              </div>

              {/* Financial Breakdown */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                <h3 className="font-bold text-gray-800 mb-3">Chi tiết thanh toán</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Giá phòng:</span>
                    <span className="font-semibold">{formatCurrency(selectedBooking.roomPrice)}</span>
                  </div>
                  {selectedBooking.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá ({selectedBooking.discountPercent}%):</span>
                      <span className="font-semibold">-{formatCurrency(selectedBooking.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Phí dịch vụ:</span>
                    <span className="font-semibold">{formatCurrency(selectedBooking.serviceFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thuế (10%):</span>
                    <span className="font-semibold">{formatCurrency(selectedBooking.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300 text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-purple-600">{formatCurrency(selectedBooking.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Refund Info */}
              {selectedBooking.refundTicket && (
                <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200">
                  <h3 className="font-bold text-red-800 mb-3">Yêu cầu hoàn tiền</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Số tiền yêu cầu:</span>
                      <span className="font-semibold text-red-600">{formatCurrency(selectedBooking.refundTicket.requestedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedBooking.refundTicket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedBooking.refundTicket.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedBooking.refundTicket.status}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-red-200">
                      <div className="text-gray-600">Lý do:</div>
                      <div className="font-semibold mt-1">{selectedBooking.refundTicket.reason}</div>
                    </div>
                    <div className="pt-2 border-t border-red-200">
                      <div className="text-gray-600">Thông tin ngân hàng:</div>
                      <div className="font-semibold mt-1">
                        {selectedBooking.refundTicket.bankName} - {selectedBooking.refundTicket.bankAccountNumber}<br/>
                        {selectedBooking.refundTicket.bankAccountName}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Refunds Processed */}
              {selectedBooking.refunds && selectedBooking.refunds.length > 0 && (
                <div className="bg-green-50 rounded-2xl p-4 border-2 border-green-200">
                  <h3 className="font-bold text-green-800 mb-3">Lịch sử hoàn tiền</h3>
                  <div className="space-y-3">
                    {selectedBooking.refunds.map((refund) => (
                      <div key={refund.id} className="bg-white rounded-xl p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-gray-600">Ngày hoàn: {formatDate(refund.createdAt)}</div>
                          <div className="font-bold text-green-600">{formatCurrency(refund.refundedAmount)}</div>
                        </div>
                        <div className="text-sm">
                          <div>Phương thức: <span className="font-semibold">{refund.paymentMethod}</span></div>
                          <div>Người duyệt: <span className="font-semibold">{refund.approvedByName}</span></div>
                          {refund.notes && <div className="mt-1 text-gray-600">Ghi chú: {refund.notes}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {selectedBooking.reviews && selectedBooking.reviews.length > 0 && (
                <div className="bg-yellow-50 rounded-2xl p-4 border-2 border-yellow-200">
                  <h3 className="font-bold text-yellow-800 mb-3">Đánh giá</h3>
                  <div className="space-y-3">
                    {selectedBooking.reviews.map((review) => (
                      <div key={review.id} className="bg-white rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-yellow-500 font-bold">{review.overallRating}/5 ⭐</div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            review.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {review.status}
                          </span>
                        </div>
                        <div className="font-semibold text-gray-800 mb-1">{review.title}</div>
                        <div className="text-sm text-gray-600">{review.reviewText}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                {selectedBooking.status === 'pending' && (
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    ✅ Xác nhận
                  </button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'checkedIn')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    🏠 Check-in
                  </button>
                )}
                {selectedBooking.status === 'checkedIn' && (
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    ✨ Hoàn thành
                  </button>
                )}
                {!['cancelled', 'completed'].includes(selectedBooking.status) && (
                  <button
                    onClick={openCancelModal}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    ❌ Hủy booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận hủy booking</h3>
              <p className="text-gray-600 mb-4">Bạn có chắc muốn hủy booking này? Hành động này không thể hoàn tác.</p>
              
              <div className="mb-4">
                <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                  Lý do hủy <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy booking..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeCancelModal}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!cancelReason.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Thống kê chi tiết</h3>
          <p className="text-gray-600">Chức năng thống kê chi tiết đang được phát triển...</p>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl p-6">
              <div className="text-3xl mb-2">📊</div>
              <div className="font-bold text-gray-800 mb-1">Tỷ lệ chuyển đổi</div>
              <div className="text-2xl font-bold text-purple-600">
                {overview ? Math.round((overview.confirmedBookings / overview.totalBookings) * 100) : 0}%
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6">
              <div className="text-3xl mb-2">💵</div>
              <div className="font-bold text-gray-800 mb-1">Giá trị TB/Booking</div>
              <div className="text-2xl font-bold text-pink-600">
                {overview ? formatCurrency(overview.averageBookingValue) : formatCurrency(0)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl p-6">
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-bold text-gray-800 mb-1">Tỷ lệ lấp đầy</div>
              <div className="text-2xl font-bold text-purple-600">
                {overview ? Math.round(overview.occupancyRate) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
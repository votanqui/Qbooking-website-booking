'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, Eye, X, Clock, Users, MapPin, Phone, Mail, CreditCard, AlertTriangle, DollarSign, Star } from 'lucide-react';
import { bookingService } from '@/services/main/booking.service';
import { BookingDto, BookingDetailDto, BookingStatus, PaymentStatus } from '@/types/main/booking';
import { useToast } from '@/components/ui/Toast';

// Import separate modal components
import CancelBookingModal from '@/components/modals/CancelBookingModal';
import RefundRequestModal from '@/components/modals/RefundRequestModal';
import ReviewModal from '@/components/modals/ReviewModal';
const MyBookingsPage = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingCodeFilter, setBookingCodeFilter] = useState('');
  const [propertyNameFilter, setPropertyNameFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [selectedBooking, setSelectedBooking] = useState<BookingDetailDto | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  // Separate modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [modalBooking, setModalBooking] = useState<BookingDto | null>(null);

  // State để kiểm soát việc hiển thị toast
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async (showToastMessage = true) => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings({
        bookingCode: bookingCodeFilter || undefined,
        propertyName: propertyNameFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
      });
      
      // FIX: Chỉ hiển thị toast khi có message từ API và không phải là lần fetch đầu tiên
      if (response.success && response.data) {
        setBookings(response.data);
        // Chỉ hiển thị toast khi có message và được phép hiển thị
        if (response.message && hasFetchedInitialData && showToastMessage) {
          showToast(response.message, 'success');
        }
      } else {
        // Hiển thị message lỗi từ API (không áp dụng điều kiện hasFetchedInitialData cho lỗi)
        if (response.message && showToastMessage) {
          showToast(response.message, 'error');
        }
      }
      
      // Đánh dấu đã fetch ít nhất 1 lần
      if (!hasFetchedInitialData) {
        setHasFetchedInitialData(true);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (showToastMessage) {
        showToast('Có lỗi xảy ra khi tải danh sách đặt phòng', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchBookings(true); // Hiển thị toast khi tìm kiếm
  };
const openReviewModal = (booking: BookingDto) => {
  setModalBooking(booking);
  setShowReviewModal(true);
};
  const clearFilters = () => {
    setBookingCodeFilter('');
    setPropertyNameFilter('');
    setFromDate('');
    setToDate('');
    setStatusFilter('');
    setPaymentFilter('');
    // FIX: Không hiển thị toast khi xóa bộ lọc
    fetchBookings(false);
  };

  // FIX: Tự động áp dụng bộ lọc khi thay đổi filter (debounced)
  useEffect(() => {
    if (hasFetchedInitialData) {
      const timeoutId = setTimeout(() => {
        fetchBookings(false); // Không hiển thị toast khi filter thay đổi
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [bookingCodeFilter, propertyNameFilter, fromDate, toDate, statusFilter, paymentFilter]);

  const handleViewDetail = async (booking: BookingDto) => {
    try {
      const response = await bookingService.getBookingById(booking.id);
      if (response.success && response.data) {
        setSelectedBooking(response.data);
        // FIX: Chỉ hiển thị toast khi có message từ API
        if (response.message) {
          showToast(response.message, 'success');
        }
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi tải chi tiết đặt phòng', 'error');
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
      showToast('Có lỗi xảy ra khi tải chi tiết đặt phòng', 'error');
    }
  };

  const handleDownloadReceipt = async (bookingId: number) => {
    try {
      const blob = await bookingService.downloadBookingReceipt(bookingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-${bookingId}-receipt.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Tải hóa đơn thành công', 'success');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      showToast('Có lỗi xảy ra khi tải hóa đơn', 'error');
    }
  };

  const openCancelModal = (booking: BookingDto) => {
    setModalBooking(booking);
    setShowCancelModal(true);
  };

  const openRefundModal = (booking: BookingDto) => {
    setModalBooking(booking);
    setShowRefundModal(true);
  };

  const handleModalSuccess = (message?: string) => {
    fetchBookings(); // Refresh bookings list
    // FIX: Chỉ hiển thị message từ modal nếu có
    if (message) {
      showToast(message, 'success');
    }
  };

  const BookingCard = ({ booking }: { booking: BookingDto }) => (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold mb-2">{booking.propertyName}</h3>
            <p className="text-pink-100 font-medium">{booking.roomTypeName}</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Mã đặt phòng</div>
            <div className="font-mono font-bold">{booking.bookingCode}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Status badges */}
        <div className="flex gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${bookingService.getStatusColor(booking.status)}`}>
            {bookingService.getStatusText(booking.status)}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${bookingService.getPaymentStatusColor(booking.paymentStatus)}`}>
            {bookingService.getPaymentStatusText(booking.paymentStatus)}
          </span>
        </div>

        {/* Thông tin chính */}
        <div className="space-y-4">
          {/* Thời gian */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nhận phòng</p>
                  <p className="font-semibold text-purple-900">{bookingService.formatDate(booking.checkIn)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trả phòng</p>
                  <p className="font-semibold text-purple-900">{bookingService.formatDate(booking.checkOut)}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-purple-700">
                {booking.nights} đêm • {booking.roomsCount} phòng
              </div>
            </div>
          </div>

          {/* Thông tin khách */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <Users className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900">{booking.guestName}</p>
              <p className="text-sm text-gray-600">{booking.adults} người lớn • {booking.children} trẻ em</p>
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span className="text-gray-700">Tổng tiền</span>
            </div>
            <span className="text-2xl font-bold text-emerald-700">
              {bookingService.formatCurrency(booking.totalAmount)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleViewDetail(booking)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
          >
            <Eye className="w-4 h-4" />
            Xem chi tiết
          </button>
          
          <button
            onClick={() => handleDownloadReceipt(booking.id)}
            className="px-4 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-xl hover:from-indigo-200 hover:to-purple-200 transition-all duration-300 font-medium"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Cancel button */}
          {bookingService.canCancelBooking(booking) && (
            <button
              onClick={() => openCancelModal(booking)}
              className="px-4 py-3 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 rounded-xl hover:from-red-200 hover:to-pink-200 transition-all duration-300 font-medium"
              title="Hủy đặt phòng"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Refund button */}
          {bookingService.canRequestRefund(booking) && (
            <button
              onClick={() => openRefundModal(booking)}
              className="px-4 py-3 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 rounded-xl hover:from-yellow-200 hover:to-orange-200 transition-all duration-300 font-medium"
              title="Yêu cầu hoàn tiền"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          )}
          {booking.status === 'completed' && (
  <button
    onClick={() => openReviewModal(booking)}
    className="px-4 py-3 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-xl hover:from-amber-200 hover:to-yellow-200 transition-all duration-300 font-medium"
    title="Đánh giá"
  >
    <Star className="w-4 h-4" />
  </button>
)}
        </div>
      </div>
    </div>
  );

  // FIX: Cập nhật màu nền modal chi tiết thành hồng tím
  const BookingDetailModal = ({ booking, onClose }: { booking: BookingDetailDto; onClose: () => void }) => (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 p-6 text-white rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{booking.propertyName}</h2>
              <p className="text-pink-100">{booking.bookingCode}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${bookingService.getStatusColor(booking.status)}`}>
              {bookingService.getStatusText(booking.status)}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${bookingService.getPaymentStatusColor(booking.paymentStatus)}`}>
              {bookingService.getPaymentStatusText(booking.paymentStatus)}
            </span>
          </div>

          {/* Detailed Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-purple-100 pb-2">
                Thông tin phòng
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">{booking.roomTypeName}</p>
                    <p className="text-sm text-gray-600">{booking.roomsCount} phòng</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Thời gian lưu trú</p>
                    <p className="text-sm text-gray-600">
                      {bookingService.formatDate(booking.checkIn)} - {bookingService.formatDate(booking.checkOut)}
                    </p>
                    <p className="text-xs text-purple-600">{booking.nights} đêm</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Số lượng khách</p>
                    <p className="text-sm text-gray-600">{booking.adults} người lớn, {booking.children} trẻ em</p>
                  </div>
                </div>
                {booking.specialRequests && (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Yêu cầu đặc biệt</p>
                      <p className="text-sm text-gray-600">{booking.specialRequests}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-purple-100 pb-2">
                Thông tin khách hàng
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{booking.guestName}</p>
                    <p className="text-sm text-gray-600">Khách chính</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{booking.guestPhone}</p>
                    <p className="text-sm text-gray-600">Số điện thoại</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{booking.guestEmail}</p>
                    <p className="text-sm text-gray-600">Email</p>
                  </div>
                </div>
                {booking.guestIdNumber && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{booking.guestIdNumber}</p>
                      <p className="text-sm text-gray-600">CMND/CCCD</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết thanh toán</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Giá phòng ({booking.nights} đêm)</span>
                <span className="font-medium">{bookingService.formatCurrency(booking.roomPrice)}</span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Giảm giá ({booking.discountPercent}%)</span>
                  <span className="font-medium text-green-600">-{bookingService.formatCurrency(booking.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Thuế</span>
                <span className="font-medium">{bookingService.formatCurrency(booking.taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phí dịch vụ</span>
                <span className="font-medium">{bookingService.formatCurrency(booking.serviceFee)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Tổng tiền</span>
                <span className="text-2xl font-bold text-emerald-700">
                  {bookingService.formatCurrency(booking.totalAmount)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <span>Ngày đặt: {bookingService.formatDate(booking.bookingDate)}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${bookingService.getPaymentStatusColor(booking.paymentStatus)}`}>
                {bookingService.getPaymentStatusText(booking.paymentStatus)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => handleDownloadReceipt(booking.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium"
            >
              <Download className="w-4 h-4" />
              Tải hóa đơn
            </button>
            
            {bookingService.canCancelBooking(booking) && (
              <button 
                onClick={() => {
                  onClose();
                  const bookingDto = bookings.find(b => b.id === booking.id);
                  if (bookingDto) openCancelModal(bookingDto);
                }}
                className="flex-1 px-4 py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
              >
                <X className="w-4 h-4 inline mr-2" />
                Hủy đặt phòng
              </button>
            )}

            {bookingService.canRequestRefund(booking) && (
              <button 
                onClick={() => {
                  onClose();
                  const bookingDto = bookings.find(b => b.id === booking.id);
                  if (bookingDto) openRefundModal(bookingDto);
                }}
                className="flex-1 px-4 py-3 border-2 border-yellow-300 text-yellow-600 rounded-xl hover:bg-yellow-50 transition-colors font-medium"
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Yêu cầu hoàn tiền
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Đặt phòng của tôi
              </h1>
              <p className="text-gray-600 mt-1">Quản lý tất cả các đặt phòng của bạn</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  showFilters 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'bg-white text-purple-600 border-2 border-purple-200 hover:border-purple-400'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Only - Removed Search */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
            {/* FIX: Đã xóa nút "Áp dụng bộ lọc" vì bây giờ filter tự động áp dụng */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-purple-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã đặt phòng
                    </label>
                    <input
                      type="text"
                      value={bookingCodeFilter}
                      onChange={(e) => setBookingCodeFilter(e.target.value)}
                      className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                      placeholder="Nhập mã đặt phòng..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên khách sạn
                    </label>
                    <input
                      type="text"
                      value={propertyNameFilter}
                      onChange={(e) => setPropertyNameFilter(e.target.value)}
                      className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                      placeholder="Nhập tên khách sạn..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái đặt phòng
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
                      className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="pending">Đang chờ</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="checkedIn">Đã nhận phòng</option>
                      <option value="noShow">Không đến</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái thanh toán
                    </label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | '')}
                      className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="unpaid">Chưa thanh toán</option>
                      <option value="partial">Thanh toán một phần</option>
                      <option value="paid">Đã thanh toán</option>
                      <option value="refunded">Đã hoàn tiền</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng đặt phòng</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sắp tới</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                <p className="text-lg font-bold text-gray-900">
                  {bookingService.formatCurrency(
                    bookings.reduce((sum, b) => sum + b.totalAmount, 0)
                  )}
                </p>
              </div>
              
            </div>
          </div>
           <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 cursor-pointer group"
       onClick={() => window.location.href = '/refunds'}>
    <div className="flex items-center gap-4">
      <div className="p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl group-hover:scale-110 transition-transform">
        <DollarSign className="w-6 h-6 text-yellow-600" />
      </div>
      <div>
        <p className="text-sm text-gray-600">Yêu cầu hoàn tiền</p>
        
        <p className="text-xs text-purple-600 mt-1 group-hover:underline">
          Xem tất cả →
        </p>
      </div>
    </div>
  </div>
        </div>
                  
        {/* Bookings Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Đang tải danh sách đặt phòng...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
              <Calendar className="w-16 h-16 text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Chưa có đặt phòng nào</h3>
            <p className="text-gray-600 mb-6">Bạn chưa có đặt phòng nào. Hãy khám phá và đặt phòng ngay!</p>
            <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl">
              Khám phá khách sạn
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {bookings.length > 0 && (
          <div className="flex items-center justify-center mt-12">
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border-2 border-purple-200 text-purple-600 rounded-xl hover:border-purple-400 transition-colors disabled:opacity-50" disabled>
                Trước
              </button>
              <span className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium">
                1
              </span>
              <button className="px-4 py-2 border-2 border-purple-200 text-purple-600 rounded-xl hover:border-purple-400 transition-colors disabled:opacity-50" disabled>
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {/* Separate Cancel Modal */}
      {modalBooking && (
        <CancelBookingModal
          booking={modalBooking}
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setModalBooking(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Separate Refund Modal */}
      {modalBooking && (
        <RefundRequestModal
          booking={modalBooking}
          isOpen={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setModalBooking(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}
      {modalBooking && (
  <ReviewModal
    booking={modalBooking}
    isOpen={showReviewModal}
    onClose={() => {
      setShowReviewModal(false);
      setModalBooking(null);
    }}
    onSuccess={handleModalSuccess}
  />
)}
    </div>
  );
};

export default MyBookingsPage;
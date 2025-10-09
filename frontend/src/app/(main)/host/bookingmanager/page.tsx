'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, CheckCircle, XCircle, Clock, Users, Bed, MapPin, DollarSign, Eye, LogIn, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { bookingService } from '@/services/main/booking.service';
import { userService } from '@/services/main/user.service';
import { BookingDto, BookingDetailDto } from '@/types/main/booking';
import { useToast } from '@/components/ui/Toast';
import { RoomDetailModal } from '@/components/modals/BookingDetailModal';

const PropertiesManager = () => {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [propertyIdFilter, setPropertyIdFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetailDto | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const { showToast } = useToast();

  // Get unique property IDs and names
  const uniqueProperties = bookings.reduce((acc, booking) => {
    if (!acc.find(p => p.name === booking.propertyName)) {
      acc.push({ name: booking.propertyName });
    }
    return acc;
  }, [] as { name: string }[]);

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
const handleViewDetail = async (bookingId: number) => {
    try {
      setLoadingDetail(true);
      const response = await bookingService.getHostBookingDetail(bookingId);
      
      if (response.success && response.data) {
        setSelectedBooking(response.data);
        setShowDetailModal(true);
      } else {
        showToast(response.message || 'Không thể tải chi tiết đặt phòng', 'error');
      }
    } catch (error) {
      console.error('Error loading booking detail:', error);
      showToast('Lỗi khi tải chi tiết đặt phòng', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };
  const fetchBookings = async () => {
    if (!isAuthorized) return;
    
    try {
      setLoading(true);
      const response = await bookingService.getHostBookings(
        statusFilter || undefined,
        fromDate || undefined,
        toDate || undefined,
        propertyIdFilter ? parseInt(propertyIdFilter) : undefined
      );
      
      if (response.success && response.data) {
        setBookings(Array.isArray(response.data) ? response.data : []);
      } else {
        showToast(response.message || 'Không thể tải danh sách đặt phòng', 'error');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Lỗi khi tải danh sách đặt phòng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: number) => {
    try {
      const response = await bookingService.checkInBooking(bookingId);
      
      if (response.success) {
        showToast('Check-in thành công!', 'success');
        fetchBookings();
      } else {
        showToast(response.message || 'Không thể check-in', 'error');
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      showToast('Lỗi khi thực hiện check-in', 'error');
    }
  };

  const handleCheckOut = async (bookingId: number) => {
    try {
      const response = await bookingService.checkOutBooking(bookingId);
      
      if (response.success) {
        showToast('Check-out thành công!', 'success');
        fetchBookings();
      } else {
        showToast(response.message || 'Không thể check-out', 'error');
      }
    } catch (error) {
      console.error('Error during check-out:', error);
      showToast('Lỗi khi thực hiện check-out', 'error');
    }
  };

  const toggleBookingExpand = (bookingId: number) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchBookings();
    }
  }, [isAuthorized, statusFilter, fromDate, toDate, propertyIdFilter]);

  useEffect(() => {
    let filtered = bookings;
    
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredBookings(filtered);
  }, [bookings, searchTerm]);

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
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-pink-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Quản lý đặt phòng
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Tổng: {filteredBookings.length} đặt phòng
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
        {/* Mobile Search Bar */}
        <div className="lg:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm booking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Filters - Mobile Collapsible */}
        <div className={`bg-white rounded-2xl shadow-sm p-4 mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Desktop Search */}
            <div className="hidden lg:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm booking..."
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
                <option value="pending">Đang chờ</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="checkedIn">Đã nhận phòng</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="noShow">Không đến</option>
              </select>
            </div>

            {/* Property Filter */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-1">Property</label>
              <select
                value={propertyIdFilter}
                onChange={(e) => setPropertyIdFilter(e.target.value)}
                className="w-full border border-pink-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              >
                <option value="">Tất cả property</option>
                {uniqueProperties.map((property, index) => (
                  <option key={index} value={property.name}>
                    {property.name.length > 20 ? property.name.substring(0, 20) + '...' : property.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-pink-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-pink-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-pink-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-pink-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-pink-600">Đang tải danh sách đặt phòng...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bed className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Không có đặt phòng</h3>
            <p className="text-gray-600 mb-4">Chưa có đặt phòng nào phù hợp với bộ lọc của bạn.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setFromDate('');
                setToDate('');
                setPropertyIdFilter('');
              }}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                {/* Mobile Header - Always visible */}
                <div 
                  className="p-4 cursor-pointer lg:cursor-auto"
                  onClick={() => window.innerWidth < 1024 && toggleBookingExpand(booking.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                        <span className="font-bold text-pink-700 text-sm truncate">
                          {booking.bookingCode}
                        </span>
                      </div>
                      <p className="text-gray-800 font-medium truncate text-sm">
                        {booking.propertyName}
                      </p>
                      <p className="text-gray-600 text-xs truncate">{booking.guestName}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bookingService.getStatusColor(booking.status)}`}>
                        {bookingService.getStatusText(booking.status)}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-pink-500 transition-transform lg:hidden ${expandedBooking === booking.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Quick info for mobile */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600 lg:hidden">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{bookingService.formatDate(booking.checkIn, { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="font-bold text-pink-600">{bookingService.formatCurrency(booking.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Hidden on mobile unless expanded */}
                <div className={`border-t border-pink-50 ${window.innerWidth >= 1024 ? 'block' : expandedBooking === booking.id ? 'block' : 'hidden'}`}>
                  <div className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      {/* Guest Information */}
                      <div className="bg-pink-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-pink-600" />
                          <span className="font-semibold text-pink-700 text-sm">Thông tin khách</span>
                        </div>
                        <p className="text-gray-800 text-sm font-medium">{booking.guestName}</p>
                        <p className="text-gray-600 text-xs">{booking.guestEmail}</p>
                        <p className="text-gray-600 text-xs">SĐT: {booking.guestPhone || 'Chưa cập nhật'}</p>
                      </div>

                      {/* Booking Details */}
                      <div className="bg-purple-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-purple-700 text-sm">Thời gian</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Check-in:</span>
                            <p className="font-medium">{bookingService.formatDate(booking.checkIn, { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Check-out:</span>
                            <p className="font-medium">{bookingService.formatDate(booking.checkOut, { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-pink-600 font-bold">{booking.nights} đêm</span>
                          </div>
                        </div>
                      </div>

                      {/* Amount & Payment */}
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-pink-600" />
                          <span className="font-semibold text-pink-700 text-sm">Thanh toán</span>
                        </div>
                        <p className="text-lg font-bold text-pink-600 mb-1">
                          {bookingService.formatCurrency(booking.totalAmount)}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bookingService.getPaymentStatusColor(booking.paymentStatus)}`}>
                          {bookingService.getPaymentStatusText(booking.paymentStatus)}
                        </span>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-gray-50 rounded-xl p-3">
                      <div className="text-center">
                        <span className="text-gray-500 block">Người lớn</span>
                        <span className="font-bold text-pink-600">{booking.adults}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-500 block">Trẻ em</span>
                        <span className="font-bold text-pink-600">{booking.children}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-500 block">Số phòng</span>
                        <span className="font-bold text-pink-600">{booking.roomsCount}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-500 block">Loại phòng</span>
                        <span className="font-bold text-pink-600 truncate block">{booking.roomTypeName}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-pink-100">
                      {bookingService.canCheckIn(booking) && (
                        <button
                          onClick={() => handleCheckIn(booking.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <LogIn className="w-4 h-4" />
                          Check-in
                        </button>
                      )}
                      
                      {bookingService.canCheckOut(booking) && (
                        <button
                          onClick={() => handleCheckOut(booking.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <LogOut className="w-4 h-4" />
                          Check-out
                        </button>
                      )}

 <button
    onClick={() => handleViewDetail(booking.id)}
    disabled={loadingDetail}
    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Eye className="w-4 h-4" />
    {loadingDetail ? 'Đang tải...' : 'Xem chi tiết'}
  </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Count Mobile */}
        {!loading && filteredBookings.length > 0 && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl p-3 shadow-2xl z-20">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Tổng số booking:</span>
              <span className="font-bold text-lg">{filteredBookings.length}</span>
            </div>
          </div>
        )}
      </div>
      <RoomDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        booking={selectedBooking}
      />
    </div>
  );
};

export default PropertiesManager;
// components/modals/RoomDetailModal.tsx
'use client';

import React from 'react';
import { X, Calendar, Users, MapPin, DollarSign, Phone, Mail, CreditCard, Clock, CheckCircle, FileText } from 'lucide-react';
import { BookingDetailDto } from '@/types/main/booking';
import { bookingService } from '@/services/main/booking.service';

interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDetailDto | null;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'checkedIn': 'bg-green-100 text-green-800 border-green-200',
      'noShow': 'bg-orange-100 text-orange-800 border-orange-200',
      'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusColor = (status: string) => {
    const statusColors = {
      'unpaid': 'bg-orange-100 text-orange-800 border-orange-200',
      'partial': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'paid': 'bg-green-100 text-green-800 border-green-200',
      'refunded': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <>
      {/* Backdrop với màu hồng tím */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Chi tiết đặt phòng</h2>
                <p className="text-pink-100 mt-1">{booking.bookingCode}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-pink-600 rounded-full transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="p-6 space-y-6">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Thông tin booking */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Thông tin đặt phòng</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                        {bookingService.getStatusText(booking.status)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-600">Thanh toán:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {bookingService.getPaymentStatusText(booking.paymentStatus)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Ngày đặt:</span>
                      <span className="font-medium">{formatDateTime(booking.bookingDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Thông tin property */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Thông tin chỗ nghỉ</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-pink-600" />
                        <span className="font-semibold text-gray-800">{booking.propertyName}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{booking.roomTypeName}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{booking.adults} người lớn</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{booking.children} trẻ em</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thời gian và giá */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Thời gian */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-pink-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Thời gian lưu trú</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium">{formatDate(booking.checkIn)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium">{formatDate(booking.checkOut)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                      <span className="text-gray-600">Số đêm:</span>
                      <span className="font-bold text-pink-600">{booking.nights} đêm</span>
                    </div>
                  </div>
                </div>

                {/* Chi tiết giá */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-pink-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Chi tiết thanh toán</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Giá phòng ({booking.nights} đêm):</span>
                      <span>{formatCurrency(booking.roomPrice * booking.nights)}</span>
                    </div>
                    
                    {booking.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Giảm giá ({booking.discountPercent}%):</span>
                        <span>-{formatCurrency(booking.discountAmount)}</span>
                      </div>
                    )}
                    
                    {booking.taxAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Thuế:</span>
                        <span>{formatCurrency(booking.taxAmount)}</span>
                      </div>
                    )}
                    
                    {booking.serviceFee > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Phí dịch vụ:</span>
                        <span>{formatCurrency(booking.serviceFee)}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span className="text-gray-800">Tổng cộng:</span>
                        <span className="text-pink-600">{formatCurrency(booking.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin khách hàng */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-pink-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Thông tin khách hàng</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-800">{booking.guestName}</span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{booking.guestEmail}</span>
                      </div>
                      
                      {booking.guestPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{booking.guestPhone}</span>
                        </div>
                      )}
                      
                      {booking.guestIdNumber && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">CCCD: {booking.guestIdNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {booking.specialRequests && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-800">Yêu cầu đặc biệt</span>
                      </div>
                      <p className="text-gray-600 text-sm">{booking.specialRequests}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-pink-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Lịch sử trạng thái</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <span className="font-medium">Đặt phòng</span>
                      <p className="text-gray-600 text-sm">{formatDateTime(booking.bookingDate)}</p>
                    </div>
                  </div>
                  
                  {booking.confirmedAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                      <div>
                        <span className="font-medium">Xác nhận đặt phòng</span>
                        <p className="text-gray-600 text-sm">{formatDateTime(booking.confirmedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {booking.checkedInAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <span className="font-medium">Check-in</span>
                        <p className="text-gray-600 text-sm">{formatDateTime(booking.checkedInAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {booking.checkedOutAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <div>
                        <span className="font-medium">Check-out</span>
                        <p className="text-gray-600 text-sm">{formatDateTime(booking.checkedOutAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {booking.cancelledAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <span className="font-medium">Hủy đặt phòng</span>
                        <p className="text-gray-600 text-sm">{formatDateTime(booking.cancelledAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
              >
                In hóa đơn
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
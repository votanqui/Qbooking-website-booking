// components/modals/CancelBookingModal.tsx
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BookingDto } from '@/types/main/booking';
import { bookingService } from '@/services/main/booking.service';
import { useToast } from '@/components/ui/Toast';

interface CancelBookingModalProps {
  booking: BookingDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CancelBookingModal: React.FC<CancelBookingModalProps> = ({ 
  booking, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { showToast } = useToast();
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    try {
      setLoading(true);
      const response = await bookingService.cancelBooking(booking.id, { 
        reason: cancelReason || undefined 
      });

      if (response.success) {
        showToast(response.message || 'Hủy đặt phòng thành công!', 'success');
        onSuccess();
        onClose();
        setCancelReason('');
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi hủy đặt phòng', 'error');
      }
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      showToast('Có lỗi xảy ra khi hủy đặt phòng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCancelReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-pink-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
            Hủy đặt phòng
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-pink-50 rounded-full transition-colors text-pink-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-2">Bạn có chắc chắn muốn hủy đặt phòng:</p>
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg border border-pink-100">
            <p className="font-semibold text-gray-900">{booking.propertyName}</p>
            <p className="text-sm text-pink-600 font-medium">{booking.bookingCode}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do hủy (tùy chọn)
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none transition-colors"
            rows={3}
            placeholder="Nhập lý do hủy đặt phòng..."
          />
        </div>

        <div className="bg-gradient-to-r from-pink-50 to-red-50 p-3 rounded-lg mb-4 border border-pink-200">
          <p className="text-sm text-pink-800">
            <strong>Lưu ý:</strong> Việc hủy đặt phòng có thể áp dụng phí hủy theo chính sách của khách sạn.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-pink-300 text-pink-700 rounded-lg hover:bg-pink-50 transition-all duration-200 font-medium"
            disabled={loading}
          >
            Không
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Đang hủy...' : 'Xác nhận hủy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingModal;
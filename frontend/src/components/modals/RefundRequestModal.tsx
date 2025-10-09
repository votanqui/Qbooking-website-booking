// components/modals/RefundRequestModal.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { X, DollarSign } from 'lucide-react';
import { BookingDto, CreateRefundTicketRequest } from '@/types/main/booking';
import { bookingService } from '@/services/main/booking.service';
import { useToast } from '@/components/ui/Toast';

interface RefundRequestModalProps {
  booking: BookingDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RefundRequestModal: React.FC<RefundRequestModalProps> = ({ 
  booking, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Omit<CreateRefundTicketRequest, 'bookingId'>>({
    requestedAmount: booking.totalAmount,
    reason: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const updateFormData = useCallback((field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await bookingService.createRefundTicket({
        ...formData,
        bookingId: booking.id
      });

      if (response.message) {
        showToast(response.message, response.success ? 'success' : 'error');
      }

      if (response.success) {
        onSuccess();
        handleClose();
      }
    } catch (error: any) {
      console.error('Error creating refund ticket:', error);
      showToast(error.message || 'Có lỗi xảy ra khi tạo yêu cầu hoàn tiền', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      requestedAmount: booking.totalAmount,
      reason: '',
      bankName: '',
      bankAccountNumber: '',
      bankAccountName: ''
    });
    onClose();
  };

  const isFormValid = () => {
    return (
      formData.requestedAmount > 0 &&
      formData.requestedAmount <= booking.totalAmount &&
      formData.reason.trim() !== '' &&
      formData.bankName.trim() !== '' &&
      formData.bankAccountNumber.trim() !== '' &&
      formData.bankAccountName.trim() !== ''
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-pink-500/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-100">
        <div className="sticky top-0 bg-gradient-to-r from-pink-50 to-purple-50 rounded-t-2xl border-b border-pink-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Yêu cầu hoàn tiền
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-pink-100 rounded-full transition-colors text-pink-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
              <p className="font-semibold text-gray-900">{booking.propertyName}</p>
              <p className="text-sm text-pink-600 font-medium mb-2">{booking.bookingCode}</p>
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Tổng tiền: {bookingService.formatCurrency(booking.totalAmount)}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tiền yêu cầu hoàn <span className="text-pink-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.requestedAmount}
                  onChange={(e) => updateFormData('requestedAmount', Number(e.target.value))}
                  max={booking.totalAmount}
                  min={0}
                  className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-16 transition-colors"
                  placeholder="Nhập số tiền cần hoàn..."
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-600 text-sm font-medium">
                  VND
                </span>
              </div>
              <p className="text-xs text-pink-600 mt-1 font-medium">
                Tối đa: {bookingService.formatCurrency(booking.totalAmount)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hoàn tiền <span className="text-pink-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => updateFormData('reason', e.target.value)}
                className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none transition-colors"
                rows={3}
                placeholder="Nhập lý do yêu cầu hoàn tiền..."
              />
            </div>

            <div className="border-t border-pink-200 pt-5">
              <h4 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-4">
                Thông tin tài khoản nhận tiền
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên ngân hàng <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => updateFormData('bankName', e.target.value)}
                    className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                    placeholder="Ví dụ: Vietcombank, BIDV, Techcombank..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số tài khoản <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => updateFormData('bankAccountNumber', e.target.value)}
                    className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                    placeholder="Nhập số tài khoản..."
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên chủ tài khoản <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankAccountName}
                  onChange={(e) => updateFormData('bankAccountName', e.target.value)}
                  className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                  placeholder="Nhập tên chủ tài khoản (theo CMND/CCCD)..."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
            <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
              Lưu ý quan trọng:
            </p>
            <ul className="text-sm text-pink-700 mt-2 space-y-1 list-disc list-inside">
              <li>Yêu cầu hoàn tiền sẽ được xử lý trong vòng 3-5 ngày làm việc</li>
              <li>Chúng tôi sẽ liên hệ với bạn qua email để xác nhận thông tin</li>
              <li>Vui lòng kiểm tra kỹ thông tin tài khoản để tránh sai sót</li>
              <li>Phí hoàn tiền có thể được áp dụng theo chính sách của ngân hàng</li>
            </ul>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-pink-200">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-pink-300 text-pink-700 rounded-lg hover:bg-pink-50 transition-all duration-200 font-medium"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu hoàn tiền'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundRequestModal;
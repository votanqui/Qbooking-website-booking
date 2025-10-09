import React, { useState } from 'react';
import { X, Star, Upload, Loader } from 'lucide-react';
import { BookingDto } from '@/types/main/booking';
import { reviewService } from '@/services/main/review.service';
import { useToast } from '@/components/ui/Toast';

interface ReviewModalProps {
  booking: BookingDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ booking, isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Rating states
  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [locationRating, setLocationRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [amenitiesRating, setAmenitiesRating] = useState(0);
  
  // Text fields
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [travelType, setTravelType] = useState('');
  const [roomStayed, setRoomStayed] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Images
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 10) {
      showToast('Chỉ được tải lên tối đa 10 ảnh', 'error');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      showToast('Vui lòng chọn đánh giá tổng thể', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await reviewService.createReview({
        bookingId: booking.id,
        propertyId: booking.propertyId,
        overallRating,
        cleanlinessRating: cleanlinessRating || undefined,
        locationRating: locationRating || undefined,
        serviceRating: serviceRating || undefined,
        valueRating: valueRating || undefined,
        amenitiesRating: amenitiesRating || undefined,
        title: title || undefined,
        reviewText: reviewText || undefined,
        pros: pros || undefined,
        cons: cons || undefined,
        travelType: travelType || undefined,
        roomStayed: roomStayed || undefined,
        isAnonymous,
        images: images.length > 0 ? images : undefined,
      });
  
      if (response.success) {
        showToast(response.message || 'Đánh giá thành công!', 'success');
        onSuccess(response.message);
        onClose();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi gửi đánh giá', 'error');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('Có lỗi xảy ra khi gửi đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 p-6 text-white rounded-t-3xl sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Đánh giá lưu trú</h2>
              <p className="text-pink-100">{booking.propertyName}</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Overall Rating - Required */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl">
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              label="Đánh giá tổng thể *"
            />
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StarRating
              value={cleanlinessRating}
              onChange={setCleanlinessRating}
              label="Độ sạch sẽ"
            />
            <StarRating
              value={locationRating}
              onChange={setLocationRating}
              label="Vị trí"
            />
            <StarRating
              value={serviceRating}
              onChange={setServiceRating}
              label="Dịch vụ"
            />
            <StarRating
              value={valueRating}
              onChange={setValueRating}
              label="Giá trị"
            />
            <StarRating
              value={amenitiesRating}
              onChange={setAmenitiesRating}
              label="Tiện nghi"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề đánh giá
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              placeholder="Tóm tắt trải nghiệm của bạn..."
            />
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung đánh giá
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={2000}
              rows={4}
              className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              placeholder="Chia sẻ chi tiết về trải nghiệm của bạn..."
            />
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Điểm tốt
              </label>
              <textarea
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full p-3 border-2 border-green-100 rounded-xl focus:border-green-400 focus:ring-4 focus:ring-green-100"
                placeholder="Những gì bạn thích..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Điểm cần cải thiện
              </label>
              <textarea
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full p-3 border-2 border-red-100 rounded-xl focus:border-red-400 focus:ring-4 focus:ring-red-100"
                placeholder="Những gì cần cải thiện..."
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại hình du lịch
              </label>
              <select
                value={travelType}
                onChange={(e) => setTravelType(e.target.value)}
                className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              >
                <option value="">Chọn loại hình</option>
                <option value="solo">Du lịch một mình</option>
                <option value="couple">Du lịch cặp đôi</option>
                <option value="family">Du lịch gia đình</option>
                <option value="friends">Du lịch bạn bè</option>
                <option value="business">Công tác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phòng đã ở
              </label>
              <input
                type="text"
                value={roomStayed}
                onChange={(e) => setRoomStayed(e.target.value)}
                maxLength={100}
                className="w-full p-3 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                placeholder="VD: Phòng Deluxe 302"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh (Tối đa 10 ảnh)
            </label>
            <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
                disabled={images.length >= 10}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer flex flex-col items-center ${
                  images.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-12 h-12 text-purple-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Nhấp để tải ảnh lên ({images.length}/10)
                </span>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              Đánh giá ẩn danh
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || overallRating === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi đánh giá'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;